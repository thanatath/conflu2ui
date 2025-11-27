<template>
  <div class="user-prompt glass">
    <textarea
      v-model="message"
      :placeholder="placeholder"
      class="input-textarea"
      rows="3"
      @keydown.meta.enter="sendMessage"
      @keydown.ctrl.enter="sendMessage"
    ></textarea>
    
    <div class="prompt-actions">
      <span class="text-muted hint">{{ hint }}</span>
      <button
        class="btn btn-primary"
        :disabled="!message.trim() || disabled"
        @click="sendMessage"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  placeholder?: string;
  hint?: string;
  buttonText?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  send: [message: string];
}>();

const message = ref('');

function sendMessage() {
  if (message.value.trim() && !props.disabled) {
    emit('send', message.value);
    message.value = '';
  }
}
</script>

<style scoped>
.user-prompt {
  padding: 20px;
  margin: 20px 0;
}

.input-textarea {
  width: 100%;
  min-height: 100px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
}

.input-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(160, 80, 255, 0.1);
}

.input-textarea::placeholder {
  color: var(--text-muted);
}

.prompt-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.hint {
  font-size: 13px;
}
</style>
