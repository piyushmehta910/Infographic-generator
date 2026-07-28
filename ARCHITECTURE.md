# ARCHITECTURE

## High-level components

- **Landing page**: `src/app/page.tsx`
- **Dashboard/editor**: `src/app/dashboard/page.tsx`
- **API routes**:
  - `POST /api/v1/generate` (`src/app/api/v1/generate/route.ts`)
  - `GET /api/v1/templates` (`src/app/api/v1/templates/route.ts`)
- **AI services**:
  - provider implementations + pipeline in `src/services/ai/provider.ts`
  - prompts in `src/services/ai/promptBuilder.ts`
- **Template engine/config**: `src/services/template/templateEngine.ts`
- **State management** (Zustand):
  - `aiStore.ts`
  - `editorStore.ts`
  - `projectStore.ts`
  - `uiStore.ts`

## Data flow (dashboard)

1. User enters input (text/idea/image/image-url).
2. Dashboard builds `AIGenerationRequest`.
3. `generateContent(...)` executes:
   - content analysis
   - design blueprint generation
   - HTML generation
4. Generated HTML is rendered in `AIDesignRenderer` iframe.
5. Export logic creates PNG/JSON output.

## Key design decisions

- Frontend-first UX with client-managed provider credentials
- Provider abstraction (`providerMap`) for OpenAI/Gemini/Claude/OpenRouter/Groq
- Strict typing in `src/lib/types.ts`
- Shared design constants in `src/lib/constants.ts`

## Deployment characteristics

- Next.js standalone output (`next.config.js`)
- Remote image loading enabled via permissive `images.remotePatterns`
