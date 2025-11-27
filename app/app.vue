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
            <p class="text-secondary">The BA is reviewing your requirements and may ask clarifying questions.</p>

            <MessageStream :messages="sessions.ba.messages" :is-streaming="isStreaming && currentAgent === 'ba'"
              agent-role="ba" />

            <UserPrompt v-if="!showBAConfirmation" placeholder="Type your response here..."
              hint="Press Cmd/Ctrl+Enter to send" button-text="Send" :disabled="isStreaming" @send="handleBAMessage" />

            <!-- Manual handoff button (always show after at least one BA message) -->
            <div v-if="sessions.ba.messages.length >= 2 && !isStreaming" class="manual-handoff">
              <button class="btn btn-primary" @click="showBAConfirmation = true">
                ✓ Ready to proceed to System Analyst
              </button>
            </div>

            <div v-if="showBAConfirmation" class="confirmation-box glass">
              <h3>✓ Requirements Summary Complete</h3>
              <p class="text-secondary">The BA has finalized the requirements. Ready to hand off to System Analyst?</p>
              <div class="actions">
                <button class="btn btn-secondary" @click="continueBA">Continue Discussion</button>
                <button class="btn btn-primary" @click="handoffToSA">Proceed to SA</button>
              </div>
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
              <LiveCodePreview :code="extractLatestCode(sessions.sa.messages)"
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
              <LiveCodePreview :code="extractLatestCode(sessions.dev.messages)"
                :is-streaming="isStreaming && currentAgent === 'dev'" />
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
              <p class="text-secondary">Your interactive prototype is ready! Test it below.</p>
            </div>

            <PreviewContainer :html-content="context.htmlPrototype" />

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

const showBAConfirmation = ref(false);
const isValidating = ref(false);

// Helper: Extract latest HTML code from messages
function extractLatestCode(messages: Message[]): string {
  // Look for the latest HTML code block in assistant messages (reverse order)
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'assistant' && msg.content) {
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
      // Remove HTML code blocks from content
      const cleanContent = msg.content.replace(/```html\n[\s\S]*?(?:\n```|$)/g, '\n\n*[Code displayed in the panel on the right]*\n\n');
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
    await sendMessage('ba', 'Please analyze this user story and ask any clarifying questions you need.', context.value.userStory);
  } catch (error) {
    console.error('Error starting BA conversation:', error);
    setAgentStatus('ba', 'error');
  }
}

async function handleBAMessage(message: string) {
  try {
    const response = await sendMessage('ba', message);

    // Auto-detect if BA is ready to summarize (check for keywords in English and Thai)
    const lowerResponse = response.toLowerCase();
    const isReady = lowerResponse.includes('summary') ||
      lowerResponse.includes('finalized') ||
      lowerResponse.includes('สรุป') ||  // Thai: summarize
      lowerResponse.includes('ครบถ้วน') || // Thai: complete/comprehensive
      lowerResponse.includes('พร้อม'); // Thai: ready

    if (isReady) {
      showBAConfirmation.value = true;
    }
  } catch (error) {
    console.error('Error sending BA message:', error);
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
    // SA starts designing
    const saResponse = await sendMessage('sa', 'Please design the system architecture and create a prototype HTML.', baSummary);

    // Extract HTML from SA response (look for HTML in code blocks)
    const htmlMatch = saResponse.match(/```html\n([\s\S]*?)\n```/);
    if (htmlMatch) {
      const html = htmlMatch[1];
      updateContext({ saDocument: saResponse, htmlPrototype: html });
      setAgentStatus('sa', 'complete');

      // Move to DEV
      proceedToDev(saResponse, html);
    }
  } catch (error) {
    console.error('Error in SA process:', error);
    setAgentStatus('sa', 'error');
  }
}

async function proceedToDev(saDocument: string, html: string) {
  setStep('dev-implementation');
  activateAgent('dev');
  setAgentStatus('dev', 'processing');

  try {
    const devResponse = await sendMessage('dev', 'Please refine and improve this prototype.', saDocument);

    // Extract HTML from DEV response
    const htmlMatch = devResponse.match(/```html\n([\s\S]*?)\n```/);
    if (htmlMatch) {
      const refinedHtml = htmlMatch[1];
      updateContext({ htmlPrototype: refinedHtml });
      setAgentStatus('dev', 'complete');

      // Validate the HTML
      await runValidation(refinedHtml);
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

  const errorMessage = `The HTML has validation errors:\n${context.value.validationErrors.map(e => `- ${e.message}`).join('\n')}\n\nPlease fix these issues and provide the corrected HTML.`;

  try {
    const devResponse = await sendMessage('dev', errorMessage);

    const htmlMatch = devResponse.match(/```html\n([\s\S]*?)\n```/);
    if (htmlMatch) {
      const fixedHtml = htmlMatch[1];
      updateContext({ htmlPrototype: fixedHtml });
      setAgentStatus('dev', 'complete');

      // Re-validate
      await runValidation(fixedHtml);
    }
  } catch (error) {
    console.error('Error fixing validation:', error);
    setAgentStatus('dev', 'error');
  }
}

async function handleDevIteration(message: string) {
  setStep('dev-implementation');
  setAgentStatus('dev', 'processing');

  try {
    const devResponse = await sendMessage('dev', message);

    const htmlMatch = devResponse.match(/```html\n([\s\S]*?)\n```/);
    if (htmlMatch) {
      const updatedHtml = htmlMatch[1];
      updateContext({ htmlPrototype: updatedHtml });
      setAgentStatus('dev', 'complete');

      // Re-validate and return to preview
      const isValid = await validatePrototype(updatedHtml);
      if (isValid) {
        setStep('preview');
      } else {
        await fixValidationErrors();
      }
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

.manual-handoff {
  margin-top: 24px;
  padding: 20px;
  background: rgba(80, 200, 120, 0.05);
  border: 1px solid rgba(80, 200, 120, 0.3);
  border-radius: 12px;
  text-align: center;
}

.manual-handoff .btn {
  font-size: 16px;
  padding: 14px 28px;
}
</style>
