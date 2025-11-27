export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
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
