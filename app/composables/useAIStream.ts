import type { AgentRole, Message } from '../types/workflow';

export function useAIStream() {
    const isStreaming = useState('is-streaming', () => false);

    async function sendMessage(
        role: AgentRole,
        message: string,
        contextDocument?: string
    ): Promise<string> {
        const { addMessage, getSession, setAgentStatus } = useAgentChat();

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

                            if (data.error) {
                                throw new Error(data.error);
                            }

                            if (data.content) {
                                fullContent += data.content;
                                // Update the last message
                                const messages = session.messages;
                                messages[messages.length - 1].content = fullContent;
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

            setAgentStatus(role, 'idle');
            return fullContent;
        } catch (error) {
            setAgentStatus(role, 'error');
            console.error('Stream error:', error);
            throw error;
        } finally {
            isStreaming.value = false;
        }
    }

    return {
        isStreaming,
        sendMessage,
    };
}
