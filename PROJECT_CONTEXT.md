# PROJECT CONTEXT

## What this project is
**InfoGraphic AI** is a Next.js web app that generates professional infographics from:
- raw text
- a simple idea prompt
- uploaded images
- image URLs

The core approach is:
1. AI analyzes and structures content.
2. AI proposes a design blueprint.
3. AI generates final HTML/CSS for the infographic.
4. The app previews and exports the result.

## Product goals
- Fast infographic creation with minimal design effort
- Multi-provider AI support (user-managed API keys)
- High-quality export output for social and presentation use
- Flexible aspect ratios and themes

## Tech stack
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Zustand (state + persistence)
- Framer Motion
- html-to-image / jsPDF for export

## Core runtime flow
- Main UI: `src/app/dashboard/page.tsx`
- AI pipeline: `src/services/ai/provider.ts`
- Prompt construction: `src/services/ai/promptBuilder.ts`
- Template config/helpers: `src/services/template/templateEngine.ts`

## Important project principle
AI should produce structured and styled output safely within app constraints; user keys are handled client-side and not stored on a backend.
