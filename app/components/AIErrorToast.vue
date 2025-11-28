<template>
  <Transition name="slide-fade">
    <div v-if="error" class="ai-error-toast glass">
      <div class="error-icon">
        <span v-if="errorIcon === 'timeout'">⏱️</span>
        <span v-else-if="errorIcon === 'network'">🌐</span>
        <span v-else>⚠️</span>
      </div>

      <div class="error-content">
        <h4 class="error-title">{{ errorTitle }}</h4>
        <p class="error-message">{{ error.message }}</p>
        <p v-if="error.retriesAttempted" class="error-retries">
          พยายามเชื่อมต่อ {{ error.retriesAttempted }} ครั้ง
        </p>
      </div>

      <div class="error-actions">
        <button class="btn btn-ghost btn-sm" @click="dismiss">
          ปิด
        </button>
        <button class="btn btn-primary btn-sm" @click="retry">
          <span class="retry-icon">🔄</span> ลองใหม่
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { AIStreamError } from '../composables/useAIStream';

const props = defineProps<{
  error: AIStreamError | null;
}>();

const emit = defineEmits<{
  dismiss: [];
  retry: [];
}>();

const errorIcon = computed(() => {
  if (!props.error?.code) return 'generic';
  switch (props.error.code) {
    case 'TIMEOUT': return 'timeout';
    case 'NETWORK_ERROR': return 'network';
    default: return 'generic';
  }
});

const errorTitle = computed(() => {
  if (!props.error?.code) return 'เกิดข้อผิดพลาด';
  switch (props.error.code) {
    case 'TIMEOUT': return 'การเชื่อมต่อใช้เวลานานเกินไป';
    case 'NETWORK_ERROR': return 'ไม่สามารถเชื่อมต่อเครือข่ายได้';
    case 'MAX_RETRIES': return 'ลองใหม่หลายครั้งแล้วไม่สำเร็จ';
    case 'API_ERROR': return 'เกิดข้อผิดพลาดจากระบบ AI';
    default: return 'เกิดข้อผิดพลาด';
  }
});

function dismiss() {
  emit('dismiss');
}

function retry() {
  emit('retry');
}
</script>

<style scoped>
.ai-error-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.15) 0%,
    rgba(220, 38, 38, 0.1) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 32px rgba(239, 68, 68, 0.2),
    0 0 0 1px rgba(239, 68, 68, 0.1) inset;
  z-index: 1000;
  max-width: 90vw;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-4px); }
}

.error-icon {
  font-size: 32px;
  line-height: 1;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.95); }
}

.error-content {
  flex: 1;
}

.error-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #fca5a5;
}

.error-message {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.error-retries {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.error-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 8px 14px;
  font-size: 13px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.retry-icon {
  display: inline-block;
  animation: spin 2s linear infinite paused;
}

.btn-primary:hover .retry-icon {
  animation-play-state: running;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>

