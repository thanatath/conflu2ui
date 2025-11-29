<template>
  <div class="agent-documents-summary">
    <div class="summary-header glass">
      <div class="header-content">
        <div class="header-title-row">
          <div>
            <h2 class="gradient-text">📚 Agent Documents Summary</h2>
            <p class="text-secondary">สรุปเอกสารจากทุก Agent ในกระบวนการทำงาน</p>
          </div>
          <button
            v-if="hasAnyDocument"
            class="download-zip-btn"
            @click="downloadZip"
            :disabled="isDownloading"
          >
            <span v-if="isDownloading" class="loading-spinner">⏳</span>
            <span v-else>📦</span>
            {{ isDownloading ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด ZIP' }}
          </button>
        </div>
      </div>
      <div class="agents-progress">
        <div v-for="agent in agentsList" :key="agent.id" 
             class="agent-badge" 
             :class="{ active: agent.hasDocument, inactive: !agent.hasDocument }">
          <span class="agent-icon">{{ agent.icon }}</span>
          <span class="agent-name">{{ agent.name }}</span>
          <span v-if="agent.hasDocument" class="check-icon">✓</span>
        </div>
      </div>
    </div>

    <div class="documents-grid">
      <!-- BA Document Card -->
      <div class="document-card glass" :class="{ 'has-content': !!baDocument }">
        <div class="card-header ba">
          <div class="agent-avatar">📋</div>
          <div class="agent-info">
            <h3>Business Analyst</h3>
            <span class="status-badge" :class="baDocument ? 'complete' : 'pending'">
              {{ baDocument ? '✓ เสร็จสมบูรณ์' : '⏳ รอดำเนินการ' }}
            </span>
          </div>
        </div>
        <div class="card-body">
          <div v-if="baDocument" class="document-content">
            <div class="content-label">📄 สรุป Requirements</div>
            <div class="markdown-content" v-html="renderedBA"></div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">📝</div>
            <p>ยังไม่มีเอกสารจาก BA</p>
            <span class="hint">BA จะวิเคราะห์และสรุป Requirements จาก User Story</span>
          </div>
        </div>
      </div>

      <!-- SA Document Card -->
      <div class="document-card glass" :class="{ 'has-content': !!saDocument }">
        <div class="card-header sa">
          <div class="agent-avatar">🏗️</div>
          <div class="agent-info">
            <h3>System Analyst</h3>
            <span class="status-badge" :class="saDocument ? 'complete' : 'pending'">
              {{ saDocument ? '✓ เสร็จสมบูรณ์' : '⏳ รอดำเนินการ' }}
            </span>
          </div>
        </div>
        <div class="card-body">
          <div v-if="saDocument" class="document-content">
            <div class="content-label">🎨 UI/UX Specification</div>
            <div class="markdown-content" v-html="renderedSA"></div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">🎨</div>
            <p>ยังไม่มีเอกสารจาก SA</p>
            <span class="hint">SA จะออกแบบ UI/UX Specification จาก Requirements</span>
          </div>
        </div>
      </div>

      <!-- DEV Document Card -->
      <div class="document-card glass" :class="{ 'has-content': !!devDocument }">
        <div class="card-header dev">
          <div class="agent-avatar">💻</div>
          <div class="agent-info">
            <h3>Developer</h3>
            <span class="status-badge" :class="devDocument ? 'complete' : 'pending'">
              {{ devDocument ? '✓ เสร็จสมบูรณ์' : '⏳ รอดำเนินการ' }}
            </span>
          </div>
        </div>
        <div class="card-body">
          <div v-if="devDocument" class="document-content">
            <div class="content-label">🚀 Vue SFC Prototype</div>
            <div class="code-preview">
              <div class="code-stats">
                <span class="stat">📏 {{ codeLineCount }} lines</span>
                <span class="stat">📦 Vue SFC</span>
              </div>
              <CodeBlock 
                :code="devDocument" 
                language="vue" 
                title="Generated Prototype" 
                icon="⚡" 
              />
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">💻</div>
            <p>ยังไม่มีโค้ดจาก DEV</p>
            <span class="hint">DEV จะพัฒนา Vue SFC Prototype จาก SA Spec</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import JSZip from 'jszip';
import CodeBlock from './CodeBlock.vue';

const props = defineProps<{
  baDocument: string;
  saDocument: string;
  devDocument: string;
}>();

const md = new MarkdownIt({ html: true, linkify: true, breaks: true });
const isDownloading = ref(false);

const renderedBA = computed(() => {
  if (!props.baDocument) return '';
  const cleaned = props.baDocument.replace(/<!SUMMARY!>/g, '').trim();
  return md.render(cleaned);
});

const renderedSA = computed(() => {
  if (!props.saDocument) return '';
  return md.render(props.saDocument);
});

const codeLineCount = computed(() => {
  if (!props.devDocument) return 0;
  return props.devDocument.split('\n').length;
});

const agentsList = computed(() => [
  { id: 'ba', name: 'BA', icon: '📋', hasDocument: !!props.baDocument },
  { id: 'sa', name: 'SA', icon: '🏗️', hasDocument: !!props.saDocument },
  { id: 'dev', name: 'DEV', icon: '💻', hasDocument: !!props.devDocument },
]);

const hasAnyDocument = computed(() => {
  return !!props.baDocument || !!props.saDocument || !!props.devDocument;
});

async function downloadZip() {
  if (isDownloading.value) return;

  isDownloading.value = true;

  try {
    const zip = new JSZip();
    const timestamp = new Date().toISOString().slice(0, 10);

    // Add BA Document
    if (props.baDocument) {
      const baContent = props.baDocument.replace(/<!SUMMARY!>/g, '').trim();
      zip.file('Business_Analyst.md', `# Business Analyst Document\n\n${baContent}`);
    }

    // Add SA Document
    if (props.saDocument) {
      zip.file('System_Analyst.md', `# System Analyst Document\n\n${props.saDocument}`);
    }

    // Add DEV Document
    if (props.devDocument) {
      zip.file('Developer.vue', props.devDocument);
    }

    // Generate ZIP
    const blob = await zip.generateAsync({ type: 'blob' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Documents_Summary_${timestamp}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error creating ZIP:', error);
  } finally {
    isDownloading.value = false;
  }
}
</script>

<style scoped>
.agent-documents-summary {
  width: 100%;
  animation: slide-in-up 0.5s ease-out;
}

.summary-header {
  padding: 28px 32px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-content h2 {
  font-size: 32px;
  margin-bottom: 8px;
}

.header-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.download-zip-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.download-zip-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(160, 80, 255, 0.4);
}

.download-zip-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.agents-progress {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.agent-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.agent-badge.active {
  background: linear-gradient(135deg, rgba(160, 80, 255, 0.15), rgba(80, 200, 255, 0.1));
  border-color: var(--primary);
  box-shadow: 0 0 20px rgba(160, 80, 255, 0.2);
}

.agent-badge.inactive {
  opacity: 0.5;
}

.agent-icon {
  font-size: 18px;
}

.agent-name {
  font-weight: 600;
  font-size: 14px;
}

.check-icon {
  color: var(--success);
  font-weight: bold;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.document-card {
  padding: 0;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.document-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.document-card.has-content {
  border-color: rgba(160, 80, 255, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.card-header.ba {
  background: linear-gradient(135deg, rgba(140, 200, 80, 0.12) 0%, rgba(80, 180, 120, 0.08) 100%);
}

.card-header.sa {
  background: linear-gradient(135deg, rgba(80, 160, 255, 0.12) 0%, rgba(120, 80, 255, 0.08) 100%);
}

.card-header.dev {
  background: linear-gradient(135deg, rgba(255, 120, 80, 0.12) 0%, rgba(255, 80, 160, 0.08) 100%);
}

.agent-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.agent-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
}

.status-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.status-badge.complete {
  background: rgba(80, 200, 120, 0.2);
  color: var(--success);
}

.status-badge.pending {
  background: rgba(255, 180, 80, 0.15);
  color: var(--warning);
}

.card-body {
  padding: 24px;
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
}

.document-content {
  animation: fade-in 0.3s ease;
}

.content-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.markdown-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 1.1em;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin-bottom: 6px;
}

.markdown-content :deep(code) {
  background: rgba(0, 0, 0, 0.35);
  padding: 2px 5px;
  border-radius: 4px;
  font-family: 'Monaco', monospace;
  font-size: 0.85em;
  color: #e2b6ff;
}

.markdown-content :deep(p) {
  margin-bottom: 12px;
}

.code-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.code-stats {
  display: flex;
  gap: 16px;
}

.code-stats .stat {
  font-size: 12px;
  padding: 6px 12px;
  background: rgba(160, 80, 255, 0.1);
  border-radius: 6px;
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  height: 100%;
  min-height: 150px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state p {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-state .hint {
  font-size: 13px;
  color: var(--text-muted);
  max-width: 250px;
}

@media (max-width: 900px) {
  .documents-grid {
    grid-template-columns: 1fr;
  }

  .summary-header {
    padding: 20px;
  }

  .header-content h2 {
    font-size: 24px;
  }
}
</style>

