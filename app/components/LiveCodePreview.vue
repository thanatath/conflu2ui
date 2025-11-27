<template>
    <div class="live-code-preview glass">
        <div class="code-header">
            <div class="header-left">
                <span class="code-icon">⚡</span>
                <span class="code-title">Live Code Generation</span>
                <span v-if="isStreaming" class="streaming-badge">
                    <span class="pulse-dot"></span>
                    Generating...
                </span>
                <span v-else-if="totalLines > 0" class="complete-badge">✓ Complete</span>
            </div>
            <div class="header-right">
                <span class="code-lines">{{ totalLines }} lines</span>
                <button v-if="code" class="copy-btn" @click="copyCode" :title="copied ? 'Copied!' : 'Copy code'">
                    {{ copied ? '✓ Copied' : '📋 Copy' }}
                </button>
            </div>
        </div>

        <div class="code-content" ref="codeContainer">
            <div v-if="!code && isStreaming" class="generating-placeholder">
                <div class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <p>Waiting for code...</p>
            </div>
            <div v-else-if="!code" class="empty-placeholder">
                <p>No code generated yet</p>
            </div>
            <pre v-else><code>{{ displayCode }}</code></pre>
        </div>

        <div v-if="code && totalLines > 10" class="code-footer">
            <span class="footer-hint">Showing last 10 lines of {{ totalLines }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps<{
    code: string;
    isStreaming?: boolean;
}>();

const copied = ref(false);
const codeContainer = ref<HTMLElement | null>(null);

const codeLines = computed(() => props.code ? props.code.split('\n') : []);
const totalLines = computed(() => codeLines.value.length);

const displayCode = computed(() => {
    if (totalLines.value <= 10) {
        return props.code;
    }
    // Show last 10 lines
    return codeLines.value.slice(-10).join('\n');
});

// Auto-scroll when new code comes in
watch(() => props.code, async () => {
    await nextTick();
    if (codeContainer.value) {
        codeContainer.value.scrollTop = codeContainer.value.scrollHeight;
    }
});

function copyCode() {
    if (props.code) {
        navigator.clipboard.writeText(props.code);
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 2000);
    }
}
</script>

<style scoped>
.live-code-preview {
    border: 1px solid var(--border-color);
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.code-header {
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

.code-icon {
    font-size: 18px;
}

.code-title {
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

.code-lines {
    padding: 4px 8px;
    background: rgba(160, 80, 255, 0.2);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--primary-light);
}

.copy-btn {
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.copy-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: var(--primary);
    color: var(--text-primary);
}

.code-content {
    flex: 1;
    padding: 16px;
    background: rgba(0, 0, 0, 0.4);
    overflow-y: auto;
    min-height: 200px;
    max-height: 400px;
}

.generating-placeholder,
.empty-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 150px;
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

.code-content pre {
    margin: 0;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #e2e8f0;
    white-space: pre-wrap;
    word-break: break-all;
}

.code-footer {
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.2);
    border-top: 1px solid var(--border-color);
}

.footer-hint {
    font-size: 11px;
    color: var(--text-muted);
}
</style>

