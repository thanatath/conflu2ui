<template>
  <div class="preview-container glass">
    <div class="preview-tabs">
      <button
        class="tab"
        :class="{ active: currentView === 'mobile' }"
        @click="currentView = 'mobile'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Mobile
      </button>
      <button
        class="tab"
        :class="{ active: currentView === 'desktop' }"
        @click="currentView = 'desktop'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Desktop
      </button>
    </div>
    
    <div class="preview-content">
      <div v-if="currentView === 'mobile'" class="mobile-preview">
        <div class="device-frame mobile">
          <iframe
            :srcdoc="htmlContent"
            sandbox="allow-scripts allow-same-origin"
            class="preview-iframe"
          ></iframe>
        </div>
      </div>
      
      <div v-else class="desktop-preview">
        <div class="device-frame desktop">
          <iframe
            :srcdoc="htmlContent"
            sandbox="allow-scripts allow-same-origin"
            class="preview-iframe"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  htmlContent: string;
}>();

const currentView = ref<'mobile' | 'desktop'>('desktop');
</script>

<style scoped>
.preview-container {
  width: 100%;
  padding: 24px;
  margin: 20px 0;
}

.preview-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.tab {
  padding: 12px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}

.tab svg {
  width: 20px;
  height: 20px;
}

.tab:hover {
  border-color: var(--primary);
  color: var(--text-primary);
}

.tab.active {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-color: transparent;
  color: white;
}

.preview-content {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 600px;
}

.device-frame {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  position: relative;
}

.device-frame.mobile {
  width: 375px;
  height: 667px;
}

.device-frame.desktop {
  width: 100%;
  max-width: 1200px;
  height: 700px;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.mobile-preview,
.desktop-preview {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
