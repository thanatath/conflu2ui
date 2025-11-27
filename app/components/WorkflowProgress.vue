<template>
    <div class="workflow-progress glass">
        <div class="progress-header">
            <h3>Multi-Agent Workflow</h3>
            <div class="current-step-badge">
                {{ getCurrentStepLabel() }}
            </div>
        </div>

        <div class="steps-container">
            <div v-for="(step, index) in workflowSteps" :key="step.id" class="step-item" :class="{
                active: currentStep === step.id,
                completed: isStepCompleted(step.id),
                upcoming: !isStepCompleted(step.id) && currentStep !== step.id
            }">
                <div class="step-number">
                    <span v-if="isStepCompleted(step.id)">✓</span>
                    <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="step-info">
                    <div class="step-title">{{ step.title }}</div>
                    <div class="step-description">{{ step.description }}</div>
                </div>
                <div v-if="index < workflowSteps.length - 1" class="step-connector"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { WorkflowStep } from '../types/workflow';

const props = defineProps<{
    currentStep: WorkflowStep;
}>();

const workflowSteps = [
    { id: 'upload-story', title: '📄 Upload Story', description: 'Provide user story document' },
    { id: 'upload-images', title: '🖼️ Reference Images', description: 'Optional screen mockups' },
    { id: 'ba-conversation', title: '📋 BA Review', description: 'Business Analyst clarification' },
    { id: 'ba-confirmation', title: '✓ BA Summary', description: 'Confirm requirements' },
    { id: 'sa-design', title: '🏗️ SA Design', description: 'System architecture & spec' },
    { id: 'dev-implementation', title: '💻 DEV Build', description: 'Developer implementation' },
    { id: 'validation', title: '✅ Validation', description: 'HTML syntax check' },
    { id: 'preview', title: '👁️ Preview', description: 'Interactive prototype' },
    { id: 'iteration', title: '🔄 Iterate', description: 'Refine & improve' },
];

function getCurrentStepLabel(): string {
    const step = workflowSteps.find(s => s.id === props.currentStep);
    return step ? `${step.title}` : '';
}

function isStepCompleted(stepId: string): boolean {
    const currentIndex = workflowSteps.findIndex(s => s.id === props.currentStep);
    const stepIndex = workflowSteps.findIndex(s => s.id === stepId);
    return stepIndex < currentIndex;
}
</script>

<style scoped>
.workflow-progress {
    padding: 24px;
    margin-bottom: 32px;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.progress-header h3 {
    font-size: 20px;
    margin: 0;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.current-step-badge {
    padding: 8px 16px;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    color: white;
}

.steps-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    position: relative;
}

.step-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 16px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    transition: all 0.3s ease;
    opacity: 0.5;
}

.step-item.completed {
    opacity: 0.7;
}

.step-item.active {
    opacity: 1;
    background: rgba(160, 80, 255, 0.1);
    border: 1px solid var(--primary);
    box-shadow: 0 0 20px rgba(160, 80, 255, 0.3);
    animation: pulse-glow 2s ease-in-out infinite;
}

.step-item.upcoming {
    opacity: 0.4;
}

.step-number {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--bg-card);
    border: 2px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
    margin-bottom: 12px;
    transition: all 0.3s ease;
}

.step-item.active .step-number {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    border-color: transparent;
    color: white;
    transform: scale(1.1);
}

.step-item.completed .step-number {
    background: var(--success);
    border-color: var(--success);
    color: white;
}

.step-info {
    width: 100%;
}

.step-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--text-primary);
}

.step-description {
    font-size: 12px;
    color: var(--text-muted);
}

@media (max-width: 768px) {
    .steps-container {
        grid-template-columns: 1fr;
    }
}
</style>
