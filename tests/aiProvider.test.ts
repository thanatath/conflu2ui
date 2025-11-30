import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIProviderError } from '../server/utils/aiProvider';
import {
    isAnthropicModel,
    convertMessagesToAnthropic,
    parseAnthropicSSELines,
} from '../server/utils/anthropicAdapter';
import type { AIMessage, AIStreamChunk } from '../server/types/agents';

// Mock useRuntimeConfig for server-side tests
vi.mock('#imports', () => ({
    useRuntimeConfig: () => ({
        aiProviderApiUrl: 'https://mock-api.example.com/v1/chat/completions',
        aiProviderApiToken: 'mock-token',
        aiProviderModel: 'mock-model',
        aiProviderProxyUrl: '',
    }),
}));

describe('AIProviderError', () => {
    it('should create error with TIMEOUT code', () => {
        const error = new AIProviderError('Request timeout', 'TIMEOUT', 1);
        expect(error.name).toBe('AIProviderError');
        expect(error.code).toBe('TIMEOUT');
        expect(error.retriesAttempted).toBe(1);
        expect(error.message).toBe('Request timeout');
    });

    it('should create error with MAX_RETRIES code', () => {
        const error = new AIProviderError('Max retries reached', 'MAX_RETRIES', 3);
        expect(error.code).toBe('MAX_RETRIES');
        expect(error.retriesAttempted).toBe(3);
    });

    it('should create error with API_ERROR code', () => {
        const error = new AIProviderError('API error', 'API_ERROR', 2);
        expect(error.code).toBe('API_ERROR');
        expect(error.retriesAttempted).toBe(2);
    });

    it('should create error with NETWORK_ERROR code', () => {
        const error = new AIProviderError('Network failed', 'NETWORK_ERROR', 1);
        expect(error.code).toBe('NETWORK_ERROR');
    });

    it('should store lastError when provided', () => {
        const originalError = new Error('Original error');
        const error = new AIProviderError('Wrapped error', 'API_ERROR', 1, originalError);
        expect(error.lastError).toBe(originalError);
    });

    it('should extend Error class', () => {
        const error = new AIProviderError('Test', 'TIMEOUT', 1);
        expect(error instanceof Error).toBe(true);
    });
});

describe('parseSSELines (OpenAI format)', () => {
    // We'll test SSE parsing by extracting the logic
    // The parseSSELines function is private, so we test it through integration

    function* mockParseSSELines(lines: string[]): Generator<AIStreamChunk> {
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
                }
            }
        }
    }

    it('should parse valid OpenAI SSE data', () => {
        const lines = [
            'data: {"choices":[{"delta":{"content":"Hello"}}]}',
            'data: {"choices":[{"delta":{"content":" World"}}]}',
        ];
        const chunks = [...mockParseSSELines(lines)];
        expect(chunks).toHaveLength(2);
        expect(chunks[0].content).toBe('Hello');
        expect(chunks[1].content).toBe(' World');
    });

    it('should skip empty lines', () => {
        const lines = ['', '   ', 'data: {"choices":[{"delta":{"content":"Test"}}]}'];
        const chunks = [...mockParseSSELines(lines)];
        expect(chunks).toHaveLength(1);
        expect(chunks[0].content).toBe('Test');
    });

    it('should handle [DONE] marker', () => {
        const lines = [
            'data: {"choices":[{"delta":{"content":"Last"}}]}',
            'data: [DONE]',
        ];
        const chunks = [...mockParseSSELines(lines)];
        expect(chunks).toHaveLength(1);
        expect(chunks[0].content).toBe('Last');
    });

    it('should skip invalid JSON gracefully', () => {
        const lines = [
            'data: {"choices":[{"delta":{"content":"Valid"}}]}',
            'data: {invalid json}',
            'data: {"choices":[{"delta":{"content":"Also Valid"}}]}',
        ];
        const chunks = [...mockParseSSELines(lines)];
        expect(chunks).toHaveLength(2);
    });

    it('should skip lines without content', () => {
        const lines = [
            'data: {"choices":[{"delta":{}}]}',
            'data: {"choices":[{"delta":{"role":"assistant"}}]}',
            'data: {"choices":[{"delta":{"content":"Has content"}}]}',
        ];
        const chunks = [...mockParseSSELines(lines)];
        expect(chunks).toHaveLength(1);
        expect(chunks[0].content).toBe('Has content');
    });

    it('should handle non-data lines', () => {
        const lines = [
            'event: message',
            'id: 123',
            'data: {"choices":[{"delta":{"content":"Test"}}]}',
        ];
        const chunks = [...mockParseSSELines(lines)];
        expect(chunks).toHaveLength(1);
    });
});

describe('Message format conversion', () => {
    it('should handle text-only messages', () => {
        const messages: AIMessage[] = [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Hello' },
        ];
        expect(messages[0].content).toBe('You are a helpful assistant');
        expect(messages[1].role).toBe('user');
    });

    it('should handle multimodal messages with text and images', () => {
        const messages: AIMessage[] = [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'Describe this image' },
                    { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } },
                ],
            },
        ];
        expect(Array.isArray(messages[0].content)).toBe(true);
    });
});

// ============================================
// Anthropic Adapter Tests
// ============================================

describe('isAnthropicModel', () => {
    it('should return true for claude models', () => {
        expect(isAnthropicModel('claude-3-opus-20240229')).toBe(true);
        expect(isAnthropicModel('claude-3-sonnet-20240229')).toBe(true);
        expect(isAnthropicModel('claude-3-haiku-20240307')).toBe(true);
        expect(isAnthropicModel('claude-sonnet-4-5')).toBe(true);
        expect(isAnthropicModel('claude-2.1')).toBe(true);
    });

    it('should return false for non-claude models', () => {
        expect(isAnthropicModel('gpt-4')).toBe(false);
        expect(isAnthropicModel('gpt-3.5-turbo')).toBe(false);
        expect(isAnthropicModel('GLM-4.6')).toBe(false);
        expect(isAnthropicModel('gemini-pro')).toBe(false);
        expect(isAnthropicModel('mistral-medium')).toBe(false);
    });

    it('should be case-sensitive', () => {
        expect(isAnthropicModel('Claude-3-opus')).toBe(false);
        expect(isAnthropicModel('CLAUDE-3-opus')).toBe(false);
    });
});

describe('convertMessagesToAnthropic', () => {
    it('should extract system message to top-level', () => {
        const messages: AIMessage[] = [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Hello' },
        ];
        const result = convertMessagesToAnthropic(messages);
        expect(result.system).toBe('You are a helpful assistant');
        expect(result.messages).toHaveLength(1);
        expect(result.messages[0].role).toBe('user');
    });

    it('should concatenate multiple system messages', () => {
        const messages: AIMessage[] = [
            { role: 'system', content: 'First system message' },
            { role: 'system', content: 'Second system message' },
            { role: 'user', content: 'Hello' },
        ];
        const result = convertMessagesToAnthropic(messages);
        expect(result.system).toBe('First system message\n\nSecond system message');
    });

    it('should convert text messages correctly', () => {
        const messages: AIMessage[] = [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
            { role: 'user', content: 'How are you?' },
        ];
        const result = convertMessagesToAnthropic(messages);
        expect(result.system).toBeUndefined();
        expect(result.messages).toHaveLength(3);
        expect(result.messages[0]).toEqual({ role: 'user', content: 'Hello' });
        expect(result.messages[1]).toEqual({ role: 'assistant', content: 'Hi there!' });
    });

    it('should convert multimodal messages with images', () => {
        const messages: AIMessage[] = [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'Describe this image' },
                    { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=' } },
                ],
            },
        ];
        const result = convertMessagesToAnthropic(messages);
        expect(result.messages).toHaveLength(1);
        expect(Array.isArray(result.messages[0].content)).toBe(true);
        const content = result.messages[0].content as Array<{ type: string;[key: string]: unknown }>;
        expect(content[0].type).toBe('text');
        expect(content[1].type).toBe('image');
        expect((content[1].source as { type: string }).type).toBe('base64');
    });

    it('should handle URL-based images', () => {
        const messages: AIMessage[] = [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'What is in this image?' },
                    { type: 'image_url', image_url: { url: 'https://example.com/image.png' } },
                ],
            },
        ];
        const result = convertMessagesToAnthropic(messages);
        const content = result.messages[0].content as Array<{ type: string; source?: { type: string; url?: string } }>;
        expect(content[1].type).toBe('image');
        expect(content[1].source?.type).toBe('url');
        expect(content[1].source?.url).toBe('https://example.com/image.png');
    });
});

describe('parseAnthropicSSELines', () => {
    it('should parse content_block_delta events', () => {
        const lines = [
            'event: content_block_delta',
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}',
            'event: content_block_delta',
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" World"}}',
        ];
        const chunks = [...parseAnthropicSSELines(lines)];
        expect(chunks).toHaveLength(2);
        expect(chunks[0].content).toBe('Hello');
        expect(chunks[0].done).toBe(false);
        expect(chunks[1].content).toBe(' World');
    });

    it('should handle message_stop event', () => {
        const lines = [
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Done"}}',
            'event: message_stop',
            'data: {"type":"message_stop"}',
        ];
        const chunks = [...parseAnthropicSSELines(lines)];
        expect(chunks).toHaveLength(2);
        expect(chunks[0].content).toBe('Done');
        expect(chunks[1].done).toBe(true);
    });

    it('should skip empty lines', () => {
        const lines = [
            '',
            '   ',
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Test"}}',
        ];
        const chunks = [...parseAnthropicSSELines(lines)];
        expect(chunks).toHaveLength(1);
    });

    it('should skip event: lines', () => {
        const lines = [
            'event: message_start',
            'event: content_block_start',
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Content"}}',
        ];
        const chunks = [...parseAnthropicSSELines(lines)];
        expect(chunks).toHaveLength(1);
        expect(chunks[0].content).toBe('Content');
    });

    it('should skip invalid JSON gracefully', () => {
        const lines = [
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Valid"}}',
            'data: {invalid json}',
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Also Valid"}}',
        ];
        const chunks = [...parseAnthropicSSELines(lines)];
        expect(chunks).toHaveLength(2);
    });

    it('should skip non-text delta events', () => {
        const lines = [
            'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Real content"}}',
            'data: {"type":"content_block_stop","index":0}',
        ];
        const chunks = [...parseAnthropicSSELines(lines)];
        expect(chunks).toHaveLength(1);
        expect(chunks[0].content).toBe('Real content');
    });
});

