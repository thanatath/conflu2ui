# Conflu2UI - Developer Documentation

> Comprehensive guide for developers and AI agents working on this multi-agent prototype generator

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [Code Structure](#code-structure)
5. [Components Reference](#components-reference)
6. [Composables Reference](#composables-reference)
7. [Server API](#server-api)
8. [Workflow Implementation](#workflow-implementation)
9. [Adding New Features](#adding-new-features)
10. [Common Tasks](#common-tasks)

---

## Project Overview

### Purpose
Transform user stories (markdown/text) into interactive HTML prototypes using a **multi-agent AI system** (BA → SA → DEV) with real-time streaming and validation.

### Tech Stack
- **Framework**: Nuxt 4 (Vue 3 + SSR)
- **Language**: TypeScript
- **AI Provider**: Z.ai API (GLM-4.6 model)
- **Styling**: Custom CSS with glassmorphism
- **Markdown**: markdown-it
- **Validation**: htmlparser2

### Key Characteristics
- **SSR (Server-Side Rendering)**: Nuxt configured for SSR
- **No AI SDK**: Direct API calls via fetch for full control
- **Streaming**: Real-time AI responses via Server-Sent Events (SSE)
- **Multi-Agent**: Separate sessions for BA, SA, DEV agents
- **Single HTML Output**: Self-contained prototypes with Tailwind CDN

---

## Architecture

### High-Level Flow

```
User Input (Story + Images)
         ↓
    BA Agent (Reviews & Clarifies)
         ↓
    BA สรุป Requirements (ใช้แท็ก <!SUMMARY!>)
         ↓
    User ตรวจสอบบทสรุป ─────────────────┐
         │                              │
         │ ยืนยัน                    ต้องการแก้ไข
         ↓                              │
    SA Agent (Designs Spec)  ←──────────┘
         ↓                   (BA ถามคำถามเพิ่มเติมหากจำเป็น
    DEV Agent (Creates Vue SFC)            แล้วสร้างบทสรุปใหม่)
         ↓
    Preview (Vue REPL)
         ↓
   Iteration (User Feedback Loop)
```

**สำคัญ:** BA ไม่สามารถส่งต่องานให้ SA เองได้ - ต้องรอการยืนยันจากผู้ใช้เท่านั้น

### Directory Structure

```
conflu2UI/
├── app/                              # Application code (Nuxt v4)
│   ├── app.vue                       # Main app orchestration
│   ├── assets/css/main.css           # Global styles & design system
│   ├── components/                   # Vue components
│   │   ├── AgentTimeline.vue         # Legacy timeline (replaced)
│   │   ├── WorkflowProgress.vue      # NEW: Step visualization
│   │   ├── CodeBlock.vue             # NEW: Collapsible code viewer
│   │   ├── MessageStream.vue         # Chat message display
│   │   ├── FileUpload.vue            # File upload with drag-drop
│   │   ├── UserPrompt.vue            # User input component
│   │   └── PreviewContainer.vue      # Mobile/Desktop preview
│   ├── composables/                  # Vue composables
│   │   ├── useAgentChat.ts           # Agent session management
│   │   ├── useAIStream.ts            # AI streaming integration
│   │   ├── useFileHandler.ts         # File processing
│   │   └── useWorkflow.ts            # Workflow orchestration
│   └── types/
│       └── workflow.ts               # TypeScript types
├── server/                           # Server-side code
│   ├── api/                          # API endpoints
│   │   ├── ai/stream.post.ts         # AI streaming endpoint
│   │   ├── validate/html.post.ts     # HTML validation
│   │   └── upload/file.post.ts       # File upload handler
│   ├── types/agents.ts               # Server types
│   ├── utils/
│   │   ├── aiProvider.ts             # Z.ai API integration
│   │   ├── htmlValidator.ts          # HTML syntax checker
│   │   └── prompts.ts                # Agent system prompts
│   └── integrations/confluence/      # Future: Confluence integration
└── nuxt.config.ts                    # Nuxt configuration
```

---

## Core Features

### 1. Multi-Agent System

**Three Specialized Agents:**

#### BA (Business Analyst)
- **Role**: Review requirements, ask clarifying questions
- **Context**: User story document
- **Output**: Requirements summary in markdown (ใช้แท็ก `<!SUMMARY!>`)
- **Questions**: ถามคำถามด้วยแท็ก `<!Q!>...<!/Q!>`
- **Session**: Separate chat history
- **Prompt**: [server/utils/prompts.ts](file:///root/git/conflu2UI/server/utils/prompts.ts#L4-L51)
- **สำคัญ**: BA ไม่สามารถ handoff เองได้ - ต้องรอ user ยืนยันบทสรุป

#### SA (System Analyst)
- **Role**: Design architecture, create HTML prototype
- **Context**: BA's requirements summary
- **Output**: Spec document + single HTML file
- **Session**: Separate chat history
- **Prompt**: [server/utils/prompts.ts](file:///root/git/conflu2UI/server/utils/prompts.ts#L37-L70)
- **Special**: HTML code blocks automatically collapsed in UI

#### DEV (Developer)
- **Role**: Refine and improve prototype
- **Context**: SA's spec and HTML
- **Output**: Refined HTML with fixes
- **Session**: Separate chat history
- **Prompt**: [server/utils/prompts.ts](file:///root/git/conflu2UI/server/utils/prompts.ts#L72-L105)
- **Special**: HTML code blocks automatically collapsed in UI

### 2. Workflow Steps

**Workflow Steps:**

1. **upload-story**: Upload user story (markdown/txt)
2. **upload-images**: Optional reference images
3. **ba-conversation**: BA reviews and asks questions
   - BA ถามคำถามด้วย `<!Q!>` tags
   - User ตอบคำถามหรือกดขอให้ BA สรุป
   - BA สร้างบทสรุปด้วย `<!SUMMARY!>` tag
   - **User ตรวจสอบและเลือก:**
     - ✅ ยืนยัน → ส่งต่อให้ SA
     - ✏️ แก้ไข → BA รับ feedback และถามคำถามเพิ่ม/สร้างบทสรุปใหม่
4. **sa-design**: SA designs UI/UX specification
5. **dev-implementation**: DEV creates Vue SFC prototype
6. **preview**: Vue REPL preview with live editing
7. **iteration**: User requests changes

**State Management:**
- Current step: `currentStep` ref in `app.vue`
- BA Summary: `baSummary` computed ดึงจาก `<!SUMMARY!>` tag
- BA Questions: `baQuestions` computed ดึงจาก `<!Q!>` tags
- Context passing: Markdown documents between agents

### 3. AI Streaming

**How it Works:**

1. Client calls `sendMessage()` from `useAIStream`
2. Request sent to `/api/ai/stream` with:
   - `role`: 'ba' | 'sa' | 'dev'
   - `messages`: Conversation history
   - `contextDocument`: Handoff document
   - `model`: 'GLM-4.6'
3. Server merges system prompt + context
4. Streams response from Z.ai API
5. Client parses SSE and updates UI in real-time

**Key Files:**
- Client: [app/composables/useAIStream.ts](file:///root/git/conflu2UI/app/composables/useAIStream.ts)
- Server: [server/api/ai/stream.post.ts](file:///root/git/conflu2UI/server/api/ai/stream.post.ts)
- Provider: [server/utils/aiProvider.ts](file:///root/git/conflu2UI/server/utils/aiProvider.ts)

### 4. HTML Validation

**Non-AI Validation using htmlparser2:**

Checks for:
- `<!DOCTYPE html>` declaration
- Required tags: `<html>`, `<head>`, `<body>`
- Tailwind CSS CDN presence
- Unclosed tags

**Validation Loop:**
```
DEV Agent generates HTML
         ↓
    Validate
         ↓
    Errors? → Send back to DEV → Fix → Validate again
         ↓
    Success → Preview
```

**Implementation:** [server/utils/htmlValidator.ts](file:///root/git/conflu2UI/server/utils/htmlValidator.ts)

### 5. UI/UX Enhancements

#### WorkflowProgress Component
- **Purpose**: Show all 9 steps with visual indicators
- **States**: Active (glowing) | Completed (checkmark) | Upcoming (dimmed)
- **File**: [app/components/WorkflowProgress.vue](file:///root/git/conflu2UI/app/components/WorkflowProgress.vue)

#### CodeBlock Component
- **Purpose**: Clean, collapsible code viewer
- **Features**: 
  - Shows last 10 lines by default
  - "Show Full Code" button to expand
  - Copy to clipboard
  - Line count badge
- **Usage**: Automatically used for SA/DEV HTML outputs
- **File**: [app/components/CodeBlock.vue](file:///root/git/conflu2UI/app/components/CodeBlock.vue)

#### MessageStream Component
- **Purpose**: Display chat messages with markdown
- **Features**:
  - Full markdown rendering via markdown-it
  - Code block extraction
  - Agent-specific rendering (BA vs SA/DEV)
  - Thinking indicators
- **File**: [app/components/MessageStream.vue](file:///root/git/conflu2UI/app/components/MessageStream.vue)

---

## Code Structure

### Design Patterns

#### 1. Composables Pattern
All state and logic encapsulated in composables:
- `useAgentChat`: Manage agent sessions
- `useAIStream`: Handle AI streaming
- `useWorkflow`: Orchestrate workflow
- `useFileHandler`: File operations

#### 2. Agent Isolation
Each agent (BA, SA, DEV) has:
- Separate message history
- Own context document
- Independent status
- No shared conversation state

#### 3. Context Passing
Agents communicate via markdown documents:
```typescript
BA Summary (markdown) → SA Agent
SA Spec + HTML (markdown) → DEV Agent
```

#### 4. Reactive State
- `useState` for global state
- `ref` for component-local state
- `computed` for derived values

---

## Components Reference

### WorkflowProgress.vue

**Props:**
```typescript
{
  currentStep: WorkflowStep  // Current workflow step
}
```

**Purpose**: Visual timeline showing all 9 workflow steps

**States:**
- `active`: Current step (pulsing glow animation)
- `completed`: Past steps (green checkmark)
- `upcoming`: Future steps (dimmed)

**Usage:**
```vue
<WorkflowProgress :current-step="currentStep" />
```

---

### CodeBlock.vue

**Props:**
```typescript
{
  code: string,           // Code content
  language?: string,      // 'html', 'js', 'css', etc.
  title?: string,         // Block title
  icon?: string           // Emoji icon
}
```

**Purpose**: Collapsible code viewer with preview

**Features:**
- Shows last 10 lines by default
- Toggle to show full code
- Copy button
- Line count indicator

**Logic:**
```typescript
const displayCode = computed(() => {
  if (isExpanded || totalLines <= 10) {
    return fullCode;
  }
  return lastTenLines;
});
```

**Usage:**
```vue
<CodeBlock 
  :code="htmlCode"
  language="html"
  title="Generated Prototype"
  icon="📄"
/>
```

---

### MessageStream.vue

**Props:**
```typescript
{
  messages: Message[],
  isStreaming?: boolean,
  agentRole?: 'ba' | 'sa' | 'dev'
}
```

**Purpose**: Display chat messages with markdown rendering

**Key Logic:**
```typescript
// Extract code blocks for SA/DEV agents
if (agentRole === 'sa' || agentRole === 'dev') {
  const htmlBlocks = extractCodeBlocks(content);
  // Render in CodeBlock component
}
```

**Usage:**
```vue
<MessageStream 
  :messages="sessions.ba.messages"
  :is-streaming="isStreaming && currentAgent === 'ba'"
  agent-role="ba"
/>
```

---

### FileUpload.vue

**Props:**
```typescript
{
  title: string,
  description: string,
  accept: string,          // '.md,.txt' or 'image/*'
  acceptLabel: string,
  multiple?: boolean,
  optional?: boolean
}
```

**Events:**
```typescript
@upload: (files: File[]) => void
@skip: () => void           // If optional
```

**Usage:**
```vue
<FileUpload
  title="Upload User Story"
  description="Markdown or text file"
  accept=".md,.txt"
  accept-label="Markdown (.md) or Text (.txt) files"
  :multiple="false"
  @upload="handleStoryUpload"
/>
```

---

### PreviewContainer.vue

**Props:**
```typescript
{
  htmlContent: string     // HTML to render
}
```

**Purpose**: Display HTML in mobile (375px) and desktop (1200px) iframes

**Security**: Uses sandboxed iframe with `srcdoc`

---

## Composables Reference

### useAgentChat

**Purpose**: Manage separate chat sessions for each agent

**State:**
```typescript
{
  sessions: {
    ba: AgentSession,
    sa: AgentSession,
    dev: AgentSession
  },
  currentAgent: AgentRole | null
}
```

**Methods:**
```typescript
addMessage(role: AgentRole, message: Message): void
getSession(role: AgentRole): AgentSession
setAgentStatus(role: AgentRole, status: string): void
activateAgent(role: AgentRole): void
```

**File:** [app/composables/useAgentChat.ts](file:///root/git/conflu2UI/app/composables/useAgentChat.ts)

---

### useAIStream

**Purpose**: Handle real-time AI streaming

**Methods:**
```typescript
sendMessage(
  role: AgentRole, 
  message: string, 
  contextDocument?: string
): Promise<string>
```

**Implementation:**
1. Add user message to session
2. Create empty assistant message placeholder
3. Call `/api/ai/stream` with filtered messages
4. Parse SSE stream
5. Update assistant message in real-time
6. Return full response

**Key Logic:**
```typescript
// Filter messages: exclude empty assistant placeholder
const conversationHistory = session.messages
  .slice(0, -1)  // Remove last (empty placeholder)
  .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content);
```

**File:** [app/composables/useAIStream.ts](file:///root/git/conflu2UI/app/composables/useAIStream.ts)

---

### useWorkflow

**Purpose**: Orchestrate the 9-step workflow

**State:**
```typescript
{
  currentStep: WorkflowStep,
  context: WorkflowContext {
    userStory: string,
    referenceImages: string[],
    baDocument: string,
    saDocument: string,
    htmlPrototype: string,
    validationErrors: ValidationError[]
  }
}
```

**Methods:**
```typescript
uploadUserStory(content: string): void
uploadImages(images: string[]): void
handoffToSA(): void
handoffToDev(): void
validatePrototype(html: string): Promise<boolean>
setStep(step: WorkflowStep): void
updateContext(updates: Partial<WorkflowContext>): void
```

**File:** [app/composables/useWorkflow.ts](file:///root/git/conflu2UI/app/composables/useWorkflow.ts)

---

### useFileHandler

**Purpose**: File upload and processing utilities

**Methods:**
```typescript
readFileAsText(file: File): Promise<string>
readFileAsBase64(file: File): Promise<string>
uploadFile(file: File): Promise<UploadResponse>
```

**File:** [app/composables/useFileHandler.ts](file:///root/git/conflu2UI/app/composables/useFileHandler.ts)

---

## Server API

### POST /api/ai/stream

**Purpose**: Stream AI responses from Z.ai API

**Request Body:**
```typescript
{
  role: 'ba' | 'sa' | 'dev',
  messages: AIMessage[],        // User/assistant messages only
  contextDocument?: string,     // Handoff document
  model?: string                // Default: 'GLM-4.6'
}
```

**Response**: Server-Sent Events (SSE)

**Flow:**
1. Get system prompt for agent role
2. Merge context into system prompt (only 1 system message allowed)
3. Build full messages array: `[system, ...conversation]`
4. Stream from Z.ai API
5. Parse SSE chunks
6. Forward to client

**Key Implementation:**
```typescript
// Merge context into single system message
let fullSystemPrompt = systemPrompt;
if (contextDocument) {
  const contextMsg = createContextMessage(role, contextDocument);
  if (contextMsg) {
    fullSystemPrompt = `${systemPrompt}\n\n${contextMsg}`;
  }
}

const fullMessages = [
  { role: 'system', content: fullSystemPrompt },
  ...messages  // Only user/assistant roles
];
```

**File:** [server/api/ai/stream.post.ts](file:///root/git/conflu2UI/server/api/ai/stream.post.ts)

---

### POST /api/validate/html

**Purpose**: Validate HTML syntax and structure

**Request Body:**
```typescript
{
  html: string
}
```

**Response:**
```typescript
{
  isValid: boolean,
  errors: ValidationError[]
}
```

**File:** [server/api/validate/html.post.ts](file:///root/git/conflu2UI/server/api/validate/html.post.ts)

---

### POST /api/upload/file

**Purpose**: Handle file uploads (text and images)

**Request**: Multipart form data

**Response:**
```typescript
{
  content: string,      // For text files
  base64?: string,      // For images
  filename: string,
  type: string
}
```

**File:** [server/api/upload/file.post.ts](file:///root/git/conflu2UI/server/api/upload/file.post.ts)

---

## Workflow Implementation

### Step 1-2: File Upload

**Location:** `app.vue` lines 18-42

```typescript
async function handleUserStoryUpload(files: File[]) {
  const content = await readFileAsText(files[0]);
  await uploadUserStory(content);
  setStep('upload-images');
}

async function handleImagesUpload(files: File[]) {
  const imagePromises = files.map(file => readFileAsBase64(file));
  const images = await Promise.all(imagePromises);
  await uploadImages(images);
  startBAConversation();
}
```

---

### Step 3: BA Conversation (with User Confirmation Flow)

**Location:** `app.vue`

**Flow Overview:**
```
BA ถามคำถาม (<!Q!>) → User ตอบ → BA อาจถามเพิ่ม หรือ สรุป (<!SUMMARY!>)
                                              ↓
                     User ตรวจสอบบทสรุป ─────────────────┐
                              │                          │
                          ยืนยัน ✅                 ต้องการแก้ไข ✏️
                              ↓                          │
                         SA Design  ←───── BA loop กลับ ─┘
```

**Key Functions:**

```typescript
// User requests BA summary (bypass questions)
async function handleRequestBASummary(partialAnswers: string) {
  const summaryRequest = partialAnswers
    ? `${partialAnswers}\n\n---\nกรุณาสรุป Requirements โดยใช้แท็ก <!SUMMARY!>`
    : 'กรุณาสรุป Requirements โดยใช้แท็ก <!SUMMARY!>';
  await sendMessage('ba', summaryRequest);
}

// User confirms summary → proceed to SA
async function handleBAConfirmAndProceed() {
  await handoffToSA();
}

// User wants to edit → BA loops back
async function handleBAEditRequest(feedback: string) {
  const editMessage = `ผู้ใช้ต้องการแก้ไข:\n${feedback}\n\nกรุณาถามคำถามเพิ่ม (<!Q!>) หรือสร้างบทสรุปใหม่ (<!SUMMARY!>)`;
  await sendMessage('ba', editMessage);
}
```

**Key Computed Properties:**

```typescript
// Detect BA summary from <!SUMMARY!> tag
const baSummary = computed(() => {
  const lastMsg = sessions.ba.messages.reverse().find(m => m.role === 'assistant');
  if (lastMsg?.content?.includes('<!SUMMARY!>')) {
    return lastMsg.content.substring(lastMsg.content.indexOf('<!SUMMARY!>'));
  }
  return '';
});

// Detect BA questions from <!Q!> tags (only if no summary)
const baQuestions = computed(() => {
  if (baSummary.value) return []; // Summary takes priority
  // ... extract <!Q!>...<!Q!> tags
});
```

**UI Components:**
- `BASummaryConfirmation.vue`: แสดงบทสรุปและปุ่มยืนยัน/แก้ไข
- `BAQuestionForm.vue`: แสดงคำถามจาก BA ให้ user ตอบ

---

### Step 4: SA Design

**Location:** `app.vue`

```typescript
async function handoffToSA() {
  // Get BA's summary (with <!SUMMARY!> tag cleaned)
  const baSummaryContent = sessions.ba.messages[messages.length - 1]?.content || '';
  const cleanedSummary = baSummaryContent.replace(/<!SUMMARY!>/g, '').trim();

  updateContext({ baDocument: cleanedSummary });
  setAgentStatus('ba', 'complete');

  setStep('sa-design');
  activateAgent('sa');

  // SA creates UI/UX specification (no code)
  const saResponse = await sendMessage('sa',
    `นี่คือเอกสารสรุป Requirements ที่ผู้ใช้ยืนยันแล้ว:\n\n${cleanedSummary}`);

  updateContext({ saDocument: saResponse });
  proceedToDev(saResponse);
}
```

---

### Step 5: DEV Implementation

**Location:** `app.vue`

```typescript
async function proceedToDev(saDocument: string) {
  setStep('dev-implementation');
  activateAgent('dev');

  // DEV creates Vue SFC prototype
  const devResponse = await sendMessage('dev',
    `จากเอกสาร SA's UI/UX Specification:\n\n${saDocument}`);

  // Extract Vue SFC from response
  const vueMatch = devResponse.match(/```vue\n([\s\S]*?)\n```/);
  if (vueMatch) {
    const code = vueMatch[1];
    updateContext({ htmlPrototype: code });
    setStep('preview'); // Skip validation for Vue SFC
  }
}
```

---

### Step 7: Validation

**Location:** `app.vue` lines 289-337

```typescript
async function runValidation(html: string) {
  setStep('validation');
  isValidating.value = true;
  
  const isValid = await validatePrototype(html);
  
  if (isValid) {
    // Success → Preview
    setTimeout(() => setStep('preview'), 2000);
  } else {
    // Errors → Send back to DEV
    setTimeout(() => fixValidationErrors(), 3000);
  }
}

async function fixValidationErrors() {
  setStep('dev-implementation');
  
  const errorMessage = `The HTML has validation errors:\n${
    context.validationErrors.map(e => `- ${e.message}`).join('\n')
  }\n\nPlease fix these issues.`;
  
  const devResponse = await sendMessage('dev', errorMessage);
  
  // Extract fixed HTML
  const htmlMatch = devResponse.match(/```html\n([\s\S]*?)\n```/);
  if (htmlMatch) {
    const fixedHtml = htmlMatch[1];
    updateContext({ htmlPrototype: fixedHtml });
    
    // Re-validate
    await runValidation(fixedHtml);
  }
}
```

---

### Step 8-9: Preview & Iteration

**Location:** `app.vue` lines 125-145

```typescript
// Preview shows in PreviewContainer
<PreviewContainer :html-content="context.htmlPrototype" />

// User can request changes
async function handleDevIteration(message: string) {
  setStep('dev-implementation');
  
  const devResponse = await sendMessage('dev', message);
  
  // Extract updated HTML
  const htmlMatch = devResponse.match(/```html\n([\s\S]*?)\n```/);
  if (htmlMatch) {
    const updatedHtml = htmlMatch[1];
    updateContext({ htmlPrototype: updatedHtml });
    
    // Re-validate and return to preview
    const isValid = await validatePrototype(updatedHtml);
    if (isValid) {
      setStep('preview');
    }
  }
}
```

---

## Adding New Features

### Adding a New Agent Role

1. **Update Types:**
```typescript
// app/types/workflow.ts
export type AgentRole = 'ba' | 'sa' | 'dev' | 'qa';  // Add 'qa'
```

2. **Add System Prompt:**
```typescript
// server/utils/prompts.ts
export function getSystemPrompt(role: AgentRole): string {
  const prompts = {
    ba: BA_SYSTEM_PROMPT,
    sa: SA_SYSTEM_PROMPT,
    dev: DEV_SYSTEM_PROMPT,
    qa: QA_SYSTEM_PROMPT,  // NEW
  };
  return prompts[role];
}
```

3. **Add to useAgentChat:**
```typescript
// app/composables/useAgentChat.ts
const sessions = useState('agent-sessions', () => ({
  ba: createEmptySession(),
  sa: createEmptySession(),
  dev: createEmptySession(),
  qa: createEmptySession(),  // NEW
}));
```

4. **Add UI Step:**
```typescript
// app/app.vue
<div v-else-if="currentStep === 'qa-testing'" class="step-container">
  <MessageStream 
    :messages="sessions.qa.messages"
    agent-role="qa"
  />
</div>
```

---

### Adding a New Workflow Step

1. **Update Type:**
```typescript
// app/types/workflow.ts
export type WorkflowStep = 
  | 'upload-story'
  | ...
  | 'qa-testing'  // NEW
  | 'preview';
```

2. **Add to WorkflowProgress:**
```typescript
// app/components/WorkflowProgress.vue
const workflowSteps = [
  ...
  { id: 'qa-testing', title: '🧪 QA Test', description: 'Quality assurance' },
  ...
];
```

3. **Implement in app.vue:**
```vue
<div v-else-if="currentStep === 'qa-testing'" class="step-container">
  <!-- Step UI -->
</div>
```

---

### Adding a New Validation Rule

1. **Update htmlValidator.ts:**
```typescript
// server/utils/htmlValidator.ts
export function validateHTML(html: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  // NEW: Check for meta viewport
  if (!html.includes('<meta name="viewport"')) {
    errors.push({
      type: 'missing_viewport',
      message: 'Missing viewport meta tag for responsive design',
      suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

---

## Common Tasks

### Debugging AI Responses

**Enable Debug Logging:**
```typescript
// server/api/ai/stream.post.ts
console.log('[AI API] Sending payload:', {
  model,
  messageCount: fullMessages.length,
  messages: fullMessages,
});
```

Check terminal for full payload sent to Z.ai API.

---

### Changing AI Model

**Update in useAIStream:**
```typescript
// app/composables/useAIStream.ts
body: JSON.stringify({
  role,
  messages: conversationHistory,
  contextDocument: contextDocument || session.context,
  model: 'GLM-4.6',  // Change here
}),
```

**Or update default in aiProvider:**
```typescript
// server/utils/aiProvider.ts
export async function* streamOpenAI(
  messages: AIMessage[],
  model: string = 'GLM-4.6',  // Change default
  temperature: number = 0.7
)
```

---

### Customizing Agent Prompts

**Edit prompts.ts:**
```typescript
// server/utils/prompts.ts
const BA_SYSTEM_PROMPT = `
You are a Business Analyst...

NEW INSTRUCTION: Always ask about accessibility requirements.
`;
```

Agents will use new prompt immediately (no rebuild needed in dev mode).

---

### Adding New File Types

**Update FileUpload accept:**
```vue
<FileUpload
  accept=".md,.txt,.pdf"  // Add .pdf
  accept-label="Markdown, Text, or PDF files"
  @upload="handleUpload"
/>
```

**Handle in useFileHandler:**
```typescript
// app/composables/useFileHandler.ts
async function readFileAsText(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    // Add PDF parsing logic
    return await parsePDF(file);
  }
  
  return await file.text();
}
```

---

### Troubleshooting

#### Issue: Components not auto-importing

**Solution**: Ensure components are in `app/components/` (flat structure, no subdirectories for Nuxt v4)

#### Issue: Z.ai API returns 400 error

**Common causes:**
1. Double system role (fixed)
2. Empty messages array
3. Model not set

**Check debug logs:**
```typescript
// Look in terminal for:
[AI API] Sending payload: { ... }
```

#### Issue: HTML code not collapsing

**Check**:
1. `agentRole` prop passed to MessageStream:
```vue
<MessageStream agent-role="sa" ... />
```

2. CodeBlock imported in MessageStream:
```typescript
import CodeBlock from './CodeBlock.vue';
```

#### Issue: Validation loop infinite

**Check htmlValidator.ts** - ensure it's not too strict:
```typescript
// Add debugging
console.log('Validation errors:', errors);
```

---

## Future Enhancements

### Planned Features

1. **Confluence Integration**
   - Files already scaffolded: `server/integrations/confluence/`
   - Need to implement: API client, HTML→Markdown converter
   
2. **Multi-Provider Support**
   - Architecture supports: Extend `aiProvider.ts`
   - Add functions: `streamClaude()`, `streamGemini()`

3. **Session Persistence**
   - Currently: In-memory only
   - Add: localStorage or database integration

4. **Export Prototypes**
   - Download HTML file
   - Generate project ZIP with assets

---

## Summary

This is a **well-architected multi-agent system** with:
- ✅ Clean separation of concerns
- ✅ Type-safe TypeScript
- ✅ Reactive Vue composables
- ✅ Real-time streaming
- ✅ Comprehensive validation
- ✅ Premium UI/UX
- ✅ Extensible architecture

**For LLM Agents:**
- Read this doc first before making changes
- Check component props before usage
- Follow existing patterns
- Test with full workflow (upload → BA → SA → DEV → preview)

**Key Files to Read:**
1. This file (DEVELOPER_GUIDE.md)
2. [app.vue](file:///root/git/conflu2UI/app/app.vue) - Main orchestration
3. [server/api/ai/stream.post.ts](file:///root/git/conflu2UI/server/api/ai/stream.post.ts) - AI integration
4. [app/composables/](file:///root/git/conflu2UI/app/composables/) - All composables

Happy coding! 🚀
