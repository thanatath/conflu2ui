# Conflu2UI

Transform user stories into interactive HTML prototypes using a multi-agent AI system.

## Features

- 🤖 **Multi-Agent System**: BA, SA, and DEV agents work together
- 📝 **User Story Analysis**: Upload markdown/text files with requirements
- 🎨 **Automated Prototype Generation**: Generate interactive HTML prototypes
- 🔄 **Iterative Refinement**: Provide feedback and iterate on designs
- ✅ **Automated Validation**: HTML syntax checking and auto-fixing
- 📱 **Responsive Preview**: View prototypes in mobile and desktop modes
- 🌊 **Real-time Streaming**: See AI thinking and responses in real-time

## Prerequisites

- Node.js 18+ and npm
- Z.ai API access (already configured with provided token)

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   cd conflu2UI
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## How It Works

### The Multi-Agent Workflow

1. **Upload User Story**: Upload your requirements document (markdown or text)
2. **Optional Images**: Provide reference screens or sketches (optional)
3. **BA Agent**: Reviews requirements, asks clarifying questions
4. **SA Agent**: Designs architecture and creates initial HTML prototype
5. **DEV Agent**: Refines implementation and fixes issues
6. **Validation**: Automatic HTML validation with error detection
7. **Preview**: View and test your interactive prototype
8. **Iterate**: Request changes and refinements

### Agent Roles

- **Business Analyst (BA)**: Analyzes requirements, identifies gaps, asks clarifying questions
- **System Analyst (SA)**: Designs system architecture, creates specifications, generates initial prototype
- **Developer (DEV)**: Implements, refines, and fixes the prototype based on feedback

## Project Structure

```
conflu2UI/
├── components/
│   ├── agent/          # Agent UI components (timeline, messages)
│   ├── input/          # File upload, user prompt components
│   ├── preview/        # Preview container for prototypes
│   └── workflow/       # Workflow management components
├── composables/
│   ├── useAgentChat.ts    # Agent session management
│   ├── useAIStream.ts     # AI streaming integration
│   ├── useWorkflow.ts     # Workflow orchestration
│   └── useFileHandler.ts  # File processing utilities
├── server/
│   ├── api/
│   │   ├── ai/           # AI streaming endpoints
│   │   ├── validate/     # HTML validation endpoints
│   │   └── upload/       # File upload endpoints
│   ├── utils/
│   │   ├── aiProvider.ts      # OpenAI integration
│   │   ├── htmlValidator.ts   # HTML syntax checking
│   │   └── prompts.ts         # Agent system prompts
│   └── integrations/
│       └── confluence/   # Future Confluence integration
├── types/              # TypeScript type definitions
└── assets/css/         # Global styles and design system
```

> **Note**: The application is pre-configured with a demo AI provider. You can change the provider by updating the environment variables in `.env`.

## Tech Stack

- **Framework**: Nuxt 4 (Vue 3, TypeScript, SSR)
- **AI Provider**: Configurable (default: Z.ai with GLM-4.6 model)
- **Validation**: htmlparser2 for HTML syntax checking
- **Styling**: Custom CSS with glassmorphism effects
- **Markdown**: markdown-it for rich text rendering

## AI Model Configuration

The application uses an AI model to power the multi-agent workflow. The model is configurable via environment variables:

```bash
AI_PROVIDER_MODEL=GLM-4.6  # Change to any supported model
```

You can also change the AI provider by updating the API URL and token in your `.env` file.

## Configuration

The application uses environment variables for configuration. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Available configuration options:
- `AI_PROVIDER_API_URL`: API endpoint URL
- `AI_PROVIDER_API_TOKEN`: API authentication token
- `AI_PROVIDER_MODEL`: Model to use (e.g., GLM-4.6)

## Future Features

- 🔗 Confluence integration (pull user stories directly from Confluence)
- 💾 Save/Load project sessions
- 📤 Export prototypes
- 🔌 Support for additional AI providers (Claude, Gemini)
- 👥 Multi-user collaboration

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
