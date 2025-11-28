<template>
  <div class="fullpage-preview">
    <ClientOnly>
      <div v-if="replStore" class="preview-wrapper">
        <!-- Render only the preview iframe, hiding the code editor -->
        <component
          v-if="ReplComponent && replStore && CodeMirrorEditor"
          :is="ReplComponent"
          :store="replStore"
          :editor="CodeMirrorEditor"
          :show-compile-output="false"
          :show-import-map="false"
          :clear-console="false"
          :show-file-selector="false"
          :preview-options="{
            headHTML: tailwindCDN,
            showRuntimeError: false,
            showRuntimeWarning: false
          }"
          :auto-resize="true"
          class="preview-only-repl"
        />
      </div>
      <template #fallback>
        <div class="loading-screen">
          <div class="loading-spinner"></div>
          <p>Loading preview...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, watch, onMounted, type Component } from 'vue';
import { sanitizeVueSfc } from '~/utils/vueSfcSanitizer';

const props = defineProps<{
  code: string;
}>();

// Dynamic imports for client-side only
const ReplComponent = shallowRef<Component | null>(null);
const CodeMirrorEditor = shallowRef<Component | null>(null);
const replStore = shallowRef<any>(null);

// Tailwind CSS CDN for preview
const tailwindCDN = '<scr' + 'ipt src="https://cdn.tailwindcss.com"></scr' + 'ipt>';

onMounted(async () => {
  // Dynamic import to avoid SSR issues
  const [replModule, editorModule] = await Promise.all([
    import('@vue/repl'),
    import('@vue/repl/codemirror-editor')
  ]);

  ReplComponent.value = replModule.Repl;
  CodeMirrorEditor.value = editorModule.default;

  // Initialize the store
  const { useStore, useVueImportMap } = replModule;
  const { importMap: builtinImportMap, vueVersion } = useVueImportMap({
    runtimeDev: 'https://cdn.jsdelivr.net/npm/@vue/runtime-dom@3/dist/runtime-dom.esm-browser.js',
    runtimeProd: 'https://cdn.jsdelivr.net/npm/@vue/runtime-dom@3/dist/runtime-dom.esm-browser.prod.js',
  });

  replStore.value = useStore({
    builtinImportMap,
    vueVersion,
  });

  // Set initial code
  if (props.code) {
    updateReplCode(props.code);
  }
});

// Convert HTML to Vue SFC format
function htmlToVueSFC(html: string): string {
  if (html.includes('<template>') || html.includes('<scr' + 'ipt')) {
    return html;
  }

  let bodyContent = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyContent = bodyMatch[1].trim();
  }

  const scriptOpen = '<scr' + 'ipt setup>';
  const scriptClose = '</scr' + 'ipt>';
  const styleOpen = '<sty' + 'le scoped>';
  const styleClose = '</sty' + 'le>';

  return `<template>
  <div class="prototype-container">
    ${bodyContent}
  </div>
</template>

${scriptOpen}
// Generated prototype - ready for customization
${scriptClose}

${styleOpen}
.prototype-container {
  min-height: 100vh;
}
${styleClose}`;
}

function updateReplCode(code: string) {
  if (!replStore.value || !code) return;
  
  const { code: sanitizedCode } = sanitizeVueSfc(code);
  const sfcCode = htmlToVueSFC(sanitizedCode);
  
  replStore.value.setFiles({
    'App.vue': sfcCode,
  }, 'App.vue');
}

// Watch for code changes
watch(() => props.code, (newCode) => {
  if (newCode && replStore.value) {
    updateReplCode(newCode);
  }
}, { immediate: false });
</script>

<style scoped>
.fullpage-preview {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: white;
}

.preview-wrapper {
  width: 100%;
  height: 100%;
}

/* Hide the left panel (code editor) and show only preview */
.preview-wrapper :deep(.vue-repl) {
  width: 100% !important;
  height: 100% !important;
}

.preview-wrapper :deep(.vue-repl .split-pane) {
  display: flex !important;
}

/* Hide the left side (editor) completely */
.preview-wrapper :deep(.vue-repl .left) {
  display: none !important;
  width: 0 !important;
  flex: 0 !important;
}

/* Hide the split pane gutter/divider */
.preview-wrapper :deep(.vue-repl .split-pane > .split) {
  display: none !important;
}

/* Make the right side (preview) take full width */
.preview-wrapper :deep(.vue-repl .right) {
  width: 100% !important;
  flex: 1 !important;
  max-width: 100% !important;
}

/* Make the output/preview container full size */
.preview-wrapper :deep(.vue-repl .output-container) {
  height: 100% !important;
}

/* Hide tab bar in preview if any */
.preview-wrapper :deep(.vue-repl .tab-buttons) {
  display: none !important;
}

/* Make iframe full size */
.preview-wrapper :deep(.vue-repl iframe) {
  width: 100% !important;
  height: 100% !important;
  border: none !important;
}

/* Make preview container full size */
.preview-wrapper :deep(.vue-repl .preview-container) {
  height: 100% !important;
}

.preview-wrapper :deep(.vue-repl .iframe-container) {
  height: 100% !important;
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f5f5f5;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

