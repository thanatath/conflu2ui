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
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: slide-in-up 0.3s ease-out;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.user-avatar {
  background: linear-gradient(135deg, var(--secondary), var(--primary));
}

.message-content {
  max-width: 70%;
  padding: 16px 20px;
  position: relative;
}

.message.user .message-content {
  background: linear-gradient(135deg, rgba(80, 200, 255, 0.15), rgba(160, 80, 255, 0.15));
  border-color: rgba(80, 200, 255, 0.3);
}

.thinking-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: rgba(160, 80, 255, 0.2);
  border-radius: 6px;
  font-size: 12px;
  color: var(--primary-light);
  margin-bottom: 12px;
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
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
    transform: translateY(-8px);
  }
}

.content-text {
  color: var(--text-primary);
  line-height: 1.6;
  word-wrap: break-word;
}

.content-text :deep(code) {
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 14px;
}

.content-text :deep(pre) {
  background: rgba(0, 0, 0, 0.4);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.content-text :deep(pre code) {
  background: none;
  padding: 0;
}

.content-text :deep(ul),
.content-text :deep(ol) {
  margin-left: 20px;
  margin-bottom: 12px;
}

.content-text :deep(a) {
  color: var(--primary-light);
  text-decoration: none;
}

.content-text :deep(a:hover) {
  text-decoration: underline;
}

.timestamp {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 8px;
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 12px;
  align-items: center;
}

.typing-content {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
