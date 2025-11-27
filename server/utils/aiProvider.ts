import type { AIMessage, AIStreamOptions, AIStreamChunk } from '../types/agents';

export async function* streamOpenAI(
    messages: AIMessage[],
    model?: string,
    temperature: number = 0.7
): AsyncGenerator<AIStreamChunk> {
    // Get AI provider configuration from runtime config
    const config = useRuntimeConfig();
    const API_URL = config.aiProviderApiUrl;
    const API_TOKEN = config.aiProviderApiToken;
    const DEFAULT_MODEL = config.aiProviderModel;

    // Use provided model or default from config
    const selectedModel = model || DEFAULT_MODEL;

    if (!API_TOKEN) {
        throw new Error('AI_PROVIDER_API_TOKEN environment variable is not set');
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`,
            'http-referer': 'https://cline.bot',
        },
        body: JSON.stringify({
            model: selectedModel,
            messages,
            temperature,
            stream: true,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Provider API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
        throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;

                if (trimmed.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        const content = json.choices?.[0]?.delta?.content;

                        if (content) {
                            yield {
                                content,
                                done: false,
                            };
                        }
                    } catch (e) {
                        // Skip invalid JSON
                        console.error('Failed to parse SSE data:', e);
                    }
                }
            }
        }

        yield { content: '', done: true };
    } finally {
        reader.releaseLock();
    }
}

export async function* streamAIResponse(
    messages: AIMessage[],
    model?: string,
    temperature: number = 0.7
): AsyncGenerator<AIStreamChunk> {
    // Currently using Z.ai API (configurable via env)
    // Future: Add provider detection and routing (OpenAI, Claude, Gemini, etc.)
    yield* streamOpenAI(messages, model, temperature);
}
