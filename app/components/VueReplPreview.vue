<template>
  <div class="vue-repl-container">
    <div class="repl-header">
      <div class="header-left">
        <span class="repl-icon">⚡</span>
        <span class="repl-title">Vue REPL Preview</span>
        <span v-if="isStreaming" class="streaming-badge">
          <span class="pulse-dot"></span>
          Generating...
        </span>
        <span v-else-if="hasErrors" class="error-badge">
          ⚠️ {{ errorCount }} Error{{ errorCount > 1 ? 's' : '' }}
        </span>
        <span v-else-if="code" class="complete-badge">✓ Ready</span>
      </div>
      <div class="header-right">
        <button
          v-if="hasErrors && !isStreaming"
          class="fix-errors-btn"
          @click="handleFixErrors"
        >
          🔧 Auto Fix
        </button>
        <span v-if="lineCount > 0" class="code-lines">{{ lineCount }} lines</span>
      </div>
    </div>

    <!-- Error Panel -->
    <div v-if="hasErrors && !isStreaming" class="error-panel">
      <div class="error-header">
        <span>{{ runtimeErrors.length > 0 ? 'Runtime Errors' : 'Compilation Errors' }}</span>
        <button class="dismiss-btn" @click="dismissErrors">✕</button>
      </div>
      <div class="error-list">
        <div v-for="(error, index) in allErrors" :key="index" class="error-item">
          <span class="error-icon">❌</span>
          <span class="error-message">{{ error }}</span>
        </div>
      </div>
    </div>

    <div class="repl-content">
      <ClientOnly>
        <component
          v-if="ReplComponent && replStore && CodeMirrorEditor"
          :is="ReplComponent"
          :store="replStore"
          :editor="CodeMirrorEditor"
          :show-compile-output="false"
          :show-import-map="false"
          :clear-console="false"
          :preview-options="{
            headHTML: tailwindCDN,
            showRuntimeError: true,
            showRuntimeWarning: true
          }"
          :auto-resize="true"
        />
        <template #fallback>
          <div class="loading-placeholder">
            <div class="thinking-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Loading REPL...</p>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, shallowRef, type Component } from 'vue';

const props = defineProps<{
  code: string;
  isStreaming?: boolean;
  autoFixOnError?: boolean; // Auto-trigger fix when errors detected after streaming ends
}>();

const emit = defineEmits<{
  (e: 'errors', errors: string[]): void;
  (e: 'fix-errors', payload: { code: string; errors: string[] }): void;
  (e: 'ready'): void; // Emitted when code compiles successfully without errors
}>();

// Tailwind CSS CDN for preview (split to avoid script tag parsing issues)
const tailwindCDN = '<scr' + 'ipt src="https://cdn.tailwindcss.com"></scr' + 'ipt>';

// Dynamic imports for client-side only
const ReplComponent = shallowRef<Component | null>(null);
const CodeMirrorEditor = shallowRef<Component | null>(null);
const replStore = shallowRef<any>(null);

// Error handling
const currentErrors = ref<(string | Error)[]>([]);
const runtimeErrors = ref<string[]>([]); // Runtime errors from preview
const dismissedErrors = ref(false);
const hasTriggeredAutoFix = ref(false); // Prevent multiple auto-fix triggers

// Combine compilation and runtime errors
const allErrors = computed(() => [...currentErrors.value.map(formatError), ...runtimeErrors.value]);
const hasErrors = computed(() => allErrors.value.length > 0 && !dismissedErrors.value);
const errorCount = computed(() => allErrors.value.length);

// Format error for display
function formatError(error: string | Error): string {
  if (typeof error === 'string') return error;
  return error.message || String(error);
}

// Dismiss errors temporarily
function dismissErrors() {
  dismissedErrors.value = true;
}

// Handle fix errors button click
function handleFixErrors() {
  if (allErrors.value.length > 0 && props.code) {
    emit('fix-errors', {
      code: props.code,
      errors: allErrors.value
    });
  }
}

// Compute line count
const lineCount = computed(() => {
  if (!props.code) return 0;
  return props.code.split('\n').length;
});

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

  // Watch for errors in the store (compilation errors)
  watch(() => replStore.value?.errors, (errors) => {
    if (errors && errors.length > 0) {
      currentErrors.value = errors;
      dismissedErrors.value = false;
      emit('errors', errors.map(formatError));
    } else {
      currentErrors.value = [];
      hasTriggeredAutoFix.value = false; // Reset when errors are cleared
    }
  }, { deep: true });

  // Set initial file if code exists
  if (props.code) {
    updateReplCode(props.code);
  }
});

// Listen for runtime errors from preview iframe via postMessage
function handleRuntimeMessage(event: MessageEvent) {
  // Validate message origin (from same origin or sandbox)
  if (event.data?.type === 'vue-repl-error') {
    const errorMsg = event.data.message || String(event.data.error);
    if (errorMsg && !runtimeErrors.value.includes(errorMsg)) {
      runtimeErrors.value = [...runtimeErrors.value, errorMsg];
      dismissedErrors.value = false;
      emit('errors', allErrors.value);
    }
  }
}

// Poll for error messages in the REPL (both compilation and runtime errors from DOM)
let errorPollingInterval: ReturnType<typeof setInterval> | null = null;

function checkForAllReplErrors() {
  // Look for Vue REPL's error message elements
  const container = document.querySelector('.vue-repl-container');
  if (!container) return;

  // Vue REPL displays errors in various elements:
  // - .msg.err - general error messages
  // - .preview .msg - preview runtime errors
  // - .editor .error - syntax errors in editor
  // - [class*="error"] - any element with error class
  const errorSelectors = [
    '.msg.err',
    '.preview .msg',
    '.msg.error',
    '.vue-repl .msg',
    '[class*="err"]:not(button):not(.error-panel):not(.error-header):not(.error-list):not(.error-item):not(.error-icon):not(.error-message):not(.error-badge)',
  ];

  const errorElements = container.querySelectorAll(errorSelectors.join(', '));

  errorElements.forEach((el) => {
    const errorText = el.textContent?.trim();
    // Filter out UI elements and only capture actual error messages
    if (errorText &&
        errorText.length > 5 &&
        errorText.length < 500 &&
        !runtimeErrors.value.includes(errorText) &&
        !errorText.includes('Auto Fix') &&
        !errorText.includes('Runtime Errors') &&
        !errorText.includes('Compilation Errors')) {
      runtimeErrors.value = [...runtimeErrors.value, errorText];
      dismissedErrors.value = false;
      emit('errors', allErrors.value);
    }
  });

  // Also check replStore.errors directly (compilation errors from Vue compiler)
  if (replStore.value?.errors && replStore.value.errors.length > 0) {
    replStore.value.errors.forEach((err: string | Error) => {
      const errStr = formatError(err);
      if (errStr && !currentErrors.value.map(formatError).includes(errStr)) {
        currentErrors.value = [...currentErrors.value, err];
        dismissedErrors.value = false;
      }
    });
  }
}

function startErrorPolling() {
  if (errorPollingInterval) return;
  // Poll every 500ms to detect all REPL errors (compilation + runtime)
  errorPollingInterval = setInterval(checkForAllReplErrors, 500);
}

function stopErrorPolling() {
  if (errorPollingInterval) {
    clearInterval(errorPollingInterval);
    errorPollingInterval = null;
  }
}

onMounted(() => {
  window.addEventListener('message', handleRuntimeMessage);
  // Start polling for errors after REPL is loaded
  setTimeout(startErrorPolling, 1500);
});

onUnmounted(() => {
  window.removeEventListener('message', handleRuntimeMessage);
  stopErrorPolling();
});

// Convert HTML to Vue SFC format
function htmlToVueSFC(html: string): string {
  // If it's already a Vue SFC (has <template> or <script>), return as is
  if (html.includes('<template>') || html.includes('<scr' + 'ipt')) {
    return html;
  }

  // Extract body content if it's a full HTML document
  let bodyContent = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyContent = bodyMatch[1].trim();
  }

  // Wrap in Vue SFC template (split tags to avoid parser issues)
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

// Update REPL with new code
function updateReplCode(code: string) {
  if (!replStore.value || !code) return;
  
  const sfcCode = htmlToVueSFC(code);
  
  // Update the App.vue file in the store
  replStore.value.setFiles({
    'App.vue': sfcCode,
  }, 'App.vue');
}

// Track pending auto-fix check
let autoFixCheckTimeout: ReturnType<typeof setTimeout> | null = null;
let hasEmittedReady = false; // Track if we already emitted ready for current code

// Function to check and trigger auto-fix if needed, or emit ready if no errors
function checkAndTriggerAutoFix() {
  // Clear any pending timeout
  if (autoFixCheckTimeout) {
    clearTimeout(autoFixCheckTimeout);
    autoFixCheckTimeout = null;
  }

  // Wait a bit for REPL to compile and detect errors
  autoFixCheckTimeout = setTimeout(() => {
    if (!props.isStreaming && props.code) {
      if (allErrors.value.length > 0 && props.autoFixOnError && !hasTriggeredAutoFix.value) {
        // Has errors - trigger auto-fix
        console.log('[VueReplPreview] Auto-triggering fix for errors:', allErrors.value);
        hasTriggeredAutoFix.value = true;
        hasEmittedReady = false;
        emit('fix-errors', {
          code: props.code,
          errors: allErrors.value
        });
      } else if (allErrors.value.length === 0 && !hasEmittedReady) {
        // No errors - emit ready event
        console.log('[VueReplPreview] Code compiled successfully, emitting ready');
        hasEmittedReady = true;
        emit('ready');
      }
    }
  }, 2000); // Give REPL time to compile and detect runtime errors
}

// Watch for code changes
watch(() => props.code, (newCode, oldCode) => {
  if (newCode && replStore.value) {
    updateReplCode(newCode);
    // Reset dismissed errors when new code comes in
    dismissedErrors.value = false;
    runtimeErrors.value = []; // Reset runtime errors for new code

    // Reset flags for genuinely new code (not just whitespace changes)
    if (newCode !== oldCode) {
      hasTriggeredAutoFix.value = false;
      hasEmittedReady = false; // Reset ready flag for new code
      // Check for errors after code update (for auto-fix loop)
      if (!props.isStreaming && props.autoFixOnError) {
        checkAndTriggerAutoFix();
      }
    }
  }
}, { immediate: false });

// Auto-fix: when streaming ends, trigger error check
watch(() => props.isStreaming, (isStreaming, wasStreaming) => {
  // Streaming just ended (was true, now false)
  if (wasStreaming && !isStreaming && props.autoFixOnError) {
    checkAndTriggerAutoFix();
  }
}, { immediate: false });

// Also watch for errors appearing (for runtime errors that appear after compilation)
watch(allErrors, (errors) => {
  if (errors.length > 0 && !props.isStreaming && props.autoFixOnError && !hasTriggeredAutoFix.value) {
    checkAndTriggerAutoFix();
  }
}, { immediate: false });

// Expose method to get current code from REPL
function getCurrentCode(): string {
  if (!replStore.value) return '';
  const files = replStore.value.files;
  return files['App.vue'] || '';
}

defineExpose({ getCurrentCode });
</script>

<style scoped>
.vue-repl-container {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
}

.repl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.repl-icon {
  font-size: 18px;
}

.repl-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.streaming-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 193, 7, 0.2);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #ffc107;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background: #ffc107;
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.complete-badge {
  padding: 4px 10px;
  background: rgba(80, 200, 120, 0.2);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--success);
}

.error-badge {
  padding: 4px 10px;
  background: rgba(255, 82, 82, 0.2);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #ff5252;
}

.fix-errors-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #ff5252, #ff1744);
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fix-errors-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 82, 82, 0.4);
}

.error-panel {
  background: rgba(255, 82, 82, 0.1);
  border-bottom: 1px solid rgba(255, 82, 82, 0.3);
  max-height: 150px;
  overflow-y: auto;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 82, 82, 0.15);
  font-size: 12px;
  font-weight: 600;
  color: #ff5252;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #ff5252;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
}

.dismiss-btn:hover {
  background: rgba(255, 82, 82, 0.2);
}

.error-list {
  padding: 8px 12px;
}

.error-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.error-icon {
  flex-shrink: 0;
}

.error-message {
  font-family: 'Fira Code', 'Monaco', monospace;
  word-break: break-word;
}

.code-lines {
  padding: 4px 8px;
  background: rgba(160, 80, 255, 0.2);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--primary-light);
}

.repl-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.repl-content :deep(.vue-repl) {
  flex: 1;
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden;
}

.repl-content :deep(.vue-repl .split-pane) {
  height: 100% !important;
  max-height: 100% !important;
}


.repl-content :deep(.vue-repl iframe) {
  height: 100% !important;
  max-height: 100% !important;
}

.repl-content :deep(.vue-repl .preview-container) {
  height: 100% !important;
  max-height: 100% !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.repl-content :deep(.vue-repl .preview-container .iframe-container) {
  flex: 1;
  height: 100% !important;
  max-height: 100% !important;
  overflow: hidden;
}

.repl-content :deep(.vue-repl .right) {
  height: 100% !important;
  max-height: 100% !important;
  overflow: hidden;
}

.repl-content :deep(.vue-repl .output) {
  height: 100% !important;
  max-height: 100% !important;
  overflow: hidden;
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  color: var(--text-muted);
  gap: 12px;
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.thinking-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}
</style>

