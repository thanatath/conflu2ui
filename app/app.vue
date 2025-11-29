<template>
  <!-- Full page preview mode (separate route) -->
  <NuxtPage v-if="isPreviewRoute" />

  <!-- Main application -->
  <div v-else class="app-container">
    <header class="app-header">
      <div class="header-left">
        <div class="logo-section">
          <span class="logo-icon">🚀</span>
          <div class="title-group">
            <h1 class="gradient-text">Conflu2UI</h1>
            <p class="tagline">AI-Powered Prototyping</p>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <nav class="main-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeMainTab === 'workflow' }"
          @click="activeMainTab = 'workflow'"
        >
          <span class="tab-icon">⚡</span>
          <span>Workflow</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeMainTab === 'documents', 'has-documents': hasAnyDocument }"
          @click="activeMainTab = 'documents'"
        >
          <span class="tab-icon">📄</span>
          <span>Documents</span>
          <span v-if="documentCount > 0" class="doc-count">{{ documentCount }}</span>
        </button>
      </nav>
    </header>

    <main class="main-content">
      <!-- Documents Summary Tab -->
      <div v-if="activeMainTab === 'documents'" class="documents-tab-content animate-slide-in-up">
        <AgentDocumentsSummary
          :ba-document="context.baDocument"
          :sa-document="context.saDocument"
          :dev-document="context.htmlPrototype"
        />
      </div>

      <!-- Workflow Tab -->
      <div v-else class="three-column-layout">
        <!-- Left Column: Workflow Progress -->
        <aside class="workflow-sidebar">
          <WorkflowProgress :current-step="currentStep" />
        </aside>

        <!-- Center Column: Current Step Content -->
        <section class="step-content">
        <!-- Step 1: Upload User Story -->
        <div v-if="currentStep === 'upload-story'" class="step-container animate-slide-in-up">
          <FileUpload title="Upload User Story" description="Upload your user story document (Word, Markdown, or Text file)"
            accept=".doc,.docx,.md,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain" accept-label="Word (.doc, .docx), Markdown (.md), or Text (.txt) files"
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

            <!-- Show BA Summary for user confirmation -->
            <BASummaryConfirmation
              v-if="baSummary && !isStreaming && !isEditingBA"
              :summary="baSummary"
              :disabled="isStreaming"
              @confirm="handleBAConfirmAndProceed"
              @edit="handleBAEditRequest"
            />

            <!-- Show question form if BA has questions (and no summary yet) -->
            <BAQuestionForm
              v-else-if="baQuestions.length > 0 && !isStreaming && !useManualInput && !baSummary"
              :questions="baQuestions"
              :disabled="isStreaming"
              @submit="handleBAQuestionAnswers"
              @skip="useManualInput = true"
              @skipToSA="handleRequestBASummary"
            />

            <!-- Manual input mode (fallback or when editing) -->
            <UserPrompt
              v-else-if="!isStreaming && (baQuestions.length === 0 || isEditingBA) && !baSummary"
              placeholder="พิมพ์คำตอบของคุณที่นี่..."
              hint="กด Cmd/Ctrl+Enter เพื่อส่ง"
              button-text="ส่ง"
              :disabled="isStreaming"
              @send="handleBAMessage"
            />

            <!-- Request Summary Button (when no questions and no summary) -->
            <div v-if="!isStreaming && !baSummary && baQuestions.length === 0 && sessions.ba.messages.length > 1" class="request-summary-section">
              <button class="btn btn-secondary" @click="handleRequestBASummary('')">
                🚀 ขอให้ BA สรุป Requirements
              </button>
            </div>

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
                @ready="handleReplReady"
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
                :auto-fix-on-error="true"
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

        <!-- Right Column: AI Team -->
        <aside class="ai-team-sidebar">
          <FloatingAgentIndicator
            :current-step="currentStep"
            :sessions="sessions"
            :is-streaming="isStreaming"
            :current-agent="currentAgent"
          />
        </aside>
      </div>
    </main>

    <!-- AI Error Toast -->
    <AIErrorToast
      :error="lastError"
      @dismiss="handleErrorDismiss"
      @retry="handleErrorRetry"
    />
  </div>
</template>

<script setup lang="ts">
import type { Message } from './types/workflow';

// Route handling for preview page
const route = useRoute();
const isPreviewRoute = computed(() => route.path === '/preview');

const { currentStep, context, updateContext, uploadUserStory, uploadImages, handoffToSA: workflowHandoffToSA, handoffToDev, validatePrototype, setStep } = useWorkflow();
const { sessions, currentAgent, addMessage, setAgentStatus, activateAgent } = useAgentChat();
const { sendMessage, isStreaming, lastError, clearError } = useAIStream();
const { readFileAsText, readFileAsBase64, readFileContent } = useFileHandler();

// Track last action for retry
const lastAction = ref<{ type: string; payload: any } | null>(null);

const isValidating = ref(false);
const useManualInput = ref(false);
const isEditingBA = ref(false); // Track if user is editing BA summary

// Tab navigation state
const activeMainTab = ref<'workflow' | 'documents'>('workflow');

// Computed properties for document summary tab
const hasAnyDocument = computed(() => {
  return !!(context.value.baDocument || context.value.saDocument || context.value.htmlPrototype);
});

const documentCount = computed(() => {
  let count = 0;
  if (context.value.baDocument) count++;
  if (context.value.saDocument) count++;
  if (context.value.htmlPrototype) count++;
  return count;
});

// Agent status computeds for header status bar
const baSteps = ['upload-story', 'upload-images', 'ba-conversation', 'ba-confirmation'];
const saSteps = ['sa-design'];
const devSteps = ['dev-implementation', 'validation', 'preview', 'iteration'];

const isBAActive = computed(() => baSteps.includes(currentStep.value));
const isSAActive = computed(() => saSteps.includes(currentStep.value));
const isDEVActive = computed(() => devSteps.includes(currentStep.value));

const isBACompleted = computed(() => {
  const allSteps = [...baSteps, ...saSteps, ...devSteps];
  const currentIndex = allSteps.indexOf(currentStep.value);
  const lastBAIndex = allSteps.indexOf(baSteps[baSteps.length - 1]);
  return currentIndex > lastBAIndex;
});

const isSACompleted = computed(() => {
  const allSteps = [...baSteps, ...saSteps, ...devSteps];
  const currentIndex = allSteps.indexOf(currentStep.value);
  const lastSAIndex = allSteps.indexOf(saSteps[saSteps.length - 1]);
  return currentIndex > lastSAIndex;
});

const isDEVCompleted = computed(() => {
  return currentStep.value === 'preview' || currentStep.value === 'iteration';
});

// Parse BA summary from last message using <!SUMMARY!> tag
const baSummary = computed(() => {
  const baMessages = sessions.value.ba.messages;
  if (baMessages.length === 0) return '';

  // Get the last assistant message
  const lastAssistantMsg = [...baMessages].reverse().find(m => m.role === 'assistant');
  if (!lastAssistantMsg?.content) return '';

  const content = lastAssistantMsg.content;

  // Check if message contains <!SUMMARY!> tag
  if (content.includes('<!SUMMARY!>')) {
    // Extract everything after <!SUMMARY!> tag
    const summaryStart = content.indexOf('<!SUMMARY!>');
    return content.substring(summaryStart);
  }

  return '';
});

// Parse questions from BA's last message using <!Q!>...<!Q!> format
const baQuestions = computed(() => {
  const baMessages = sessions.value.ba.messages;
  if (baMessages.length === 0) return [];

  // Get the last assistant message
  const lastAssistantMsg = [...baMessages].reverse().find(m => m.role === 'assistant');
  if (!lastAssistantMsg?.content) return [];

  const content = lastAssistantMsg.content;

  // If there's a summary, don't show questions
  if (content.includes('<!SUMMARY!>')) return [];

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
    // Use readFileContent which handles Word documents automatically
    const content = await readFileContent(files[0]);
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

// Error handling
function handleErrorDismiss() {
  clearError();
  lastAction.value = null;
}

async function handleErrorRetry() {
  clearError();
  if (!lastAction.value) return;

  const { type, payload } = lastAction.value;
  try {
    switch (type) {
      case 'ba-start':
        await startBAConversation();
        break;
      case 'ba-message':
        await handleBAMessage(payload.message);
        break;
      case 'ba-answers':
        await handleBAQuestionAnswers(payload.formattedAnswers);
        break;
      case 'sa-process':
        await handoffToSA();
        break;
      case 'dev-process':
        await proceedToDev(payload.saDocument);
        break;
    }
  } catch (error) {
    console.error('Retry failed:', error);
  }
}

// Step 3: BA Conversation
async function startBAConversation() {
  setStep('ba-conversation');
  activateAgent('ba');
  setAgentStatus('ba', 'processing');
  lastAction.value = { type: 'ba-start', payload: {} };

  try {
    // BA starts by analyzing the user story (with reference images if available)
    await sendMessage('ba', 'วิเคราะห์ User Story ของ ผู้ใช้งานและถามคำถามเพื่อความชัดเจนหากจำเป็น.', context.value.userStory, context.value.images);
    lastAction.value = null; // Clear on success
  } catch (error) {
    console.error('Error starting BA conversation:', error);
    setAgentStatus('ba', 'error');
  }
}

async function handleBAMessage(message: string) {
  useManualInput.value = false; // Reset after sending
  isEditingBA.value = false; // Reset editing mode
  lastAction.value = { type: 'ba-message', payload: { message } };
  try {
    await sendMessage('ba', message, undefined, context.value.images);
    // No auto-handoff - user must confirm summary
    lastAction.value = null;
  } catch (error) {
    console.error('Error sending BA message:', error);
  }
}

async function handleBAQuestionAnswers(formattedAnswers: string) {
  useManualInput.value = false;
  lastAction.value = { type: 'ba-answers', payload: { formattedAnswers } };
  try {
    await sendMessage('ba', formattedAnswers, undefined, context.value.images);
    // No auto-handoff - user must confirm summary
    lastAction.value = null;
  } catch (error) {
    console.error('Error sending BA answers:', error);
  }
}

// Request BA to create summary (when user clicks "ส่งงานให้ SA")
async function handleRequestBASummary(partialAnswers: string) {
  useManualInput.value = false;
  try {
    // Send partial answers to BA with instruction to summarize
    const summaryRequest = partialAnswers
      ? `${partialAnswers}\n\n---\n**คำสั่ง:** สำหรับคำถามที่ไม่ได้รับคำตอบ ให้คุณตัดสินใจตามความเหมาะสมโดยใช้หลักการ Best Practice กรุณาสรุป Requirements ทั้งหมดโดยใช้แท็ก <!SUMMARY!>`
      : 'กรุณาสรุป Requirements ทั้งหมดที่ได้รับจนถึงตอนนี้ โดยใช้แท็ก <!SUMMARY!>';

    await sendMessage('ba', summaryRequest, undefined, context.value.images);
    // Summary will be shown via baSummary computed property
  } catch (error) {
    console.error('Error requesting BA summary:', error);
  }
}

// User confirms BA summary and proceeds to SA
async function handleBAConfirmAndProceed() {
  await handoffToSA();
}

// User wants to edit BA summary
async function handleBAEditRequest(feedback: string) {
  isEditingBA.value = true;
  try {
    const editMessage = `ผู้ใช้ต้องการแก้ไขบทสรุป:

**Feedback จากผู้ใช้:**
${feedback}

กรุณาทำความเข้าใจ feedback นี้ หากมีคำถามเพิ่มเติมให้ใช้แท็ก <!Q!> หากเข้าใจชัดเจนแล้วให้สร้างบทสรุปใหม่โดยใช้แท็ก <!SUMMARY!>`;

    await sendMessage('ba', editMessage, undefined, context.value.images);
    isEditingBA.value = false;
  } catch (error) {
    console.error('Error handling BA edit request:', error);
    isEditingBA.value = false;
  }
}

// Handoff to SA after user confirmation
async function handoffToSA() {
  lastAction.value = { type: 'sa-process', payload: {} };

  // Get BA's last message (summary) as the document
  const baMessages = sessions.value.ba.messages;
  const baSummaryContent = baMessages[baMessages.length - 1]?.content || '';

  // Clean up the summary (remove <!SUMMARY!> tag)
  const cleanedSummary = baSummaryContent.replace(/<!SUMMARY!>/g, '').trim();

  updateContext({ baDocument: cleanedSummary });
  setAgentStatus('ba', 'complete');

  setStep('sa-design');
  activateAgent('sa');
  setAgentStatus('sa', 'processing');

  try {
    // SA creates UI/UX specification (no HTML) - with reference images
    const saMessage = `นี่คือเอกสารสรุป Requirements จาก BA ที่ผู้ใช้ยืนยันแล้ว ให้ดำเนินการออกแบบ UI/UX Specification สำหรับ Prototype:\n\n${cleanedSummary}`;
    const saResponse = await sendMessage('sa', saMessage, undefined, context.value.images);

    // SA doesn't generate HTML anymore, just save the spec
    updateContext({ saDocument: saResponse });
    setAgentStatus('sa', 'complete');
    lastAction.value = null;

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
  lastAction.value = { type: 'dev-process', payload: { saDocument } };

  try {
    // DEV creates the Vue SFC prototype based on SA's specification - with reference images
    const devMessage = `จากเอกสาร SA's UI/UX Specification. ดำเนินการพัฒนา Vue SFC prototype (App.vue):\n\n${saDocument}`;
    const devResponse = await sendMessage('dev', devMessage, undefined, context.value.images);

    // Extract Vue SFC from DEV response (try vue first, then html for backward compat)
    const vueMatch = devResponse.match(/```vue\n([\s\S]*?)\n```/) || devResponse.match(/```html\n([\s\S]*?)\n```/);
    if (vueMatch) {
      const code = vueMatch[1];
      updateContext({ htmlPrototype: code });
      setAgentStatus('dev', 'complete');
      lastAction.value = null;

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
    const devResponse = await sendMessage('dev', errorMessage, undefined, context.value.images);

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

// Handle REPL compilation/runtime errors - auto-fix by sending to DEV
// This will loop until Vue REPL Preview renders without errors
async function handleReplErrors(payload: { code: string; errors: string[] }) {
  if (isStreaming.value) return; // Don't interrupt if already streaming

  console.log('[App] handleReplErrors called with errors:', payload.errors);

  setStep('dev-implementation');
  setAgentStatus('dev', 'processing');

  // Build structured error message with SPECIFIC fix instructions
  // Note: Using string concatenation to avoid Vue parser issues with script tags in template literals
  const scriptTag = '<scr' + 'ipt setup>';
  const scriptCloseTag = '</scr' + 'ipt>';

  const errorMessage = `🚨 COMPILE ERROR - โค้ดมี syntax errors ต้องแก้ไข

## Errors Found:
${payload.errors.map(e => `- ${e}`).join('\n')}

## Quick Fix Guide:
1. **"Invalid end tag"** = มี tag ปิดไม่ครบ เช่น ต้องมี closing tag ครบ
2. **"Unexpected token"** = syntax ผิด เช่น ลืมปิด " หรือมี < ค้าง
3. **"Attribute name cannot contain"** = ลืม class= เช่น <p class="text-gray">
4. **"Cannot set properties of undefined"** = ต้อง init formData ด้วย reactive({...})
5. **:style binding** = ใช้ \`:style="{ width: value + '%' }"\` ไม่ใช้ \${}

## Current Broken Code:
\`\`\`vue
${payload.code}
\`\`\`

กรุณาแก้ไขโค้ดและส่งกลับมาในรูปแบบ \`\`\`vue ... \`\`\` เท่านั้น`;

  try {
    const devResponse = await sendMessage('dev', errorMessage, undefined, context.value.images);

    const vueMatch = devResponse.match(/```vue\n([\s\S]*?)\n```/) || devResponse.match(/```html\n([\s\S]*?)\n```/);
    if (vueMatch) {
      const fixedCode = vueMatch[1];
      updateContext({ htmlPrototype: fixedCode });
      setAgentStatus('dev', 'complete');
      console.log('[App] Dev returned fixed code, waiting for VueReplPreview to validate...');
    }
  } catch (error) {
    console.error('Error fixing REPL errors:', error);
    setAgentStatus('dev', 'error');
  }
}

// Handle VueReplPreview ready event - code compiled successfully without errors
function handleReplReady() {
  console.log('[App] VueReplPreview ready - no errors, proceeding to preview');
  // Only proceed to preview if we're in dev-implementation step
  if (currentStep.value === 'dev-implementation') {
    setAgentStatus('dev', 'complete');
    setStep('preview');
  }
}

async function handleDevIteration(message: string) {
  setStep('dev-implementation');
  setAgentStatus('dev', 'processing');

  try {
    const devResponse = await sendMessage('dev', message, undefined, context.value.images);

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
  position: relative;
  overflow-x: hidden;
}

/* AI Background Effects */
.ai-background {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(160, 80, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(160, 80, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float-orb 20s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(160, 80, 255, 0.4) 0%, transparent 70%);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(80, 200, 255, 0.3) 0%, transparent 70%);
  top: 50%;
  right: -50px;
  animation-delay: -7s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(255, 100, 200, 0.25) 0%, transparent 70%);
  bottom: -100px;
  left: 30%;
  animation-delay: -14s;
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.9); }
  75% { transform: translate(20px, 10px) scale(1.05); }
}

/* Header - Compact */
.app-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: rgba(15, 15, 25, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
}

.title-group {
  text-align: left;
}

.title-group h1 {
  font-size: 24px;
  margin-bottom: 2px;
  letter-spacing: -0.5px;
}

.tagline {
  font-size: 12px;
  color: var(--text-muted);
}

/* Tab Navigation */
.main-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(160, 80, 255, 0.3);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(160, 80, 255, 0.15), rgba(80, 200, 255, 0.08));
  border-color: rgba(160, 80, 255, 0.5);
  color: var(--text-primary);
}

.tab-btn.has-documents:not(.active) {
  border-color: rgba(80, 200, 120, 0.3);
}

.tab-btn .tab-icon {
  font-size: 16px;
}

.tab-btn .doc-count {
  background: var(--success);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
}

/* Main Content */
.main-content {
  max-width: 1800px;
  margin: 0 auto;
  padding: 32px 48px;
}

.documents-tab-content {
  max-width: 1800px;
  margin: 0 auto;
  padding: 32px 48px;
}

.three-column-layout {
  display: grid;
  grid-template-columns: 320px 1fr 380px;
  gap: 32px;
  align-items: start;
}

.workflow-sidebar {
  position: sticky;
  top: 32px;
}

.ai-team-sidebar {
  position: sticky;
  top: 32px;
}

.step-content {
  min-height: 500px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.step-container {
  width: 100%;
  max-width: 800px;
}

/* Agent workspace: 2-column layout for SA/DEV */
.agent-workspace {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  height: calc(100vh - 200px);
  min-height: 600px;
}

.chat-panel {
  padding: 28px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
  min-width: 0;
}

.chat-panel h2 {
  font-size: 28px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.chat-panel > p {
  margin-bottom: 20px;
  flex-shrink: 0;
  font-size: 15px;
}

/* Allow message stream to scroll within chat panel */
.chat-panel :deep(.message-stream) {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  max-width: 100%;
  margin: 0;
}

.code-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
  overflow: hidden;
}

/* Responsive: Stack on smaller screens */
@media (max-width: 1400px) {
  .three-column-layout {
    grid-template-columns: 280px 1fr 320px;
    gap: 24px;
  }
}

@media (max-width: 1200px) {
  .three-column-layout {
    grid-template-columns: 260px 1fr;
  }

  .ai-team-sidebar {
    display: none;
  }
}

@media (max-width: 1024px) {
  .three-column-layout {
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

.request-summary-section {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
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
  height: 800px;
  max-height: 800px;
  min-height: 800px;
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
