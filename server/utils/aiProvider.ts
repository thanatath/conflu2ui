import type { AIMessage, AIStreamOptions, AIStreamChunk } from '../types/agents';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    timeoutMs: 30000, // 30 seconds
    retryDelayMs: 1000, // 1 second between retries
};

// Custom error class for retry-related errors
export class AIProviderError extends Error {
    constructor(
        message: string,
        public readonly code: 'TIMEOUT' | 'MAX_RETRIES' | 'API_ERROR' | 'NETWORK_ERROR',
        public readonly retriesAttempted: number,
        public readonly lastError?: Error
    ) {
        super(message);
        this.name = 'AIProviderError';
    }
}

// Helper to delay execution
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to parse SSE lines and yield chunks
function* parseSSELines(lines: string[]): Generator<AIStreamChunk> {
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
    const PROXY_URL = config.aiProviderProxyUrl;

    // Use provided model or default from config
    const selectedModel = model || DEFAULT_MODEL;

    if (!API_TOKEN) {
        throw new Error('AI_PROVIDER_API_TOKEN environment variable is not set');
    }

    const requestBody = {
        model: selectedModel,
        messages,
        temperature,
        stream: true,
    };

    console.log('[AI Provider] Request:', {
        url: API_URL,
        model: selectedModel,
        messagesCount: messages.length,
        temperature,
        proxy: PROXY_URL ? '(using proxy)' : '(no proxy)',
    });

    // Retry logic
    let lastError: Error | undefined;
    let retriesAttempted = 0;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        retriesAttempted = attempt;

        try {
            console.log(`[AI Provider] Attempt ${attempt}/${RETRY_CONFIG.maxRetries}...`);

            const fetchOptions: RequestInit & { dispatcher?: ProxyAgent } = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'http-referer': 'https://cline.bot',
                },
                body: JSON.stringify(requestBody),
            };

            if (PROXY_URL) {
                fetchOptions.dispatcher = new ProxyAgent(PROXY_URL);
            }

            const response = await fetchWithTimeout(
                API_URL,
                fetchOptions,
                RETRY_CONFIG.timeoutMs,
                !!PROXY_URL
            );

            console.log('[AI Provider] Response:', {
                status: response.status,
                statusText: response.statusText,
                attempt,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[AI Provider] Error Response Body:', errorText);
                throw new AIProviderError(
                    `AI Provider API error: ${response.status} - ${errorText}`,
                    'API_ERROR',
                    attempt
                );
            }

            if (!response.body) {
                throw new AIProviderError('Response body is null', 'API_ERROR', attempt);
            }

            // Success! Stream the response
            const decoder = new TextDecoder();
            let buffer = '';

            if (PROXY_URL) {
                // Undici returns async iterable body
                for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
                    buffer += decoder.decode(chunk, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    yield* parseSSELines(lines);
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
                        yield* parseSSELines(lines);
                    }
                } finally {
                    reader.releaseLock();
                }
            }

            // Process remaining buffer
            if (buffer.trim()) {
                yield* parseSSELines([buffer]);
            }

            yield { content: '', done: true };
            return; // Success - exit the retry loop

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if it's a timeout/abort error
            const isTimeout = lastError.name === 'AbortError' ||
                lastError.message.includes('timeout') ||
                lastError.message.includes('aborted');

            const isNetworkError = lastError.message.includes('ECONNREFUSED') ||
                lastError.message.includes('ENOTFOUND') ||
                lastError.message.includes('network');

            console.error(`[AI Provider] Attempt ${attempt} failed:`, {
                error: lastError.message,
                isTimeout,
                isNetworkError,
            });

            // If we haven't exhausted retries, wait and try again
            if (attempt < RETRY_CONFIG.maxRetries) {
                console.log(`[AI Provider] Retrying in ${RETRY_CONFIG.retryDelayMs}ms...`);
                await delay(RETRY_CONFIG.retryDelayMs);
                continue;
            }

            // All retries exhausted
            const errorCode = isTimeout ? 'TIMEOUT' : isNetworkError ? 'NETWORK_ERROR' : 'MAX_RETRIES';
            throw new AIProviderError(
                `AI request failed after ${RETRY_CONFIG.maxRetries} attempts: ${lastError.message}`,
                errorCode,
                retriesAttempted,
                lastError
            );
        }
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
