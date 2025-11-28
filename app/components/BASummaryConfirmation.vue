<template>
  <div class="ba-summary-confirmation glass">
    <div class="summary-header">
      <h3>📋 สรุป Requirements จาก BA</h3>
      <p class="text-secondary">กรุณาตรวจสอบบทสรุปด้านล่าง แล้วเลือกดำเนินการต่อหรือขอแก้ไข</p>
    </div>

    <div class="summary-content">
      <div class="markdown-content" v-html="renderedSummary"></div>
    </div>

    <div class="summary-actions">
      <div class="action-buttons">
        <button
          class="btn btn-secondary"
          :disabled="disabled || isEditMode"
          @click="enterEditMode"
        >
          ✏️ ต้องการแก้ไข
        </button>
        <button
          class="btn btn-primary"
          :disabled="disabled || isEditMode"
          @click="confirmAndProceed"
        >
          ✅ ยืนยันส่งงานให้ SA
        </button>
      </div>

      <!-- Edit Mode -->
      <div v-if="isEditMode" class="edit-section">
        <label class="edit-label">พิมพ์สิ่งที่ต้องการแก้ไขหรือเพิ่มเติม:</label>
        <textarea
          v-model="editFeedback"
          class="edit-input"
          placeholder="เช่น: เพิ่มฟีเจอร์การส่งอีเมลแจ้งเตือน, แก้ไขจำนวนผู้ใช้เป็น 1000 คน..."
          rows="3"
          :disabled="disabled"
        ></textarea>
        <div class="edit-actions">
          <button
            class="btn btn-ghost"
            :disabled="disabled"
            @click="cancelEdit"
          >
            ยกเลิก
          </button>
          <button
            class="btn btn-primary"
            :disabled="!editFeedback.trim() || disabled"
            @click="submitEdit"
          >
            ส่งคำขอแก้ไข
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it';

const props = defineProps<{
  summary: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  edit: [feedback: string];
}>();

const md = new MarkdownIt();
const isEditMode = ref(false);
const editFeedback = ref('');

const renderedSummary = computed(() => {
  // Remove <!SUMMARY!> tag from display
  const cleanSummary = props.summary.replace(/<!SUMMARY!>/g, '').trim();
  return md.render(cleanSummary);
});

function enterEditMode() {
  isEditMode.value = true;
}

function cancelEdit() {
  isEditMode.value = false;
  editFeedback.value = '';
}

function confirmAndProceed() {
  emit('confirm');
}

function submitEdit() {
  if (editFeedback.value.trim()) {
    emit('edit', editFeedback.value.trim());
    isEditMode.value = false;
    editFeedback.value = '';
  }
}
</script>

<style scoped>
.ba-summary-confirmation {
  padding: 24px;
  margin: 20px 0;
}

.summary-header {
  margin-bottom: 20px;
}

.summary-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: var(--success);
}

.summary-content {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.markdown-content {
  font-size: 14px;
  line-height: 1.6;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.summary-actions {
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.edit-section {
  margin-top: 20px;
  padding: 16px;
  background: rgba(160, 80, 255, 0.05);
  border: 1px solid rgba(160, 80, 255, 0.2);
  border-radius: 12px;
}

.edit-label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.edit-input {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
}

.edit-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(160, 80, 255, 0.1);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}
</style>

