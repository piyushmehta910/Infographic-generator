# COMPLETE PROJECT INFORMATION

## Project summary

InfoGraphic AI is an AI-powered infographic generator built with Next.js and TypeScript.  
It converts text, ideas, and image-based input into polished infographic output.

## Key capabilities

- Content-driven generation (text, blog posts, articles, reports, ideas)
- 4-phase AI pipeline (Content Structuring -> Design Blueprint -> HTML/CSS Generation -> Export)
- Real-time SSE streaming for live progress feedback
- High-resolution multi-format export (PNG, JPG, SVG, PDF, JSON)
- Local browser project persistence via IndexedDB

## Technical foundation

- Frontend: Next.js 15 (App Router) + React 19 + Tailwind CSS
- State: Zustand persisted stores for AI settings & editor state
- Storage: IndexedDB (`idb`) for local projects and working-memory context
- AI providers: OpenRouter, NVIDIA NIM, Groq, Mistral, Custom
- Type safety: strict TypeScript with central type definitions

## Core folders

- `src/app` - routes/pages and API endpoints
- `src/components` - UI and rendering components
- `src/services` - AI pipeline (providers, fallback, quality, prompts)
- `src/stores` - Zustand state management
- `src/lib` - shared types/constants

## Generation pipeline

1. Receive user input
2. Analyze and improve content with AI
3. Build design blueprint with AI
4. Generate final HTML/CSS design
5. Render preview
6. Export output

## Security and privacy posture

- User API keys are entered and stored on client side.
- Keys are not stored by backend services in this repository.
- Users choose which AI provider receives their content.

## Documentation index

- `../PROJECT_CONTEXT.md`
- `../README.md`
- `../ARCHITECTURE.md`
- `../CODING_RULES.md`
- `../UI_GUIDELINES.md`
- `../SECURITY.md`
- `../TASK.md`
- `../CHANGELOG.md`
