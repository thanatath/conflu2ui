<template>
  <div class="agent-mascot-panel glass">
    <div class="panel-header">
      <h3 class="panel-title gradient-text">🤖 AI Agents</h3>
      <div class="workflow-indicator">
        <span class="indicator-dot" :class="currentPhase"></span>
        <span class="indicator-text">{{ currentPhaseName }}</span>
      </div>
    </div>

    <div class="agents-showcase">
      <!-- Connection Lines -->
      <svg class="connection-lines" viewBox="0 0 400 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#a78bfa;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#f472b6;stop-opacity:0.8" />
          </linearGradient>
          <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#f472b6;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#22d3ee;stop-opacity:0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Line BA -> SA -->
        <path 
          d="M 95 30 Q 145 30 200 30" 
          fill="none" 
          :stroke="isBAComplete ? 'url(#lineGradient1)' : '#3f3f46'"
          stroke-width="3"
          :stroke-dasharray="isBAComplete ? 'none' : '8 4'"
          :filter="isBAComplete ? 'url(#glow)' : 'none'"
          class="connection-path"
          :class="{ active: isBAComplete }"
        />
        
        <!-- Line SA -> DEV -->
        <path 
          d="M 200 30 Q 255 30 305 30" 
          fill="none" 
          :stroke="isSAComplete ? 'url(#lineGradient2)' : '#3f3f46'"
          stroke-width="3"
          :stroke-dasharray="isSAComplete ? 'none' : '8 4'"
          :filter="isSAComplete ? 'url(#glow)' : 'none'"
          class="connection-path"
          :class="{ active: isSAComplete }"
        />
        
        <!-- Animated flowing particles -->
        <circle v-if="isBAComplete && !isSAComplete" r="4" fill="#f472b6" filter="url(#glow)">
          <animateMotion dur="2s" repeatCount="indefinite" path="M 95 30 Q 145 30 200 30" />
        </circle>
        <circle v-if="isSAComplete && !isDEVComplete" r="4" fill="#22d3ee" filter="url(#glow)">
          <animateMotion dur="2s" repeatCount="indefinite" path="M 200 30 Q 255 30 305 30" />
        </circle>
      </svg>

      <!-- Agent Mascots -->
      <div class="agents-row">
        <AgentMascot 
          agent="ba"
          :is-active="isBAActive"
          :is-streaming="isStreaming && currentAgent === 'ba'"
          :status="sessions.ba.status"
        />
        
        <AgentMascot 
          agent="sa"
          :is-active="isSAActive"
          :is-streaming="isStreaming && currentAgent === 'sa'"
          :status="sessions.sa.status"
        />
        
        <AgentMascot 
          agent="dev"
          :is-active="isDEVActive"
          :is-streaming="isStreaming && currentAgent === 'dev'"
          :status="sessions.dev.status"
        />
      </div>
    </div>
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

// Steps mapping
const baSteps = ['upload-story', 'upload-images', 'ba-conversation', 'ba-confirmation'];
const saSteps = ['sa-design'];
const devSteps = ['dev-implementation', 'validation', 'preview', 'iteration'];
const allSteps = [...baSteps, ...saSteps, ...devSteps];

// Active states
const isBAActive = computed(() => baSteps.includes(props.currentStep));
const isSAActive = computed(() => saSteps.includes(props.currentStep));
const isDEVActive = computed(() => devSteps.includes(props.currentStep));

// Complete states
const isBAComplete = computed(() => {
  const currentIndex = allSteps.indexOf(props.currentStep);
  const lastBAIndex = allSteps.indexOf(baSteps[baSteps.length - 1]);
  return currentIndex > lastBAIndex;
});

const isSAComplete = computed(() => {
  const currentIndex = allSteps.indexOf(props.currentStep);
  const lastSAIndex = allSteps.indexOf(saSteps[saSteps.length - 1]);
  return currentIndex > lastSAIndex;
});

const isDEVComplete = computed(() => props.sessions.dev.status === 'complete');

// Current phase
const currentPhase = computed(() => {
  if (isBAActive.value) return 'ba';
  if (isSAActive.value) return 'sa';
  return 'dev';
});

const currentPhaseName = computed(() => {
  if (isBAActive.value) return 'Business Analysis';
  if (isSAActive.value) return 'System Design';
  return 'Development';
});
</script>

<style scoped>
.agent-mascot-panel {
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(
    145deg,
    rgba(20, 20, 35, 0.9) 0%,
    rgba(30, 30, 50, 0.85) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
  position: relative;
}

.agent-mascot-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(160, 80, 255, 0.08) 0%,
    transparent 60%
  );
  pointer-events: none;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.workflow-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  font-size: 12px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: indicator-pulse 2s ease-in-out infinite;
}

.indicator-dot.ba { background: #a78bfa; box-shadow: 0 0 8px #a78bfa; }
.indicator-dot.sa { background: #f472b6; box-shadow: 0 0 8px #f472b6; }
.indicator-dot.dev { background: #22d3ee; box-shadow: 0 0 8px #22d3ee; }

@keyframes indicator-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.indicator-text {
  color: var(--text-secondary);
  font-weight: 500;
}

.agents-showcase {
  position: relative;
  padding-top: 30px;
}

.connection-lines {
  position: absolute;
  top: 50%;
  left: 10%;
  width: 80%;
  height: 60px;
  transform: translateY(-50%);
  z-index: 1;
  pointer-events: none;
}

.connection-path {
  transition: all 0.5s ease;
}

.connection-path.active {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: dash-flow 2s linear forwards;
}

@keyframes dash-flow {
  to { stroke-dashoffset: 0; }
}

.agents-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .agent-mascot-panel {
    padding: 16px;
  }

  .agents-row {
    flex-direction: column;
    gap: 20px;
  }

  .connection-lines {
    display: none;
  }
}

@media (max-width: 1024px) {
  .agent-mascot-panel {
    margin-bottom: 20px;
  }
}
</style>

