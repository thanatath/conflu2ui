import type { AIMessage, AIStreamChunk, AITextContent, AIImageContent } from '../types/agents';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { AIProviderError } from './aiProvider';

// Anthropic API constants
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    timeoutMs: 60000, // 60 seconds (Anthropic can be slower)
    retryDelayMs: 1000,
};

// Helper to delay execution
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if model is Anthropic/Claude model
export function isAnthropicModel(model: string): boolean {
    return model.startsWith('claude-');
}

// Convert OpenAI-style messages to Anthropic format
export function convertMessagesToAnthropic(messages: AIMessage[]): {
    system?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string | Array<{ type: string;[key: string]: unknown }> }>;
} {
    let systemPrompt: string | undefined;
    const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: string | Array<{ type: string;[key: string]: unknown }> }> = [];

    for (const msg of messages) {
        // Extract system message separately (Anthropic uses top-level system param)
        if (msg.role === 'system') {
            if (typeof msg.content === 'string') {
                systemPrompt = (systemPrompt ? systemPrompt + '\n\n' : '') + msg.content;
            } else {
                // Extract text from array content
                const textParts = msg.content
                    .filter((c): c is AITextContent => c.type === 'text')
                    .map(c => c.text);
                systemPrompt = (systemPrompt ? systemPrompt + '\n\n' : '') + textParts.join('\n');
            }
            continue;
        }

        // Convert user/assistant messages
        const role = msg.role as 'user' | 'assistant';

        if (typeof msg.content === 'string') {
            anthropicMessages.push({ role, content: msg.content });
        } else {
            // Convert multimodal content
            const anthropicContent: Array<{ type: string;[key: string]: unknown }> = [];

            for (const part of msg.content) {
                if (part.type === 'text') {
                    anthropicContent.push({ type: 'text', text: (part as AITextContent).text });
                } else if (part.type === 'image_url') {
                    const imageUrl = (part as AIImageContent).image_url.url;
                    // Handle base64 images
                    if (imageUrl.startsWith('data:')) {
                        const match = imageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
                        if (match) {
                            anthropicContent.push({
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: match[1],
                                    data: match[2],
                                },
                            });
                        }
                    } else {
                        // URL-based images
                        anthropicContent.push({
                            type: 'image',
                            source: { type: 'url', url: imageUrl },
                        });
                    }
                }
            }
            anthropicMessages.push({ role, content: anthropicContent });
        }
    }

    return { system: systemPrompt, messages: anthropicMessages };
}

// Parse Anthropic SSE format
export function* parseAnthropicSSELines(lines: string[]): Generator<AIStreamChunk> {
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Skip event: lines, we only care about data:
        if (trimmed.startsWith('event:')) continue;

        if (trimmed.startsWith('data: ')) {
            try {
                const json = JSON.parse(trimmed.slice(6));

                // Handle content_block_delta with text
                if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
                    const text = json.delta.text;
                    if (text) {
                        yield { content: text, done: false };
                    }
                }

                // Handle message_stop
                if (json.type === 'message_stop') {
                    yield { content: '', done: true };
                }
            } catch (e) {
                // Skip invalid JSON
                console.error('Failed to parse Anthropic SSE data:', e);
            }
        }
    }
}

// Fetch with timeout wrapper
async function fetchWithTimeout(
    url: string,
    options: RequestInit & { dispatcher?: ProxyAgent },
    timeoutMs: number,
    useProxy: boolean
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        let response: Response;
        if (useProxy && options.dispatcher) {
            response = await undiciFetch(url, {
                ...options,
                signal: controller.signal,
            }) as unknown as Response;
        } else {
            response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
        }
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Stream responses from Anthropic API
export async function* streamAnthropic(
    messages: AIMessage[],
    model?: string,
    temperature: number = 0.7
): AsyncGenerator<AIStreamChunk> {
    const config = useRuntimeConfig();
    const API_TOKEN = config.aiProviderApiToken;
    const PROXY_URL = config.aiProviderProxyUrl;

    // Remove claude- prefix for Anthropic API (e.g., claude-sonnet-4-5 -> claude-sonnet-4-5)
    // Actually keep as-is since Anthropic expects full model name
    const selectedModel = model || config.aiProviderModel;

    if (!API_TOKEN) {
        throw new Error('AI_PROVIDER_API_TOKEN environment variable is not set');
    }

    // Convert messages to Anthropic format
    const { system, messages: anthropicMessages } = convertMessagesToAnthropic(messages);

    const requestBody: Record<string, unknown> = {
        model: selectedModel,
        messages: anthropicMessages,
        max_tokens: 8192,
        temperature,
        stream: true,
    };

    if (system) {
        requestBody.system = system;
    }

    console.log('[Anthropic] Request:', {
        url: ANTHROPIC_API_URL,
        model: selectedModel,
        messagesCount: anthropicMessages.length,
        hasSystem: !!system,
        temperature,
        proxy: PROXY_URL ? '(using proxy)' : '(no proxy)',
    });

    let lastError: Error | undefined;
    let retriesAttempted = 0;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        retriesAttempted = attempt;

        try {
            console.log(`[Anthropic] Attempt ${attempt}/${RETRY_CONFIG.maxRetries}...`);

            const fetchOptions: RequestInit & { dispatcher?: ProxyAgent } = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_TOKEN,
                    'anthropic-version': ANTHROPIC_VERSION,
                },
                body: JSON.stringify(requestBody),
            };

            if (PROXY_URL) {
                fetchOptions.dispatcher = new ProxyAgent(PROXY_URL);
            }

            const response = await fetchWithTimeout(
                ANTHROPIC_API_URL,
                fetchOptions,
                RETRY_CONFIG.timeoutMs,
                !!PROXY_URL
            );

            console.log('[Anthropic] Response:', {
                status: response.status,
                statusText: response.statusText,
                attempt,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Anthropic] Error Response Body:', errorText);
                throw new AIProviderError(
                    `Anthropic API error: ${response.status} - ${errorText}`,
                    'API_ERROR',
                    attempt
                );
            }

            if (!response.body) {
                throw new AIProviderError('Response body is null', 'API_ERROR', attempt);
            }

            // Stream the response
            const decoder = new TextDecoder();
            let buffer = '';

            if (PROXY_URL) {
                for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
                    buffer += decoder.decode(chunk, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    yield* parseAnthropicSSELines(lines);
                }
            } else {
                const reader = response.body.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';
                        yield* parseAnthropicSSELines(lines);
                    }
                } finally {
                    reader.releaseLock();
                }
            }

            // Process remaining buffer
            if (buffer.trim()) {
                yield* parseAnthropicSSELines([buffer]);
            }

            yield { content: '', done: true };
            return;

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            const isTimeout = lastError.name === 'AbortError' ||
                lastError.message.includes('timeout') ||
                lastError.message.includes('aborted');

            const isNetworkError = lastError.message.includes('ECONNREFUSED') ||
                lastError.message.includes('ENOTFOUND') ||
                lastError.message.includes('network');

            console.error(`[Anthropic] Attempt ${attempt} failed:`, {
                error: lastError.message,
                isTimeout,
                isNetworkError,
            });

            if (attempt < RETRY_CONFIG.maxRetries) {
                console.log(`[Anthropic] Retrying in ${RETRY_CONFIG.retryDelayMs}ms...`);
                await delay(RETRY_CONFIG.retryDelayMs);
                continue;
            }

            const errorCode = isTimeout ? 'TIMEOUT' : isNetworkError ? 'NETWORK_ERROR' : 'MAX_RETRIES';
            throw new AIProviderError(
                `Anthropic request failed after ${RETRY_CONFIG.maxRetries} attempts: ${lastError.message}`,
                errorCode,
                retriesAttempted,
                lastError
            );
        }
    }
}

