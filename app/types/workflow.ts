export type WorkflowStep =
    | 'upload-story'
    | 'upload-images'
    | 'ba-conversation'
    | 'ba-confirmation'
    | 'sa-design'
    | 'dev-implementation'
    | 'validation'
    | 'preview'
    | 'iteration';

export type AgentRole = 'ba' | 'sa' | 'dev';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    isThinking?: boolean;
}

export interface AgentSession {
    role: AgentRole;
    messages: Message[];
    context: string; // markdown document passed between agents
    isActive: boolean;
    status: 'idle' | 'processing' | 'complete' | 'error';
}

export interface WorkflowContext {
    userStory: string;
    images: string[]; // base64 encoded images
    baDocument: string;
    saDocument: string;
    htmlPrototype: string;
    validationErrors: ValidationError[];
}

export interface ValidationError {
    line?: number;
    column?: number;
    message: string;
    severity: 'error' | 'warning';
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    suggestions: string[];
}
