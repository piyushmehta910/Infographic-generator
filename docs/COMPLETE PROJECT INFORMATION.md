# COMPLETE PROJECT INFORMATION

## Project summary

InfoGraphic AI is an AI-powered infographic generator built with Next.js and TypeScript.  
It converts text, ideas, and image-based input into polished infographic output.

## Key capabilities

- Multi-input generation (text, idea, upload, URL)
- AI content analysis and improvement
- AI-driven design blueprint + HTML generation
- Multiple visual themes and purposes
- Export support (PNG/JPG/SVG/PDF/JSON in the generate flow)

## Technical foundation

- Frontend: Next.js 15 + React 19 + Tailwind CSS
- State: Zustand stores for AI/editor/project/UI
- AI providers: OpenRouter, NVIDIA NIM, Groq, Mistral
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
