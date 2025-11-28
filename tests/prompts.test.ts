import { describe, it, expect } from 'vitest';
import { AGENT_PROMPTS, getSystemPrompt, createContextMessage } from '../server/utils/prompts';
import type { AgentRole } from '../server/types/agents';

describe('AGENT_PROMPTS', () => {
    it('should have prompts for all agent roles', () => {
        const roles: AgentRole[] = ['ba', 'sa', 'dev'];
        roles.forEach(role => {
            expect(AGENT_PROMPTS[role]).toBeDefined();
            expect(typeof AGENT_PROMPTS[role]).toBe('string');
            expect(AGENT_PROMPTS[role].length).toBeGreaterThan(0);
        });
    });

    describe('BA prompt', () => {
        it('should include key BA responsibilities', () => {
            const prompt = AGENT_PROMPTS.ba;
            expect(prompt).toContain('Business Analyst');
            expect(prompt).toContain('User Story');
            expect(prompt).toContain('<!Q!>');
            expect(prompt).toContain('<!SUMMARY!>');
        });

        it('should emphasize BA cannot handoff to SA directly', () => {
            const prompt = AGENT_PROMPTS.ba;
            expect(prompt).toContain('ไม่สามารถส่งต่องานให้ SA เองได้');
        });

        it('should include question tag format', () => {
            const prompt = AGENT_PROMPTS.ba;
            expect(prompt).toContain('<!Q!>');
            expect(prompt).toContain('<!Q!>');
        });
    });

    describe('SA prompt', () => {
        it('should include key SA responsibilities', () => {
            const prompt = AGENT_PROMPTS.sa;
            expect(prompt).toContain('System Analyst');
            expect(prompt).toContain('UI/UX');
            expect(prompt).toContain('Vue.js');
        });

        it('should prohibit SVG usage', () => {
            const prompt = AGENT_PROMPTS.sa;
            expect(prompt).toContain('ห้ามใช้ SVG');
            expect(prompt).toContain('Emoji');
        });

        it('should include Tailwind CSS requirement', () => {
            const prompt = AGENT_PROMPTS.sa;
            expect(prompt).toContain('Tailwind CSS');
        });
    });

    describe('DEV prompt', () => {
        it('should include key DEV responsibilities', () => {
            const prompt = AGENT_PROMPTS.dev;
            expect(prompt).toContain('Vue.js Compiler');
            expect(prompt).toContain('Vue SFC');
        });

        it('should prohibit SVG usage (Rule 0)', () => {
            const prompt = AGENT_PROMPTS.dev;
            expect(prompt).toContain('ห้ามใช้ SVG');
            expect(prompt).toContain('FORBIDDEN');
        });

        it('should include HTML validation rules', () => {
            const prompt = AGENT_PROMPTS.dev;
            expect(prompt).toContain('HTML Tags ต้องสมบูรณ์');
            expect(prompt).toContain('FINAL CHECKLIST');
        });

        it('should include Vue template structure', () => {
            const prompt = AGENT_PROMPTS.dev;
            expect(prompt).toContain('<template>');
            expect(prompt).toContain('<script setup>');
            expect(prompt).toContain('<style scoped>');
        });
    });
});

describe('getSystemPrompt', () => {
    it('should return correct prompt for BA', () => {
        const prompt = getSystemPrompt('ba');
        expect(prompt).toBe(AGENT_PROMPTS.ba);
    });

    it('should return correct prompt for SA', () => {
        const prompt = getSystemPrompt('sa');
        expect(prompt).toBe(AGENT_PROMPTS.sa);
    });

    it('should return correct prompt for DEV', () => {
        const prompt = getSystemPrompt('dev');
        expect(prompt).toBe(AGENT_PROMPTS.dev);
    });
});

describe('createContextMessage', () => {
    it('should return empty string when no context', () => {
        expect(createContextMessage('ba', undefined)).toBe('');
        expect(createContextMessage('ba', '')).toBe('');
    });

    it('should format BA context correctly', () => {
        const context = 'This is a user story';
        const result = createContextMessage('ba', context);
        expect(result).toContain('User Story');
        expect(result).toContain(context);
    });

    it('should format SA context correctly', () => {
        const context = 'BA summary document';
        const result = createContextMessage('sa', context);
        expect(result).toContain('บทสรุปความต้องการจาก BA');
        expect(result).toContain(context);
    });

    it('should format DEV context correctly', () => {
        const context = 'SA spec document';
        const result = createContextMessage('dev', context);
        expect(result).toContain('สเปกจาก SA');
        expect(result).toContain(context);
    });

    it('should return raw context for unknown role', () => {
        const context = 'Some context';
        // @ts-expect-error Testing unknown role
        const result = createContextMessage('unknown', context);
        expect(result).toBe(context);
    });
});

