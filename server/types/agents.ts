// OpenAI Vision API compatible content types
export interface AITextContent {
    type: 'text';
    text: string;
}

export interface AIImageContent {
    type: 'image_url';
    image_url: {
        url: string; // base64 data URL or http URL
        detail?: 'auto' | 'low' | 'high';
    };
}

export type AIMessageContent = string | (AITextContent | AIImageContent)[];

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: AIMessageContent;
}

export interface AIStreamOptions {
    model: string;
    messages: AIMessage[];
    temperature?: number;
    max_tokens?: number;
    stream: true;
}

export interface AIStreamChunk {
    content: string;
    done: boolean;
}

export type AgentRole = 'ba' | 'sa' | 'dev';

export interface AgentContext {
    role: AgentRole;
    previousMessages: AIMessage[];
    contextDocument?: string;
    userInput?: string;
    referenceImages?: string[];
}
