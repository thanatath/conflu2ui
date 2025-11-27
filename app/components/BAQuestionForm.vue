<template>
  <div class="ba-question-form glass">
    <div class="form-header">
      <h3>📋 คำถามจาก Business Analyst</h3>
      <p class="text-secondary">กรุณาตอบคำถามต่อไปนี้เพื่อความชัดเจนของ Requirements</p>
    </div>

    <div class="questions-list">
      <div v-for="(question, index) in questions" :key="index" class="question-item">
        <label class="question-label">
          <span class="question-number">{{ index + 1 }}</span>
          {{ question }}
        </label>
        <textarea
          v-model="answers[index]"
          class="answer-input"
          :placeholder="'ตอบคำถามข้อ ' + (index + 1) + '...'"
          rows="2"
        ></textarea>
      </div>
    </div>

    <div class="form-actions">
      <button 
        class="btn btn-primary" 
        :disabled="!hasAnyAnswer || disabled"
        @click="submitAnswers"
      >
        ส่งคำตอบ
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  questions: string[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  submit: [answers: string];
  skip: [];
}>();

const answers = ref<string[]>(props.questions.map(() => ''));

const hasAnyAnswer = computed(() => answers.value.some(a => a.trim()));

function submitAnswers() {
  // Format answers nicely
  const formattedAnswers = props.questions
    .map((q, i) => {
      const answer = answers.value[i]?.trim() || '(ไม่ได้ตอบ)';
      return `**คำถาม ${i + 1}:** ${q}\n**คำตอบ:** ${answer}`;
    })
    .join('\n\n');

  emit('submit', formattedAnswers);
}

// Reset answers when questions change
watch(() => props.questions, (newQuestions) => {
  answers.value = newQuestions.map(() => '');
}, { deep: true });
</script>

<style scoped>
.ba-question-form {
  padding: 24px;
  margin: 20px 0;
}

.form-header {
  margin-bottom: 24px;
}

.form-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

.question-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.answer-input {
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

.answer-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(160, 80, 255, 0.1);
}

.answer-input::placeholder {
  color: var(--text-muted);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}
</style>

