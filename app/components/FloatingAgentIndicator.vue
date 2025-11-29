<template>
  <div class="floating-agent-container" :class="{ expanded: isExpanded }">
    <!-- Mini Agent Pills (when collapsed) -->
    <div class="agent-pills" @click="isExpanded = !isExpanded">
      <TransitionGroup name="pill">
        <div 
          v-for="agent in orderedAgents" 
          :key="agent.id"
          class="agent-pill"
          :class="[
            agent.id, 
            { 
              active: agent.isActive, 
              thinking: agent.isThinking,
              complete: agent.status === 'complete'
            }
          ]"
        >
          <img 
            :src="getAgentImage(agent)" 
            :alt="agent.name"
            class="pill-avatar"
          />
          <div v-if="agent.isThinking" class="thinking-ring"></div>
          <div v-if="agent.status === 'complete'" class="complete-check">✓</div>
        </div>
      </TransitionGroup>
      
      <!-- Expand/Collapse button -->
      <button class="expand-btn" :class="{ rotated: isExpanded }">
        <span>{{ isExpanded ? '▼' : '▲' }}</span>
      </button>
    </div>

    <!-- Expanded Panel -->
    <Transition name="panel">
      <div v-if="isExpanded" class="expanded-panel glass">
        <div class="panel-header">
          <span class="panel-title">🤖 AI Team</span>
          <span class="phase-badge" :class="currentPhase">{{ currentPhaseName }}</span>
        </div>

        <!-- Active Agent Spotlight -->
        <div v-if="activeAgent" class="agent-spotlight" :class="[activeAgent.id, { thinking: activeAgent.isThinking }]">
          <div class="spotlight-glow"></div>
          <img :src="getAgentImage(activeAgent)" :alt="activeAgent.name" class="spotlight-avatar" />
          <div class="spotlight-info">
            <span class="spotlight-name">{{ activeAgent.name }}</span>
            <span class="spotlight-status" :class="activeAgent.statusClass">
              <span class="status-pulse"></span>
              {{ activeAgent.statusText }}
            </span>
          </div>
        </div>

        <div class="agents-showcase">
          <div
            v-for="agent in orderedAgents"
            :key="agent.id"
            class="agent-card"
            :class="[agent.id, { active: agent.isActive, thinking: agent.isThinking }]"
          >
            <div class="card-glow"></div>
            <div class="avatar-wrapper">
              <img :src="getAgentImage(agent)" :alt="agent.name" class="agent-avatar" />
            </div>
            <div class="agent-info">
              <span class="agent-name">{{ agent.name }}</span>
              <span class="agent-status" :class="agent.statusClass">
                <span class="status-dot"></span>
                {{ agent.statusText }}
              </span>
            </div>
          </div>
        </div>

        <!-- Progress Flow -->
        <div class="progress-flow">
          <div class="flow-track">
            <div class="flow-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="flow-labels">
            <span :class="{ active: currentPhase === 'ba' }">Analysis</span>
            <span :class="{ active: currentPhase === 'sa' }">Design</span>
            <span :class="{ active: currentPhase === 'dev' }">Build</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { WorkflowStep, AgentSession } from '../types/workflow';

const props = defineProps<{
  currentStep: WorkflowStep;
  sessions: Record<'ba' | 'sa' | 'dev', AgentSession>;
  isStreaming: boolean;
  currentAgent: string | null;
}>();

const isExpanded = ref(true);

// Steps mapping
const baSteps = ['upload-story', 'upload-images', 'ba-conversation', 'ba-confirmation'];
const saSteps = ['sa-design'];
const devSteps = ['dev-implementation', 'validation', 'preview', 'iteration'];
const allSteps = [...baSteps, ...saSteps, ...devSteps];

// Current phase
const currentPhase = computed(() => {
  if (baSteps.includes(props.currentStep)) return 'ba';
  if (saSteps.includes(props.currentStep)) return 'sa';
  return 'dev';
});

const currentPhaseName = computed(() => {
  if (currentPhase.value === 'ba') return 'Analyzing';
  if (currentPhase.value === 'sa') return 'Designing';
  return 'Building';
});

const progressPercent = computed(() => {
  const idx = allSteps.indexOf(props.currentStep);
  return Math.round(((idx + 1) / allSteps.length) * 100);
});

// Agent data
const orderedAgents = computed(() => {
  const agents = [
    { id: 'ba', name: 'BA', fullName: 'Business Analyst', steps: baSteps },
    { id: 'sa', name: 'SA', fullName: 'System Analyst', steps: saSteps },
    { id: 'dev', name: 'DEV', fullName: 'Developer', steps: devSteps }
  ];

  return agents.map(a => {
    const session = props.sessions[a.id as 'ba' | 'sa' | 'dev'];
    const isActive = a.steps.includes(props.currentStep);
    const isThinking = isActive && props.isStreaming && props.currentAgent === a.id;
    const currentIdx = allSteps.indexOf(props.currentStep);
    const lastStepIdx = Math.max(...a.steps.map(s => allSteps.indexOf(s)));
    const isComplete = currentIdx > lastStepIdx || session.status === 'complete';

    let statusText = 'Waiting';
    let statusClass = 'idle';
    if (isThinking) { statusText = 'Thinking...'; statusClass = 'thinking'; }
    else if (session.status === 'processing') { statusText = 'Working'; statusClass = 'processing'; }
    else if (isComplete) { statusText = 'Done'; statusClass = 'complete'; }
    else if (isActive) { statusText = 'Ready'; statusClass = 'active'; }

    return { ...a, isActive, isThinking, status: session.status, statusText, statusClass, isComplete };
  });
});

const activeAgent = computed(() => {
  return orderedAgents.value.find(a => a.isActive) || orderedAgents.value[0];
});

function getAgentImage(agent: { id: string; isThinking: boolean }) {
  const suffix = agent.isThinking ? '_Thinking' : '';
  return `/images/${agent.id.toUpperCase()}${suffix}.png`;
}
</script>

<style scoped>
.floating-agent-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}

/* Agent Pills - Collapsed State */
.agent-pills {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: rgba(20, 20, 35, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  cursor: pointer;
  transition: all 0.3s ease;
}

.agent-pills:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(160, 80, 255, 0.2);
}

.agent-pill {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: visible;
  transition: all 0.3s ease;
  opacity: 0.4;
  filter: grayscale(0.8);
}

.agent-pill.active, .agent-pill.complete {
  opacity: 1;
  filter: grayscale(0);
}

.agent-pill.thinking {
  animation: pill-pulse 1s ease-in-out infinite;
}

@keyframes pill-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.pill-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid transparent;
  transition: all 0.3s ease;
}

.agent-pill.active .pill-avatar {
  border-color: var(--agent-color);
  box-shadow: 0 0 12px var(--agent-color);
}

.agent-pill.ba { --agent-color: #a78bfa; }
.agent-pill.sa { --agent-color: #f472b6; }
.agent-pill.dev { --agent-color: #22d3ee; }

.thinking-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: var(--agent-color);
  animation: ring-spin 1s linear infinite;
}

@keyframes ring-spin {
  to { transform: rotate(360deg); }
}

.complete-check {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 22px;
  height: 22px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: white;
  font-weight: bold;
}

.expand-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.expand-btn.rotated {
  transform: rotate(180deg);
}

/* Expanded Panel */
.expanded-panel {
  width: 100%;
  padding: 24px;
  background: rgba(20, 20, 35, 0.98);
  backdrop-filter: blur(24px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-title {
  font-weight: 700;
  font-size: 18px;
}

.phase-badge {
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
}

.phase-badge.ba { background: rgba(167, 139, 250, 0.2); color: #a78bfa; }
.phase-badge.sa { background: rgba(244, 114, 182, 0.2); color: #f472b6; }
.phase-badge.dev { background: rgba(34, 211, 238, 0.2); color: #22d3ee; }

/* Agent Spotlight - Big Avatar Display */
.agent-spotlight {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  margin-bottom: 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.agent-spotlight.ba { --spot-color: #a78bfa; --spot-rgb: 167, 139, 250; }
.agent-spotlight.sa { --spot-color: #f472b6; --spot-rgb: 244, 114, 182; }
.agent-spotlight.dev { --spot-color: #22d3ee; --spot-rgb: 34, 211, 238; }

.spotlight-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 30%, rgba(var(--spot-rgb), 0.15), transparent 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.agent-spotlight.thinking .spotlight-glow {
  opacity: 1;
  animation: spotlight-pulse 2s ease-in-out infinite;
}

@keyframes spotlight-pulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.spotlight-avatar {
  width: 220px;
  height: 220px;
  object-fit: contain;
  border-radius: 24px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  filter: drop-shadow(0 12px 32px rgba(var(--spot-rgb), 0.4));
}

.agent-spotlight.thinking .spotlight-avatar {
  animation: spotlight-float 2s ease-in-out infinite;
}

@keyframes spotlight-float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
}

.spotlight-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1;
}

.spotlight-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.spotlight-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
}

.spotlight-status.thinking {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
}
.spotlight-status.active {
  color: var(--spot-color);
  background: rgba(var(--spot-rgb), 0.1);
}
.spotlight-status.complete {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}
.spotlight-status.idle {
  color: #6b7280;
}

.status-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.spotlight-status.thinking .status-pulse {
  animation: pulse-glow 1s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

.agents-showcase {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.agent-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  opacity: 0.5;
}

.agent-card.active, .agent-card.thinking {
  opacity: 1;
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.agent-card.thinking {
  border-color: var(--agent-color);
  box-shadow: 0 0 24px rgba(var(--agent-rgb), 0.25);
}

.agent-card.ba { --agent-color: #a78bfa; --agent-rgb: 167, 139, 250; }
.agent-card.sa { --agent-color: #f472b6; --agent-rgb: 244, 114, 182; }
.agent-card.dev { --agent-color: #22d3ee; --agent-rgb: 34, 211, 238; }

.card-glow {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  opacity: 0;
  background: radial-gradient(circle at 30% 50%, var(--agent-color) 0%, transparent 60%);
  transition: opacity 0.3s ease;
}

.agent-card.thinking .card-glow {
  opacity: 0.15;
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.25; }
}

.avatar-wrapper {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.agent-avatar {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 14px;
  transition: all 0.3s ease;
}

.agent-card.thinking .agent-avatar {
  animation: avatar-bounce 0.6s ease-in-out infinite;
}

@keyframes avatar-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.agent-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1;
}

.agent-name {
  font-weight: 700;
  font-size: 16px;
  color: var(--text-primary);
}

.agent-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.agent-status.idle { color: #6b7280; }
.agent-status.active { color: #a78bfa; }
.agent-status.thinking { color: #fbbf24; }
.agent-status.thinking .status-dot { animation: dot-blink 0.8s ease-in-out infinite; }
.agent-status.processing { color: #f472b6; }
.agent-status.complete { color: #10b981; }

@keyframes dot-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Progress Flow */
.progress-flow {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.flow-track {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.flow-fill {
  height: 100%;
  background: linear-gradient(90deg, #a78bfa, #f472b6, #22d3ee);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.flow-labels {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-muted);
}

.flow-labels span {
  transition: all 0.3s ease;
}

.flow-labels span.active {
  color: var(--text-primary);
  font-weight: 700;
}

/* Transitions */
.pill-enter-active, .pill-leave-active {
  transition: all 0.3s ease;
}
.pill-enter-from, .pill-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.panel-enter-active, .panel-leave-active {
  transition: all 0.3s ease;
}
.panel-enter-from, .panel-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* Responsive */
@media (max-width: 480px) {
  .floating-agent-container {
    bottom: 20px;
    right: 20px;
  }

  .expanded-panel {
    width: 320px;
    padding: 18px;
  }

  .agent-pill {
    width: 44px;
    height: 44px;
  }
}
</style>

