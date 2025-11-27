<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1 class="gradient-text">Conflu2UI</h1>
        <p class="text-secondary">Transform User Stories into Interactive Prototypes</p>
      </div>
    </header>

    <main class="main-content">
      <div class="two-column-layout">
        <!-- Left Column: Workflow Progress (Always visible) -->
        <aside class="workflow-sidebar">
          <WorkflowProgress :current-step="currentStep" />
        </aside>

        <!-- Right Column: Current Step Content -->
        <section class="step-content">
        <!-- Step 1: Upload User Story -->
        <div v-if="currentStep === 'upload-story'" class="step-container animate-slide-in-up">
          <FileUpload title="Upload User Story" description="Upload your user story document (markdown or text file)"
            accept=".md,.txt,text/markdown,text/plain" accept-label="Markdown (.md) or Text (.txt) files"
            :multiple="false" @upload="handleUserStoryUpload" />
        </div>

        <!-- Step 2: Upload Images (Optional) -->
        <div v-else-if="currentStep === 'upload-images'" class="step-container animate-slide-in-up">
          <FileUpload title="Upload Reference Images"
            description="Upload screen sketches or reference images (optional)" accept="image/*"
            accept-label="Image files (PNG, JPG, etc.)" :multiple="true" :optional="true" @upload="handleImagesUpload"
            @skip="skipImages" />
        </div>

        <!-- Step 3: BA Conversation -->
        <div v-else-if="currentStep === 'ba-conversation'" class="step-container animate-slide-in-up">
          <div class="conversation-container glass">
            <h2>Business Analyst Review</h2>
            <p class="text-secondary">BA กำลังวิเคราะห์ Requirements และอาจมีคำถามเพื่อความชัดเจน</p>

            <MessageStream :messages="sessions.ba.messages" :is-streaming="isStreaming && currentAgent === 'ba'"
              agent-role="ba" />

            <!-- Show question form if BA has questions -->
            <BAQuestionForm
              v-if="baQuestions.length > 0 && !isStreaming && !useManualInput"
              :questions="baQuestions"
              :disabled="isStreaming"
              @submit="handleBAQuestionAnswers"
              @skip="useManualInput = true"
            />

            <!-- Manual input mode (fallback) -->
            <UserPrompt
              v-else-if="!isStreaming && baQuestions.length === 0"
              placeholder="พิมพ์คำตอบของคุณที่นี่..."
              hint="กด Cmd/Ctrl+Enter เพื่อส่ง"
              button-text="ส่ง"
              :disabled="isStreaming"
              @send="handleBAMessage"
            />

            <!-- Auto-proceed indicator -->
            <div v-if="isStreaming" class="processing-indicator">
              <div class="spinner"></div>
              <span>กำลังประมวลผล...</span>
            </div>
          </div>
        </div>

        <!-- Step 4: SA Design -->
        <div v-else-if="currentStep === 'sa-design'" class="step-container animate-slide-in-up">
          <div class="agent-workspace">
            <div class="chat-panel glass">
              <h2>System Analyst Design</h2>
              <p class="text-secondary">The SA is designing the architecture and creating your prototype.</p>
              <MessageStream :messages="getMessagesWithoutCode(sessions.sa.messages)"
                :is-streaming="isStreaming && currentAgent === 'sa'" agent-role="sa" />
            </div>
            <div class="code-panel">
              <VueReplPreview :code="extractLatestCode(sessions.sa.messages)"
                :is-streaming="isStreaming && currentAgent === 'sa'" />
            </div>
          </div>
        </div>

        <!-- Step 5: DEV Implementation -->
        <div v-else-if="currentStep === 'dev-implementation'" class="step-container animate-slide-in-up">
          <div class="agent-workspace">
            <div class="chat-panel glass">
              <h2>Developer Implementation</h2>
              <p class="text-secondary">The developer is refining and implementing the prototype.</p>
              <MessageStream :messages="getMessagesWithoutCode(sessions.dev.messages)"
                :is-streaming="isStreaming && currentAgent === 'dev'" agent-role="dev" />
            </div>
            <div class="code-panel">
              <VueReplPreview
                :code="extractLatestCode(sessions.dev.messages)"
                :is-streaming="isStreaming && currentAgent === 'dev'"
                :auto-fix-on-error="true"
                @fix-errors="handleReplErrors"
              />
            </div>
          </div>
        </div>

        <!-- Step 6: Validation -->
        <div v-else-if="currentStep === 'validation'" class="step-container animate-slide-in-up">
          <div class="validation-container glass">
            <h2>Validating Prototype</h2>
            <div class="validation-status">
              <div v-if="isValidating" class="status-message">
                <div class="spinner"></div>
                <p>Validating HTML structure and syntax...</p>
              </div>
              <div v-else-if="context.validationErrors.length > 0" class="status-message error">
                <p>⚠️ Validation errors found. Sending back to developer...</p>
                <ul class="error-list">
                  <li v-for="(error, index) in context.validationErrors" :key="index">
                    {{ error.message }}
                  </li>
                </ul>
              </div>
              <div v-else class="status-message success">
                <p>✓ Validation passed! Prototype is ready.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 7: Preview -->
        <div v-else-if="currentStep === 'preview'" class="step-container animate-slide-in-up">
          <div class="preview-section">
            <div class="preview-header glass">
              <h2>Prototype Preview</h2>
              <p class="text-secondary">Your interactive prototype is ready! Edit code directly in the REPL.</p>
            </div>

            <div class="repl-preview-container">
              <VueReplPreview
                :code="context.htmlPrototype"
                @fix-errors="handleReplErrors"
              />
            </div>

            <div class="iteration-box glass">
              <h3>Want to make changes?</h3>
              <UserPrompt placeholder="Describe what you'd like to change..." hint="Press Cmd/Ctrl+Enter to send"
                button-text="Request Changes" :disabled="isStreaming" @send="handleDevIteration" />
            </div>
          </div>
        </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Message } from './types/workflow';

const { currentStep, context, updateContext, uploadUserStory, uploadImages, handoffToSA: workflowHandoffToSA, handoffToDev, validatePrototype, setStep } = useWorkflow();
const { sessions, currentAgent, addMessage, setAgentStatus, activateAgent } = useAgentChat();
const { sendMessage, isStreaming } = useAIStream();
const { readFileAsText, readFileAsBase64 } = useFileHandler();

const isValidating = ref(false);
const useManualInput = ref(false);
const showBAConfirmation = ref(false); // Keep for continueBA compatibility

// Parse questions from BA's last message using <!Q!>...<!Q!> format
const baQuestions = computed(() => {
  const baMessages = sessions.value.ba.messages;
  if (baMessages.length === 0) return [];

  // Get the last assistant message
  const lastAssistantMsg = [...baMessages].reverse().find(m => m.role === 'assistant');
  if (!lastAssistantMsg?.content) return [];

  const content = lastAssistantMsg.content;
  const questions: string[] = [];

  // Primary strategy: Find all questions wrapped in <!Q!>...<!Q!> tags
  const questionTagPattern = /<!Q!>([\s\S]*?)<!Q!>/g;
  let match;
  while ((match = questionTagPattern.exec(content)) !== null) {
    const q = match[1].trim();
    if (q.length > 5) {
      questions.push(q);
    }
  }

  // Reset manual input mode when new questions detected
  if (questions.length > 0) {
    useManualInput.value = false;
  }

  return questions;
});

// Helper: Extract latest Vue SFC or HTML code from messages
function extractLatestCode(messages: Message[]): string {
  // Look for the latest code block in assistant messages (reverse order)
  // Try Vue SFC first, then fall back to HTML
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'assistant' && msg.content) {
      // Try Vue SFC first
      const vueMatch = msg.content.match(/```vue\n([\s\S]*?)(?:\n```|$)/);
      if (vueMatch) {
        return vueMatch[1];
      }
      // Fall back to HTML
      const htmlMatch = msg.content.match(/```html\n([\s\S]*?)(?:\n```|$)/);
      if (htmlMatch) {
        return htmlMatch[1];
      }
    }
  }
  return '';
}

// Helper: Get messages with code blocks removed for cleaner chat display
function getMessagesWithoutCode(messages: Message[]): Message[] {
  return messages.map(msg => {
    if (msg.role === 'assistant' && msg.content) {
      // Remove Vue SFC and HTML code blocks from content
      let cleanContent = msg.content
        .replace(/```vue\n[\s\S]*?(?:\n```|$)/g, '\n\n*[Vue SFC code displayed in the REPL on the right]*\n\n')
        .replace(/```html\n[\s\S]*?(?:\n```|$)/g, '\n\n*[Code displayed in the panel on the right]*\n\n');
      return { ...msg, content: cleanContent.trim() };
    }
    return msg;
  });
}

// Step 1: Handle User Story Upload
async function handleUserStoryUpload(files: File[]) {
  try {
    const content = await readFileAsText(files[0]);
    await uploadUserStory(content);
    setStep('upload-images');
  } catch (error) {
    console.error('Error uploading user story:', error);
  }
}

// Step 2: Handle Images Upload
async function handleImagesUpload(files: File[]) {
  try {
    const imagePromises = files.map(file => readFileAsBase64(file));
    const images = await Promise.all(imagePromises);
    await uploadImages(images);
    startBAConversation();
  } catch (error) {
    console.error('Error uploading images:', error);
  }
}

function skipImages() {
  startBAConversation();
}

// Step 3: BA Conversation
async function startBAConversation() {
  setStep('ba-conversation');
  activateAgent('ba');
  setAgentStatus('ba', 'processing');

  try {
    // BA starts by analyzing the user story
    await sendMessage('ba', 'วิเคราะห์ User Story ของ ผู้ใช้งานและถามคำถามเพื่อความชัดเจนหากจำเป็น.', context.value.userStory);
  } catch (error) {
    console.error('Error starting BA conversation:', error);
    setAgentStatus('ba', 'error');
  }
}

async function handleBAMessage(message: string) {
  useManualInput.value = false; // Reset after sending
  try {
    const response = await sendMessage('ba', message);
    await checkIfBAReadyAndProceed(response);
  } catch (error) {
    console.error('Error sending BA message:', error);
  }
}

async function handleBAQuestionAnswers(formattedAnswers: string) {
  useManualInput.value = false;
  try {
    const response = await sendMessage('ba', formattedAnswers);
    await checkIfBAReadyAndProceed(response);
  } catch (error) {
    console.error('Error sending BA answers:', error);
  }
}

async function checkIfBAReadyAndProceed(response: string) {
  // Check if BA has explicitly signaled handoff with <!HANDOFF!> tag
  const hasHandoffTag = response.includes('<!HANDOFF!>');

  if (hasHandoffTag) {
    // Short delay to let user see the summary before proceeding
    await new Promise(resolve => setTimeout(resolve, 1500));
    await handoffToSA();
  }
}

function continueBA() {
  showBAConfirmation.value = false;
}

async function handoffToSA() {
  showBAConfirmation.value = false;

  // Get BA's last message as the summary
  const baMessages = sessions.value.ba.messages;
  const baSummary = baMessages[baMessages.length - 1]?.content || '';

  updateContext({ baDocument: baSummary });
  setAgentStatus('ba', 'complete');

  setStep('sa-design');
  activateAgent('sa');
  setAgentStatus('sa', 'processing');

  try {
    // SA creates UI/UX specification (no HTML)
    const saMessage = `นี่คือเอกสารจากสรุป User Story จาก BA's. ให้ดำเนินการออกแบบ UI/UX Specification สำหรับ Prototype:\n\n${baSummary}`;
    const saResponse = await sendMessage('sa', saMessage);

    // SA doesn't generate HTML anymore, just save the spec
    updateContext({ saDocument: saResponse });
    setAgentStatus('sa', 'complete');

    // Move to DEV with SA's specification
    proceedToDev(saResponse);
  } catch (error) {
    console.error('Error in SA process:', error);
    setAgentStatus('sa', 'error');
  }
}

async function proceedToDev(saDocument: string) {
  setStep('dev-implementation');
  activateAgent('dev');
  setAgentStatus('dev', 'processing');

  try {
    // DEV creates the Vue SFC prototype based on SA's specification
    const devMessage = `จากเอกสาร SA's UI/UX Specification. ดำเนินการพัฒนา Vue SFC prototype (App.vue):\n\n${saDocument}`;
    const devResponse = await sendMessage('dev', devMessage);

    // Extract Vue SFC from DEV response (try vue first, then html for backward compat)
    const vueMatch = devResponse.match(/```vue\n([\s\S]*?)\n```/) || devResponse.match(/```html\n([\s\S]*?)\n```/);
    if (vueMatch) {
      const code = vueMatch[1];
      updateContext({ htmlPrototype: code });
      setAgentStatus('dev', 'complete');

      // Skip traditional validation for Vue SFC - REPL will handle errors
      setStep('preview');
    } else {
      console.error('DEV did not return Vue SFC');
      setAgentStatus('dev', 'error');
    }
  } catch (error) {
    console.error('Error in DEV process:', error);
    setAgentStatus('dev', 'error');
  }
}

async function runValidation(html: string) {
  setStep('validation');
  isValidating.value = true;

  try {
    const isValid = await validatePrototype(html);

    if (isValid) {
      // Validation passed!
      isValidating.value = false;
      setTimeout(() => {
        setStep('preview');
      }, 2000);
    } else {
      // Validation failed, send back to DEV
      isValidating.value = false;
      setTimeout(() => {
        fixValidationErrors();
      }, 3000);
    }
  } catch (error) {
    console.error('Error validating:', error);
    isValidating.value = false;
  }
}

async function fixValidationErrors() {
  setStep('dev-implementation');
  setAgentStatus('dev', 'processing');

  const errorMessage = `The Vue SFC has validation errors:\n${context.value.validationErrors.map(e => `- ${e.message}`).join('\n')}\n\nPlease fix these issues and provide the corrected Vue SFC.`;

  try {
    const devResponse = await sendMessage('dev', errorMessage);

    const vueMatch = devResponse.match(/```vue\n([\s\S]*?)\n```/) || devResponse.match(/```html\n([\s\S]*?)\n```/);
    if (vueMatch) {
      const fixedCode = vueMatch[1];
      updateContext({ htmlPrototype: fixedCode });
      setAgentStatus('dev', 'complete');
      setStep('preview');
    }
  } catch (error) {
    console.error('Error fixing validation:', error);
    setAgentStatus('dev', 'error');
  }
}

// Handle REPL compilation errors - auto-fix by sending to DEV
async function handleReplErrors(payload: { code: string; errors: string[] }) {
  if (isStreaming.value) return; // Don't interrupt if already streaming

  setStep('dev-implementation');
  setAgentStatus('dev', 'processing');

  const errorMessage = `โค้ด Vue SFC มี compilation errors จาก REPL:\n\n**Errors:**\n${payload.errors.map(e => `- ${e}`).join('\n')}\n\n**Current Code:**\n\`\`\`vue\n${payload.code}\n\`\`\`\n\nกรุณาแก้ไข errors เหล่านี้และส่งโค้ดที่ถูกต้องกลับมา`;

  try {
    const devResponse = await sendMessage('dev', errorMessage);

    const vueMatch = devResponse.match(/```vue\n([\s\S]*?)\n```/) || devResponse.match(/```html\n([\s\S]*?)\n```/);
    if (vueMatch) {
      const fixedCode = vueMatch[1];
      updateContext({ htmlPrototype: fixedCode });
      setAgentStatus('dev', 'complete');
      setStep('preview');
    }
  } catch (error) {
    console.error('Error fixing REPL errors:', error);
    setAgentStatus('dev', 'error');
  }
}

async function handleDevIteration(message: string) {
  setStep('dev-implementation');
  setAgentStatus('dev', 'processing');

  try {
    const devResponse = await sendMessage('dev', message);

    const vueMatch = devResponse.match(/```vue\n([\s\S]*?)\n```/) || devResponse.match(/```html\n([\s\S]*?)\n```/);
    if (vueMatch) {
      const updatedCode = vueMatch[1];
      updateContext({ htmlPrototype: updatedCode });
      setAgentStatus('dev', 'complete');
      setStep('preview');
    }
  } catch (error) {
    console.error('Error in DEV iteration:', error);
    setAgentStatus('dev', 'error');
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  padding-bottom: 60px;
}

.app-header {
  padding: 40px 20px;
  text-align: center;
  background: linear-gradient(180deg, rgba(160, 80, 255, 0.1) 0%, transparent 100%);
}

.header-content h1 {
  font-size: 56px;
  margin-bottom: 12px;
}

.header-content p {
  font-size: 18px;
}

.main-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

.two-column-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
  align-items: start;
}

.workflow-sidebar {
  position: sticky;
  top: 20px;
}

.step-content {
  min-height: 400px;
}

.step-container {
  width: 100%;
}

/* Agent workspace: 2-column layout for SA/DEV */
.agent-workspace {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  min-height: 500px;
}

.chat-panel {
  padding: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-panel h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.chat-panel > p {
  margin-bottom: 16px;
}

.code-panel {
  display: flex;
  flex-direction: column;
}

/* Responsive: Stack on smaller screens */
@media (max-width: 1024px) {
  .two-column-layout {
    grid-template-columns: 1fr;
  }

  .workflow-sidebar {
    position: static;
  }

  .agent-workspace {
    grid-template-columns: 1fr;
  }

  .code-panel {
    order: -1;
  }
}

.conversation-container {
  padding: 32px;
  margin: 20px 0;
}

.conversation-container h2 {
  font-size: 32px;
  margin-bottom: 8px;
}

.conversation-container>p {
  margin-bottom: 32px;
}

.confirmation-box {
  margin-top: 32px;
  padding: 24px;
  border: 2px solid var(--success);
}

.confirmation-box h3 {
  color: var(--success);
  margin-bottom: 12px;
}

.confirmation-box .actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.validation-container {
  padding: 48px;
  text-align: center;
}

.validation-status {
  margin-top: 32px;
}

.status-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.status-message p {
  font-size: 18px;
}

.status-message.error {
  color: var(--error);
}

.status-message.success {
  color: var(--success);
}

.error-list {
  text-align: left;
  background: rgba(255, 80, 80, 0.1);
  padding: 16px 24px;
  border-radius: 12px;
  margin-top: 16px;
  width: 100%;
  max-width: 600px;
}

.error-list li {
  margin-bottom: 8px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.preview-section {
  width: 100%;
}

.preview-header {
  padding: 32px;
  margin-bottom: 24px;
  text-align: center;
}

.preview-header h2 {
  font-size: 36px;
  margin-bottom: 8px;
}

.repl-preview-container {
  min-height: 600px;
  margin-bottom: 24px;
}

.iteration-box {
  padding: 32px;
  margin-top: 32px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.iteration-box h3 {
  margin-bottom: 16px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.processing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  margin-top: 20px;
  background: rgba(160, 80, 255, 0.05);
  border: 1px solid rgba(160, 80, 255, 0.2);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.processing-indicator .spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>
