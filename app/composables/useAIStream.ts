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

// Configuration for empty response retry
const EMPTY_RESPONSE_RETRY_CONFIG = {
    maxRetries: 3,
    retryDelayMs: 1000,
};

export function useAIStream() {
    const isStreaming = useState('is-streaming', () => false);
    const lastError = useState<AIStreamError | null>('ai-stream-error', () => null);
    const retryCount = useState('ai-stream-retry-count', () => 0);

    // Clear error state
    function clearError() {
        lastError.value = null;
    }

    // Helper function to perform the actual AI stream request
    async function performStreamRequest(
        role: AgentRole,
        session: ReturnType<typeof useAgentChat>['getSession'] extends (r: AgentRole) => infer T ? T : never,
        contextDocument?: string,
        referenceImages?: string[]
    ): Promise<string> {
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
                referenceImages: referenceImages || [],
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

        return fullContent;
    }

    async function sendMessage(
        role: AgentRole,
        message: string,
        contextDocument?: string,
        referenceImages?: string[]
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
        retryCount.value = 0;

        try {
            const session = getSession(role);
            let fullContent = '';
            let attempt = 0;

            // Retry loop for empty responses
            while (attempt <= EMPTY_RESPONSE_RETRY_CONFIG.maxRetries) {
                try {
                    fullContent = await performStreamRequest(role, session, contextDocument, referenceImages);

                    // Check if response is empty or blank
                    if (fullContent && fullContent.trim() !== '') {
                        // Valid response received
                        break;
                    }

                    // Response is empty - retry if we have attempts left
                    attempt++;
                    retryCount.value = attempt;

                    if (attempt <= EMPTY_RESPONSE_RETRY_CONFIG.maxRetries) {
                        console.warn(`[useAIStream] Empty response received (attempt ${attempt}/${EMPTY_RESPONSE_RETRY_CONFIG.maxRetries}), retrying...`);

                        // Remove the empty assistant message before retry
                        removeLastMessage(role);

                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, EMPTY_RESPONSE_RETRY_CONFIG.retryDelayMs));

                        // Add new assistant placeholder for retry
                        const retryAssistantMessage: Message = {
                            role: 'assistant',
                            content: '',
                            timestamp: Date.now(),
                        };
                        addMessage(role, retryAssistantMessage);
                    }
                } catch (streamError) {
                    // For actual errors (not empty responses), throw immediately
                    if (streamError instanceof AIStreamError) {
                        lastError.value = streamError;
                    }
                    throw streamError;
                }
            }

            // If still no content after all retries, handle gracefully
            if (!fullContent || fullContent.trim() === '') {
                console.warn('[useAIStream] No content received from AI after all retries, removing empty assistant message');
                removeLastMessage(role);
                setAgentStatus(role, 'idle');

                // Set error for UI to show
                lastError.value = new AIStreamError(
                    'ไม่ได้รับการตอบกลับจาก AI กรุณาลองอีกครั้ง',
                    { code: 'EMPTY_RESPONSE', isRetryError: true, retriesAttempted: attempt }
                );

                clearError();
                return '';
            }

            setAgentStatus(role, 'idle');
            retryCount.value = 0;
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
            retryCount.value = 0;
        }
    }

    return {
        isStreaming,
        lastError,
        retryCount,
        sendMessage,
        clearError,
    };
}
