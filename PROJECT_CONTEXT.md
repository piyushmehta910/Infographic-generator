# PROJECT CONTEXT

## What this project is

**InfoGraphic AI** is a Next.js web app that generates professional infographics from:

- raw text (articles, notes, reports)
- a simple idea or topic prompt

The core approach is a 4-phase AI pipeline:

1. AI analyzes, corrects, and structures content into rich sections and stats.
2. AI proposes a comprehensive design blueprint (palette, typography, layout).
3. AI generates final, self-contained HTML/CSS for the infographic.
4. The app previews with responsive zoom and exports the result (PNG, JPG, SVG, PDF, JSON).

## Product goals

- Fast infographic creation with minimal design effort
- Multi-provider AI support (user-managed API keys: OpenRouter, Groq, NVIDIA NIM, Mistral, Custom)
- High-quality export output for social, web, and presentation use
- Flexible aspect ratios (1:1, 4:5, 9:16, 16:9, A4, Letter, Custom)

## Tech stack

- Next.js 15 (App Router) & React 19
- TypeScript (strict mode)
- Tailwind CSS
- Zustand (persisted stores for AI settings & editor state)
- IndexedDB (`idb`) for local project and working-memory persistence
- Framer Motion
- html-to-image / jsPDF for high-res export

## Core runtime flow

- Main UI & Generator: `src/app/generate/page.tsx`
- Dashboard: `src/app/dashboard/page.tsx`
- Server-side AI pipeline: `src/app/api/generate/route.ts` & `src/services/ai/pipeline.ts`
- Prompt construction: `src/services/ai/promptBuilder.ts`
- Providers: `src/services/ai/providers.ts` & `src/services/ai/fallback.ts`

## Important project principle

AI should produce structured, safe, and beautiful output within app constraints; user keys are handled client-side in localStorage and never persisted on a server.
