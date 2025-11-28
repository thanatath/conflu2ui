import type { AgentRole, Message } from '../types/workflow';

// Error types for retry handling
export interface AIRetryError {
    message: string;
    code: 'TIMEOUT' | 'MAX_RETRIES' | 'API_ERROR' | 'NETWORK_ERROR';
    retriesAttempted: number;
    isRetryError: true;
}

export class AIStreamError extends Error {
    public readonly code?: string;
    public readonly retriesAttempted?: number;
    public readonly isRetryError: boolean;

    constructor(
        message: string,
        options?: {
            code?: string;
            retriesAttempted?: number;
            isRetryError?: boolean;
        }
    ) {
        super(message);
        this.name = 'AIStreamError';
        this.code = options?.code;
        this.retriesAttempted = options?.retriesAttempted;
        this.isRetryError = options?.isRetryError ?? false;
    }
}

export function useAIStream() {
    const isStreaming = useState('is-streaming', () => false);
    const lastError = useState<AIStreamError | null>('ai-stream-error', () => null);

    // Clear error state
    function clearError() {
        lastError.value = null;
    }

    async function sendMessage(
        role: AgentRole,
        message: string,
        contextDocument?: string
    ): Promise<string> {
        const { addMessage, getSession, setAgentStatus, removeLastMessage } = useAgentChat();

        // Add user message
        const userMessage: Message = {
            role: 'user',
            content: message,
            timestamp: Date.now(),
        };
        addMessage(role, userMessage);

        // Create assistant message placeholder
        const assistantMessage: Message = {
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
        };
        addMessage(role, assistantMessage);

        setAgentStatus(role, 'processing');
        isStreaming.value = true;

        try {
            const session = getSession(role);

            // Get conversation history properly:
            // 1. First, remove the last message (empty assistant placeholder we just added)
            // 2. Then, filter to only include user/assistant messages with content
            const conversationHistory = session.messages
                .slice(0, -1) // Remove the empty assistant placeholder
                .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content);

            const response = await fetch('/api/ai/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role,
                    messages: conversationHistory,
                    contextDocument: contextDocument || session.context,
                    // model will use default from server config
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            // Handle retry-related errors with enhanced info
                            if (data.error) {
                                const streamError = new AIStreamError(data.error, {
                                    code: data.code,
                                    retriesAttempted: data.retriesAttempted,
                                    isRetryError: data.isRetryError,
                                });
                                lastError.value = streamError;
                                throw streamError;
                            }

                            if (data.content) {
                                fullContent += data.content;
                                // Update the last message
                                const messages = session.messages;
                                const lastMessage = messages[messages.length - 1];
                                if (lastMessage) {
                                    lastMessage.content = fullContent;
                                }
                            }

                            if (data.done) {
                                break;
                            }
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                // Skip invalid JSON
                                continue;
                            }
                            throw e;
                        }
                    }
                }
            }

            // If no content was received, remove the empty assistant message
            if (!fullContent) {
                console.warn('[useAIStream] No content received from AI, removing empty assistant message');
                removeLastMessage(role);
                setAgentStatus(role, 'idle');
                clearError();
                return '';
            }

            setAgentStatus(role, 'idle');
            clearError();
            return fullContent;
        } catch (error) {
            // Remove empty assistant message on error to prevent showing empty bubble
            removeLastMessage(role);

            setAgentStatus(role, 'error');
            console.error('Stream error:', error);

            // Store error for UI display
            if (error instanceof AIStreamError) {
                lastError.value = error;
            } else {
                lastError.value = new AIStreamError(
                    error instanceof Error ? error.message : 'Unknown error occurred',
                    { isRetryError: false }
                );
            }

            throw error;
        } finally {
            isStreaming.value = false;
        }
    }

    return {
        isStreaming,
        lastError,
        sendMessage,
        clearError,
    };
}
