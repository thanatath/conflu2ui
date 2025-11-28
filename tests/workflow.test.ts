import { describe, it, expect } from 'vitest';
import type { WorkflowStep, AgentRole, Message, AgentSession, WorkflowContext, ValidationError, ValidationResult } from '../app/types/workflow';

// Test workflow step ordering and transitions
describe('WorkflowStep', () => {
    const WORKFLOW_STEPS: WorkflowStep[] = [
        'upload-story',
        'upload-images',
        'ba-conversation',
        'ba-confirmation',
        'sa-design',
        'dev-implementation',
        'validation',
        'preview',
        'iteration',
    ];

    it('should have correct step ordering', () => {
        expect(WORKFLOW_STEPS).toHaveLength(9);
        expect(WORKFLOW_STEPS[0]).toBe('upload-story');
        expect(WORKFLOW_STEPS[WORKFLOW_STEPS.length - 1]).toBe('iteration');
    });

    it('should have ba-confirmation after ba-conversation', () => {
        const baConversationIndex = WORKFLOW_STEPS.indexOf('ba-conversation');
        const baConfirmationIndex = WORKFLOW_STEPS.indexOf('ba-confirmation');
        expect(baConfirmationIndex).toBe(baConversationIndex + 1);
    });

    it('should have validation before preview', () => {
        const validationIndex = WORKFLOW_STEPS.indexOf('validation');
        const previewIndex = WORKFLOW_STEPS.indexOf('preview');
        expect(validationIndex).toBeLessThan(previewIndex);
    });
});

describe('AgentRole', () => {
    const AGENT_ROLES: AgentRole[] = ['ba', 'sa', 'dev'];

    it('should have three agent roles', () => {
        expect(AGENT_ROLES).toHaveLength(3);
    });

    it('should follow BA → SA → DEV order', () => {
        expect(AGENT_ROLES[0]).toBe('ba');
        expect(AGENT_ROLES[1]).toBe('sa');
        expect(AGENT_ROLES[2]).toBe('dev');
    });
});

describe('Message interface', () => {
    it('should create valid user message', () => {
        const message: Message = {
            role: 'user',
            content: 'Test content',
            timestamp: Date.now(),
        };
        expect(message.role).toBe('user');
        expect(message.content).toBe('Test content');
        expect(message.isThinking).toBeUndefined();
    });

    it('should create assistant message with thinking flag', () => {
        const message: Message = {
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            isThinking: true,
        };
        expect(message.role).toBe('assistant');
        expect(message.isThinking).toBe(true);
    });
});

describe('AgentSession interface', () => {
    it('should create valid initial session', () => {
        const session: AgentSession = {
            role: 'ba',
            messages: [],
            context: '',
            isActive: true,
            status: 'idle',
        };
        expect(session.messages).toHaveLength(0);
        expect(session.isActive).toBe(true);
        expect(session.status).toBe('idle');
    });

    it('should support all status values', () => {
        const statuses: AgentSession['status'][] = ['idle', 'processing', 'complete', 'error'];
        statuses.forEach(status => {
            const session: AgentSession = {
                role: 'ba',
                messages: [],
                context: '',
                isActive: false,
                status,
            };
            expect(session.status).toBe(status);
        });
    });
});

describe('WorkflowContext interface', () => {
    it('should create valid initial context', () => {
        const context: WorkflowContext = {
            userStory: '',
            images: [],
            baDocument: '',
            saDocument: '',
            htmlPrototype: '',
            validationErrors: [],
        };
        expect(context.images).toEqual([]);
        expect(context.validationErrors).toEqual([]);
    });

    it('should support context with data', () => {
        const context: WorkflowContext = {
            userStory: 'User story content',
            images: ['base64image1', 'base64image2'],
            baDocument: 'BA summary',
            saDocument: 'SA spec',
            htmlPrototype: '<html></html>',
            validationErrors: [{ message: 'Error', severity: 'error' }],
        };
        expect(context.images).toHaveLength(2);
        expect(context.validationErrors).toHaveLength(1);
    });
});

describe('ValidationError interface', () => {
    it('should create error with location', () => {
        const error: ValidationError = {
            line: 10,
            column: 5,
            message: 'Missing tag',
            severity: 'error',
        };
        expect(error.line).toBe(10);
        expect(error.column).toBe(5);
    });

    it('should create error without location', () => {
        const error: ValidationError = {
            message: 'General error',
            severity: 'warning',
        };
        expect(error.line).toBeUndefined();
        expect(error.column).toBeUndefined();
    });
});

describe('ValidationResult interface', () => {
    it('should create valid result', () => {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            suggestions: [],
        };
        expect(result.isValid).toBe(true);
    });

    it('should create invalid result with suggestions', () => {
        const result: ValidationResult = {
            isValid: false,
            errors: [{ message: 'Error', severity: 'error' }],
            suggestions: ['Fix the error'],
        };
        expect(result.isValid).toBe(false);
        expect(result.suggestions).toContain('Fix the error');
    });
});

