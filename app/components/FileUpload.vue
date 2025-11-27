<template>
  <div class="file-upload glass">
    <h3>{{ title }}</h3>
    <p class="text-muted">{{ description }}</p>
    
    <div
      class="drop-zone"
      :class="{ dragging: isDragging, hasFiles: selectedFiles.length > 0 }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        @change="handleFileChange"
        style="display: none"
      />
      
      <div v-if="selectedFiles.length === 0" class="drop-content">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p>{{ isDragging ? 'Drop files here' : 'Drag & drop or click to upload' }}</p>
        <span class="text-muted">{{ acceptLabel }}</span>
      </div>
      
      <div v-else class="files-list">
        <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
          <span class="file-name">{{ file.name }}</span>
          <button @click.stop="removeFile(index)" class="remove-btn">×</button>
        </div>
      </div>
    </div>
    
    <div class="actions">
      <button
        v-if="optional"
        class="btn btn-secondary"
        @click="$emit('skip')"
      >
        Skip
      </button>
      <button
        class="btn btn-primary"
        :disabled="selectedFiles.length === 0 || isUploading"
        @click="uploadFiles"
      >
        {{ isUploading ? 'Uploading...' : 'Continue' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  description: string;
  accept: string;
  acceptLabel: string;
  multiple?: boolean;
  optional?: boolean;
}>();

const emit = defineEmits<{
  upload: [files: File[]];
  skip: [];
}>();

const fileInput = ref<HTMLInputElement>();
const selectedFiles = ref<File[]>([]);
const isDragging = ref(false);
const isUploading = ref(false);

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    addFiles(Array.from(input.files));
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
}

function addFiles(files: File[]) {
  if (props.multiple) {
    selectedFiles.value.push(...files);
  } else {
    selectedFiles.value = [files[0]];
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

function uploadFiles() {
  if (selectedFiles.value.length > 0) {
    emit('upload', selectedFiles.value);
  }
}
</script>

<style scoped>
.file-upload {
  padding: 32px;
  max-width: 600px;
  margin: 0 auto;
}

.file-upload h3 {
  font-size: 28px;
  margin-bottom: 8px;
}

.file-upload p {
  margin-bottom: 24px;
}

.drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;
}

.drop-zone:hover {
  border-color: var(--primary);
  background: rgba(160, 80, 255, 0.05);
}

.drop-zone.dragging {
  border-color: var(--primary);
  background: rgba(160, 80, 255, 0.1);
  transform: scale(1.02);
}

.drop-zone.hasFiles {
  border-style: solid;
  border-color: var(--success);
  background: rgba(80, 200, 120, 0.05);
}

.drop-content svg {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  color: var(--primary);
}

.drop-content p {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-darker);
  border-radius: 8px;
}

.file-name {
  font-size: 14px;
  color: var(--text-primary);
}

.remove-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--error);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  transform: scale(1.1);
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
