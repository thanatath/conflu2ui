<template>
    <div class="workflow-progress glass">
        <!-- Current Phase Header -->
        <div class="phase-header">
            <div class="phase-badge" :class="currentPhase">
                <span class="phase-icon">{{ getCurrentPhaseIcon() }}</span>
                <span class="phase-label">{{ getCurrentPhaseLabel() }}</span>
            </div>
        </div>

        <!-- Agent Flow - Horizontal -->
        <div class="agent-flow">
            <!-- BA Agent -->
            <div class="agent-node" :class="{ active: isAgentActive('ba'), completed: isAgentCompleted('ba') }">
                <div class="node-icon ba">📋</div>
                <div class="node-label">BA</div>
            </div>

            <!-- Arrow 1 -->
            <div class="flow-arrow" :class="{ active: isAgentCompleted('ba') }">
                <span>→</span>
            </div>

            <!-- SA Agent -->
            <div class="agent-node" :class="{ active: isAgentActive('sa'), completed: isAgentCompleted('sa') }">
                <div class="node-icon sa">🏗️</div>
                <div class="node-label">SA</div>
            </div>

            <!-- Arrow 2 -->
            <div class="flow-arrow" :class="{ active: isAgentCompleted('sa') }">
                <span>→</span>
            </div>

            <!-- DEV Agent -->
            <div class="agent-node" :class="{ active: isAgentActive('dev'), completed: isAgentCompleted('dev') }">
                <div class="node-icon dev">💻</div>
                <div class="node-label">DEV</div>
            </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
            <div class="progress-header">
                <span class="progress-label">Progress: </span>
                <span class="progress-text"> {{ progressPercentage }}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
            </div>
        </div>

        <!-- Step List -->
        <div class="steps-list">
            <div
                v-for="(step, index) in workflowSteps"
                :key="step.id"
                class="step-row"
                :class="{
                    active: currentStep === step.id,
                    completed: isStepCompleted(step.id)
                }"
            >
                <div class="step-marker">
                    <span v-if="isStepCompleted(step.id)">✓</span>
                    <span v-else>{{ index + 1 }}</span>
                </div>
                <span class="step-name">{{ step.title }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { WorkflowStep } from '../types/workflow';

const props = defineProps<{
    currentStep: WorkflowStep;
}>();

const agentFlow = [
    {
        id: 'ba',
        name: 'BA',
        role: 'Business Analyst',
        icon: '📋',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        steps: ['upload-story', 'upload-images', 'ba-conversation', 'ba-confirmation']
    },
    {
        id: 'sa',
        name: 'SA',
        role: 'System Analyst',
        icon: '🏗️',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        steps: ['sa-design']
    },
    {
        id: 'dev',
        name: 'DEV',
        role: 'Developer',
        icon: '💻',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        steps: ['dev-implementation', 'validation', 'preview', 'iteration']
    }
];

const workflowSteps = [
    { id: 'upload-story', title: 'Upload Story' },
    { id: 'upload-images', title: 'Reference Images' },
    { id: 'ba-conversation', title: 'BA Review' },
    { id: 'ba-confirmation', title: 'BA Summary' },
    { id: 'sa-design', title: 'SA Design' },
    { id: 'dev-implementation', title: 'DEV Build' },
    { id: 'validation', title: 'Validation' },
    { id: 'preview', title: 'Preview' },
    { id: 'iteration', title: 'Iterate' },
];

function isAgentActive(agentId: string): boolean {
    const agent = agentFlow.find(a => a.id === agentId);
    return agent ? agent.steps.includes(props.currentStep) : false;
}

function isAgentCompleted(agentId: string): boolean {
    const agent = agentFlow.find(a => a.id === agentId);
    if (!agent) return false;
    const currentIndex = workflowSteps.findIndex(s => s.id === props.currentStep);
    const lastStepIndex = Math.max(...agent.steps.map(s => workflowSteps.findIndex(ws => ws.id === s)));
    return currentIndex > lastStepIndex;
}

function isHandoffActive(index: number): boolean {
    return isAgentCompleted(agentFlow[index].id);
}

function getHandoffLabel(index: number): string {
    if (index === 0) return 'ส่งงาน';
    return 'ส่งต่อ';
}

function isStepCompleted(stepId: string): boolean {
    const currentIndex = workflowSteps.findIndex(s => s.id === props.currentStep);
    const stepIndex = workflowSteps.findIndex(s => s.id === stepId);
    return stepIndex < currentIndex;
}

const currentPhase = computed(() => {
    const agent = agentFlow.find(a => a.steps.includes(props.currentStep));
    return agent?.id || 'ba';
});

function getCurrentPhaseLabel(): string {
    const step = workflowSteps.find(s => s.id === props.currentStep);
    return step?.title || 'Getting Started';
}

function getCurrentPhaseIcon(): string {
    const phase = currentPhase.value;
    if (phase === 'ba') return '📋';
    if (phase === 'sa') return '🏗️';
    return '💻';
}

const progressPercentage = computed(() => {
    const currentIndex = workflowSteps.findIndex(s => s.id === props.currentStep);
    return Math.round(((currentIndex + 1) / workflowSteps.length) * 100);
});
</script>

<style scoped>
.workflow-progress {
    padding: 16px;
}

/* Phase Header */
.phase-header {
    margin-bottom: 16px;
    text-align: center;
}

.phase-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
}

.phase-badge.ba {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
    border: 1px solid rgba(118, 75, 162, 0.4);
    color: #a78bfa;
}

.phase-badge.sa {
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2));
    border: 1px solid rgba(245, 87, 108, 0.4);
    color: #f472b6;
}

.phase-badge.dev {
    background: linear-gradient(135deg, rgba(79, 172, 254, 0.2), rgba(0, 242, 254, 0.2));
    border: 1px solid rgba(0, 242, 254, 0.4);
    color: #22d3ee;
}

.phase-icon {
    font-size: 16px;
}

/* Agent Flow - Horizontal layout */
.agent-flow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 10px 8px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
}

.agent-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    opacity: 0.5;
    transition: all 0.3s ease;
    flex: 1;
    max-width: 70px;
}

.agent-node.active {
    opacity: 1;
    background: rgba(160, 80, 255, 0.1);
    border-color: rgba(160, 80, 255, 0.4);
    box-shadow: 0 0 20px rgba(160, 80, 255, 0.2);
}

.agent-node.completed {
    opacity: 0.8;
    background: rgba(80, 200, 120, 0.1);
    border-color: rgba(80, 200, 120, 0.3);
}

.node-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 16px;
}

.node-icon.ba { background: linear-gradient(135deg, #667eea, #764ba2); }
.node-icon.sa { background: linear-gradient(135deg, #f093fb, #f5576c); }
.node-icon.dev { background: linear-gradient(135deg, #4facfe, #00f2fe); }

.node-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
}

.agent-node.active .node-label,
.agent-node.completed .node-label {
    color: var(--text-primary);
}

.flow-arrow {
    color: var(--text-muted);
    font-size: 14px;
    opacity: 0.3;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.flow-arrow.active {
    opacity: 1;
    color: var(--success);
}

/* Progress Section */
.progress-section {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    padding: 0 2px;
}

.progress-bar {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #a78bfa, #22d3ee);
    border-radius: 3px;
    transition: width 0.5s ease;
}

.progress-text {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    min-width: 36px;
    text-align: right;
}

/* Steps List */
.steps-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.step-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    opacity: 0.4;
    transition: all 0.2s ease;
}

.step-row.completed {
    opacity: 0.65;
}

.step-row.active {
    opacity: 1;
    background: rgba(160, 80, 255, 0.1);
    border-left: 3px solid var(--primary);
}

.step-marker {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    flex-shrink: 0;
}

.step-row.active .step-marker {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white;
}

.step-row.completed .step-marker {
    background: var(--success);
    color: white;
}

.step-name {
    font-size: 11px;
    color: var(--text-secondary);
}

.step-row.active .step-name {
    color: var(--text-primary);
    font-weight: 500;
}

/* Responsive */
@media (max-width: 400px) {
    .agent-flow {
        gap: 4px;
        padding: 12px 8px;
    }

    .agent-node {
        padding: 8px 10px;
    }

    .node-icon {
        width: 32px;
        height: 32px;
        font-size: 16px;
    }
}

@media (max-width: 1024px) {
    .workflow-progress {
        margin-bottom: 24px;
    }
}
</style>
