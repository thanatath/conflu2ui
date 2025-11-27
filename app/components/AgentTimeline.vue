<template>
  <div class="timeline-container">
    <div class="timeline">
      <div
        v-for="agent in agents"
        :key="agent.role"
        class="timeline-item"
        :class="{
          active: sessions[agent.role].isActive,
          complete: sessions[agent.role].status === 'complete',
          processing: sessions[agent.role].status === 'processing'
        }"
      >
        <div class="timeline-dot">
          <div v-if="sessions[agent.role].status === 'processing'" class="spinner"></div>
          <svg v-else-if="sessions[agent.role].status === 'complete'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
          <span v-else>{{ agent.icon }}</span>
        </div>
        
        <div class="timeline-content">
          <h3>{{ agent.title }}</h3>
          <p class="text-muted">{{ agent.description }}</p>
          
          <div v-if="sessions[agent.role].status === 'processing'" class="status-badge processing">
            <span class="pulse-dot"></span>
            Processing...
          </div>
          <div v-else-if="sessions[agent.role].status === 'complete'" class="status-badge complete">
            <span>✓</span>
            Complete
          </div>
        </div>
        
        <div class="timeline-line"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { sessions } = useAgentChat();

const agents = [
  {
    role: 'ba' as const,
    title: 'Business Analyst',
    description: 'Review requirements and clarify scope',
    icon: '📋',
  },
  {
    role: 'sa' as const,
    title: 'System Analyst',
    description: 'Design architecture and create prototype',
    icon: '🏗️',
  },
  {
    role: 'dev' as const,
    title: 'Developer',
    description: 'Implement and refine the solution',
    icon: '💻',
  },
];
</script>

<style scoped>
.timeline-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.timeline {
  position: relative;
}

.timeline-item {
  position: relative;
  padding-left: 80px;
  margin-bottom: 60px;
  opacity: 0.5;
  transition: all 0.4s ease;
}

.timeline-item.active {
  opacity: 1;
}

.timeline-item.complete {
  opacity: 0.8;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 0;
  width: 60px;
  height: 60px;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.4s ease;
  z-index: 2;
}

.timeline-item.active .timeline-dot {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-color: var(--primary);
  animation: pulse-glow 2s ease-in-out infinite;
  box-shadow: 0 0 30px rgba(160, 80, 255, 0.6);
}

.timeline-item.complete .timeline-dot {
  background: var(--success);
  border-color: var(--success);
}

.timeline-item.complete .timeline-dot svg {
  width: 30px;
  height: 30px;
  color: white;
}

.timeline-item.processing .timeline-dot {
  border-color: var(--primary);
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.timeline-line {
  position: absolute;
  left: 29px;
  top: 70px;
  bottom: -60px;
  width: 2px;
  background: var(--border-color);
  z-index: 1;
}

.timeline-item:last-child .timeline-line {
  display: none;
}

.timeline-item.active .timeline-line {
  background: linear-gradient(180deg, var(--primary), transparent);
}

.timeline-content {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.timeline-item.active .timeline-content {
  border-color: var(--border-glow);
  box-shadow: 0 8px 32px rgba(160, 80, 255, 0.2);
}

.timeline-content h3 {
  font-size: 24px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.timeline-item:not(.active) .timeline-content h3 {
  background: none;
  -webkit-text-fill-color: var(--text-secondary);
  color: var(--text-secondary);
}

.timeline-content p {
  font-size: 14px;
  margin-bottom: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 12px;
}

.status-badge.processing {
  background: rgba(160, 80, 255, 0.2);
  color: var(--primary-light);
}

.status-badge.complete {
  background: rgba(80, 200, 120, 0.2);
  color: var(--success);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 50%;
  animation: pulse-glow 1.5s ease-in-out infinite;
}
</style>
