<template>
  <div class="message-stream">
    <div v-for="(message, index) in messages" :key="index" class="message"
      :class="{ user: message.role === 'user', assistant: message.role === 'assistant' }">
      <div v-if="message.role === 'assistant'" class="avatar">
        <span>🤖</span>
      </div>

      <div class="message-content glass">
        <div v-if="message.isThinking" class="thinking-badge">
          <div class="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          Thinking...
        </div>

        <div class="content-wrapper">
          <div class="content-text" v-html="renderMessageContent(message.content).html"></div>

          <!-- Render collapsible code blocks for SA/DEV agents -->
          <div v-for="block in renderMessageContent(message.content).codeBlocks" :key="block.id">
            <CodeBlock v-if="shouldCollapseCode(agentRole, block.language)" :code="block.code"
              :language="block.language" :title="getCodeBlockTitle(block.language)"
              :icon="getCodeBlockIcon(block.language)" />
          </div>
        </div>

        <div class="timestamp">
          {{ formatTime(message.timestamp) }}
        </div>
      </div>

      <div v-if="message.role === 'user'" class="avatar user-avatar">
        <span>👤</span>
      </div>
    </div>

    <div v-if="isStreaming" class="typing-indicator">
      <div class="glass typing-content">
        <div class="thinking-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '../types/workflow';
import MarkdownIt from 'markdown-it';
import CodeBlock from './CodeBlock.vue';

const props = defineProps<{
  messages: Message[];
  isStreaming?: boolean;
  agentRole?: 'ba' | 'sa' | 'dev';
}>();

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
});

function extractCodeBlocks(content: string): Array<{ language: string; code: string; fullMatch: string }> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string; fullMatch: string }> = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
      fullMatch: match[0],
    });
  }

  return blocks;
}

function renderMessageContent(content: string): { html: string; codeBlocks: Array<{ language: string; code: string; id: string }> } {
  if (!content) return { html: '', codeBlocks: [] };

  // Extract code blocks
  const codeBlocks = extractCodeBlocks(content);

  // Replace code blocks with placeholders
  let processedContent = content;
  const codeBlockData: Array<{ language: string; code: string; id: string }> = [];

  codeBlocks.forEach((block, index) => {
    const id = `code-block-${index}`;
    codeBlockData.push({
      language: block.language,
      code: block.code,
      id,
    });
    processedContent = processedContent.replace(block.fullMatch, `<div class="code-placeholder" data-id="${id}"></div>`);
  });

  // Render markdown
  const html = md.render(processedContent);

  return { html, codeBlocks: codeBlockData };
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shouldCollapseCode(role?: 'ba' | 'sa' | 'dev', language?: string): boolean {
  // Collapse code blocks for SA and DEV agents
  return (role === 'sa' || role === 'dev') && language === 'html';
}

function getCodeBlockTitle(language: string): string {
  if (language === 'html') return 'Generated Prototype HTML';
  return `${language.toUpperCase()} Code`;
}

function getCodeBlockIcon(language: string): string {
  if (language === 'html') return '📄';
  if (language === 'javascript' || language === 'js') return '⚡';
  if (language === 'css') return '🎨';
  return '💻';
}

</script>

<style scoped>
.message-stream {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  animation: slide-in-up 0.3s ease-out;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.user-avatar {
  background: linear-gradient(135deg, var(--secondary), var(--primary));
}

.message-content {
  max-width: 85%;
  padding: 12px 16px;
  position: relative;
}

.message.user .message-content {
  background: linear-gradient(135deg, rgba(80, 200, 255, 0.15), rgba(160, 80, 255, 0.15));
  border-color: rgba(80, 200, 255, 0.3);
}

.thinking-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: rgba(160, 80, 255, 0.2);
  border-radius: 4px;
  font-size: 11px;
  color: var(--primary-light);
  margin-bottom: 10px;
}

.thinking-dots {
  display: flex;
  gap: 3px;
}

.thinking-dots span {
  width: 5px;
  height: 5px;
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
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

.content-text {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.7;
  word-wrap: break-word;
  letter-spacing: 0.01em;
}

/* Paragraphs */
.content-text :deep(p) {
  margin: 0 0 0.75em 0;
}

.content-text :deep(p:last-child) {
  margin-bottom: 0;
}

/* Headings */
.content-text :deep(h1) {
  font-size: 1.4em;
  font-weight: 600;
  margin: 1em 0 0.5em 0;
  color: var(--text-primary);
}

.content-text :deep(h2) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 0.9em 0 0.4em 0;
  color: var(--text-primary);
}

.content-text :deep(h3) {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0.8em 0 0.4em 0;
  color: var(--text-primary);
}

.content-text :deep(h4),
.content-text :deep(h5),
.content-text :deep(h6) {
  font-size: 1em;
  font-weight: 600;
  margin: 0.7em 0 0.3em 0;
  color: var(--text-secondary);
}

/* Inline code */
.content-text :deep(code) {
  background: rgba(0, 0, 0, 0.35);
  padding: 2px 5px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', 'SF Mono', monospace;
  font-size: 0.85em;
  color: #e2b6ff;
}

/* Code blocks */
.content-text :deep(pre) {
  background: rgba(0, 0, 0, 0.45);
  padding: 12px 14px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
  border-left: 3px solid var(--primary);
}

.content-text :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #e2e8f0;
}

/* Lists */
.content-text :deep(ul),
.content-text :deep(ol) {
  margin: 0.5em 0 0.75em 0;
  padding-left: 1.5em;
}

.content-text :deep(li) {
  margin-bottom: 0.3em;
  line-height: 1.6;
}

.content-text :deep(li:last-child) {
  margin-bottom: 0;
}

/* Nested lists */
.content-text :deep(ul ul),
.content-text :deep(ol ol),
.content-text :deep(ul ol),
.content-text :deep(ol ul) {
  margin: 0.3em 0 0.3em 0;
}

/* Blockquote */
.content-text :deep(blockquote) {
  margin: 0.75em 0;
  padding: 8px 12px;
  border-left: 3px solid var(--primary-light);
  background: rgba(160, 80, 255, 0.08);
  border-radius: 0 6px 6px 0;
  font-style: italic;
  color: var(--text-secondary);
}

/* Links */
.content-text :deep(a) {
  color: var(--primary-light);
  text-decoration: none;
  border-bottom: 1px dotted var(--primary-light);
  transition: all 0.2s ease;
}

.content-text :deep(a:hover) {
  color: var(--secondary);
  border-bottom-color: var(--secondary);
}

/* Strong and emphasis */
.content-text :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}

.content-text :deep(em) {
  font-style: italic;
  color: var(--text-secondary);
}

/* Horizontal rule */
.content-text :deep(hr) {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-color), transparent);
  margin: 1em 0;
}

/* Tables */
.content-text :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75em 0;
  font-size: 0.9em;
}

.content-text :deep(th),
.content-text :deep(td) {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  text-align: left;
}

.content-text :deep(th) {
  background: rgba(160, 80, 255, 0.15);
  font-weight: 600;
}

.content-text :deep(tr:nth-child(even)) {
  background: rgba(255, 255, 255, 0.02);
}

.timestamp {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 6px;
  text-align: right;
  opacity: 0.7;
}

.typing-indicator {
  display: flex;
  gap: 10px;
  align-items: center;
}

.typing-content {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
