<template>
  <div class="agent-mascot-wrapper" :class="[agent, { thinking: isThinking, active: isActive }]">
    <!-- Particle Effects Background -->
    <div class="particles">
      <span v-for="i in 8" :key="i" class="particle" :style="{ '--i': i }"></span>
    </div>
    
    <!-- Glow Ring -->
    <div class="glow-ring" :class="{ pulsing: isThinking }"></div>
    <div class="glow-ring inner" :class="{ pulsing: isThinking }"></div>
    
    <!-- Mascot Image -->
    <div class="mascot-container">
      <img 
        :src="mascotImage" 
        :alt="`${agentName} Agent`"
        class="mascot-image"
        :class="{ floating: isActive && !isThinking, thinking: isThinking }"
      />
      
      <!-- Thinking Indicator -->
      <div v-if="isThinking" class="thinking-indicator">
        <span class="thought-bubble">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </span>
      </div>
    </div>
    
    <!-- Status Label -->
    <div class="status-label glass-micro">
      <span class="status-dot" :class="statusClass"></span>
      <span class="status-text">{{ statusText }}</span>
    </div>
    
    <!-- Agent Name Badge -->
    <div class="agent-badge">
      <span class="agent-icon">{{ agentIcon }}</span>
      <span class="agent-name">{{ agentName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AgentRole } from '../types/workflow';

const props = defineProps<{
  agent: AgentRole;
  isActive: boolean;
  isStreaming: boolean;
  status: 'idle' | 'processing' | 'complete' | 'error';
}>();

// Agent configurations
const agentConfig = {
  ba: { name: 'Business Analyst', icon: '📋', color: '#a78bfa' },
  sa: { name: 'System Analyst', icon: '🏗️', color: '#f472b6' },
  dev: { name: 'Developer', icon: '💻', color: '#22d3ee' }
};

const agentName = computed(() => agentConfig[props.agent].name);
const agentIcon = computed(() => agentConfig[props.agent].icon);

// Determine if agent is thinking (streaming content)
const isThinking = computed(() => props.isActive && props.isStreaming);

// Mascot image path - switches between normal and thinking
const mascotImage = computed(() => {
  const baseName = props.agent.toUpperCase();
  const suffix = isThinking.value ? '_Thinking' : '';
  return `/images/${baseName}${suffix}.png`;
});

// Status display
const statusClass = computed(() => {
  if (props.status === 'processing' || isThinking.value) return 'processing';
  if (props.status === 'complete') return 'complete';
  if (props.status === 'error') return 'error';
  if (props.isActive) return 'active';
  return 'idle';
});

const statusText = computed(() => {
  if (isThinking.value) return 'กำลังคิด...';
  if (props.status === 'processing') return 'กำลังทำงาน';
  if (props.status === 'complete') return 'เสร็จสิ้น';
  if (props.status === 'error') return 'เกิดข้อผิดพลาด';
  if (props.isActive) return 'พร้อมทำงาน';
  return 'รอคิว';
});
</script>

<style scoped>
.agent-mascot-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-width: 140px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Particles */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  opacity: 0;
  background: var(--particle-color, #a78bfa);
  animation: none;
  left: 50%;
  top: 50%;
  box-shadow: 0 0 6px var(--particle-color);
}

/* Position particles in different locations */
.particle:nth-child(1) { --tx: -30px; --ty: -70px; }
.particle:nth-child(2) { --tx: 30px; --ty: -70px; }
.particle:nth-child(3) { --tx: -50px; --ty: -40px; }
.particle:nth-child(4) { --tx: 50px; --ty: -40px; }
.particle:nth-child(5) { --tx: -40px; --ty: -55px; }
.particle:nth-child(6) { --tx: 40px; --ty: -55px; }
.particle:nth-child(7) { --tx: -20px; --ty: -80px; }
.particle:nth-child(8) { --tx: 20px; --ty: -80px; }

.active .particle {
  animation: particle-float 3s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.35s);
}

.thinking .particle {
  animation: particle-burst 1.5s ease-out infinite;
  animation-delay: calc(var(--i) * 0.15s);
}

@keyframes particle-float {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0);
  }
  20% {
    opacity: 0.9;
    transform: translate(calc(var(--tx) * 0.3), calc(var(--ty) * 0.3)) scale(1);
  }
  80% {
    opacity: 0.5;
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) scale(0.5);
  }
}

@keyframes particle-burst {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0);
  }
  30% {
    opacity: 1;
    transform: translate(calc(var(--tx) * 0.5), calc(var(--ty) * 0.5)) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(calc(var(--tx) * 1.5), calc(var(--ty) * 1.5)) scale(0);
  }
}

.ba .particle { --particle-color: #a78bfa; }
.sa .particle { --particle-color: #f472b6; }
.dev .particle { --particle-color: #22d3ee; }

/* Glow Rings */
.glow-ring {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 2px solid transparent;
  opacity: 0;
  transition: all 0.5s ease;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -60%);
}

.glow-ring.inner {
  width: 100px;
  height: 100px;
}

.active .glow-ring {
  opacity: 0.6;
  border-color: var(--glow-color);
  box-shadow:
    0 0 20px var(--glow-color),
    inset 0 0 20px var(--glow-color);
  animation: glow-pulse 2s ease-in-out infinite;
}

.glow-ring.pulsing {
  animation: glow-pulse-fast 1s ease-in-out infinite !important;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.4; transform: translate(-50%, -60%) scale(1); }
  50% { opacity: 0.7; transform: translate(-50%, -60%) scale(1.05); }
}

@keyframes glow-pulse-fast {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -60%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -60%) scale(1.1); }
}

.ba { --glow-color: rgba(167, 139, 250, 0.5); }
.sa { --glow-color: rgba(244, 114, 182, 0.5); }
.dev { --glow-color: rgba(34, 211, 238, 0.5); }

/* Mascot Container */
.mascot-container {
  position: relative;
  width: 100px;
  height: 100px;
  z-index: 2;
}

.mascot-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.mascot-image.floating {
  animation: mascot-float 3s ease-in-out infinite;
}

.mascot-image.thinking {
  animation: mascot-think 0.8s ease-in-out infinite;
  filter: drop-shadow(0 0 20px var(--glow-color));
}

@keyframes mascot-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes mascot-think {
  0%, 100% { transform: scale(1) rotate(-2deg); }
  25% { transform: scale(1.02) rotate(0deg); }
  50% { transform: scale(1) rotate(2deg); }
  75% { transform: scale(1.02) rotate(0deg); }
}

/* Thinking Indicator */
.thinking-indicator {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 3;
}

.thought-bubble {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  animation: dot-bounce 1.4s ease-in-out infinite;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* Status Label */
.status-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-dot.idle { background: #6b7280; }
.status-dot.active { background: #a78bfa; box-shadow: 0 0 8px #a78bfa; }
.status-dot.processing {
  background: #fbbf24;
  animation: status-pulse 1s ease-in-out infinite;
}
.status-dot.complete { background: #10b981; box-shadow: 0 0 8px #10b981; }
.status-dot.error { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

@keyframes status-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

.status-text {
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Agent Badge */
.agent-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.agent-icon {
  font-size: 16px;
}

.agent-name {
  opacity: 0.9;
}

/* Inactive state */
.agent-mascot-wrapper:not(.active) {
  opacity: 0.4;
  filter: grayscale(0.6);
}

.agent-mascot-wrapper:not(.active):hover {
  opacity: 0.6;
}
</style>

