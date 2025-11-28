<template>
  <div class="preview-page">
    <FullPagePreview v-if="htmlPrototype" :code="htmlPrototype" />
    <div v-else class="loading-preview">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Loading preview...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Get the prototype code from workflow context or localStorage (for new window)
const { context } = useWorkflow();

const htmlPrototype = computed(() => {
  // First try workflow context
  if (context.value.htmlPrototype) {
    return context.value.htmlPrototype;
  }
  // Fallback to localStorage (for new window opened via Full Preview button)
  if (import.meta.client) {
    return localStorage.getItem('preview-code') || '';
  }
  return '';
});

// Define page metadata - no layout, full screen
definePageMeta({
  layout: false,
});
</script>

<style scoped>
.preview-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.loading-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-content p {
  margin-top: 16px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #a050ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

