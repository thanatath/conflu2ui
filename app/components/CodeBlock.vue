<template>
    <div class="code-block glass">
        <div class="code-header">
            <div class="header-left">
                <span class="code-icon">{{ icon }}</span>
                <span class="code-title">{{ title }}</span>
                <span class="code-badge">{{ language }}</span>
                <span class="code-lines">{{ totalLines }} lines</span>
            </div>
            <div class="header-actions">
                <button class="expand-btn" @click="isExpanded = !isExpanded">
                    {{ isExpanded ? 'Show Preview (10 lines)' : 'Show Full Code' }}
                </button>
                <button class="copy-btn-small" @click="copyCode" :title="copied ? 'Copied!' : 'Copy code'">
                    <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            </div>
        </div>

        <div class="code-content">
            <div v-if="!isExpanded && totalLines > 10" class="preview-indicator">
                Showing last 10 lines • Click "Show Full Code" to see all {{ totalLines }} lines
            </div>
            <pre><code>{{ displayCode }}</code></pre>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
    code: string;
    language?: string;
    title?: string;
    icon?: string;
}>();

const isExpanded = ref(false);
const copied = ref(false);

const codeLines = computed(() => props.code.split('\n'));
const totalLines = computed(() => codeLines.value.length);

const displayCode = computed(() => {
    if (isExpanded.value || totalLines.value <= 10) {
        return props.code;
    }
    // Show last 10 lines
    return codeLines.value.slice(-10).join('\n');
});

function copyCode() {
    navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => {
        copied.value = false;
    }, 2000);
}
</script>

<style scoped>
.code-block {
    margin: 16px 0;
    border: 1px solid var(--border-color);
    overflow: hidden;
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
    gap: 12px;
    flex: 1;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.code-icon {
    font-size: 20px;
}

.code-title {
    font-weight: 600;
    color: var(--text-primary);
}

.code-badge {
    padding: 4px 8px;
    background: rgba(160, 80, 255, 0.2);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--primary-light);
    text-transform: uppercase;
}

.code-lines {
    padding: 4px 8px;
    background: rgba(80, 200, 120, 0.2);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--success);
}

.expand-btn {
    padding: 6px 12px;
    background: rgba(160, 80, 255, 0.2);
    border: 1px solid var(--primary);
    border-radius: 6px;
    color: var(--primary-light);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.expand-btn:hover {
    background: rgba(160, 80, 255, 0.3);
    transform: translateY(-1px);
}

.copy-btn-small {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.copy-btn-small:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: var(--primary);
}

.copy-btn-small svg {
    width: 16px;
    height: 16px;
    color: var(--text-secondary);
}

.code-content {
    position: relative;
    padding: 16px;
    background: rgba(0, 0, 0, 0.4);
    max-height: 500px;
    overflow-y: auto;
}

.preview-indicator {
    padding: 8px 12px;
    margin-bottom: 12px;
    background: rgba(255, 193, 7, 0.1);
    border-left: 3px solid rgba(255, 193, 7, 0.6);
    border-radius: 4px;
    font-size: 12px;
    color: rgba(255, 193, 7, 0.9);
    font-weight: 500;
}

.code-content pre {
    margin: 0;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #e2e8f0;
}

.code-content code {
    color: #e2e8f0;
}
</style>
