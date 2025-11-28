<template>
  <div class="preview-page">
    <FullPagePreview v-if="htmlPrototype" :code="htmlPrototype" />
    <div v-else class="no-preview">
      <div class="no-preview-content">
        <div class="icon">🎨</div>
        <h2>No Preview Available</h2>
        <p>Please generate a prototype first from the main application.</p>
        <NuxtLink to="/" class="back-btn">
          ← Back to Home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Get the prototype code from workflow context
const { context } = useWorkflow();
const htmlPrototype = computed(() => context.value.htmlPrototype);

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

.no-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.no-preview-content {
  text-align: center;
  color: white;
  padding: 40px;
}

.icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.no-preview-content h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
}

.no-preview-content p {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 24px;
}

.back-btn {
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(135deg, #a050ff 0%, #6366f1 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(160, 80, 255, 0.4);
}
</style>

