# ARCHITECTURE

## High-level components

- **Landing page**: `src/app/page.tsx` composing sections in `src/components/landing/` (Header, Hero, Stats, Features, HowItWorks, Providers, UseCases, FAQ, CTA, Footer)
- **Generator/editor**: `src/app/generate/page.tsx` (InputPanel, CanvasView, ProviderSettings, Toast)
- **Projects Dashboard**: `src/app/dashboard/page.tsx` (lists, loads, and manages locally saved infographic projects)
- **API routes**:
  - `POST /api/generate` (`src/app/api/generate/route.ts`) — Server-side 4-phase AI generation pipeline proxy with SSE streaming
  - `POST /api/test-provider` (`src/app/api/test-provider/route.ts`) — Provider credential & endpoint check with SSRF guards
  - `GET /api/health` (`src/app/api/health/route.ts`) — System health check
- **AI services** (`src/services/ai/`):
  - `providers.ts` — Provider implementations (`providerMap`: OpenRouter, NVIDIA NIM, Groq, Mistral, Custom)
  - `pipeline.ts` — 4-phase `generateContent(...)` orchestration (content → blueprint → HTML → export)
  - `fallback.ts` — Model-chain and cross-provider fallback (`tryAllProviders`)
  - `response.ts` — JSON/HTML extraction, unclosed-fence resilience, and sanitization
  - `normalize.ts` — AI output normalization into `InfographicContent`
  - `quality.ts` — HTML validation + scoring (evaluates and refines up to N attempts)
  - `promptBuilder.ts` — Phase prompts (content/blueprint/HTML)
  - `memory.ts` — Working-memory distillation and context accumulation
  - `progress.ts` — Progress event definitions streamed over SSE
- **Template renderer**: `src/components/templates/AIDesignRenderer.tsx` (isolated sandboxed iframe canvas)
- **Shared UI**: `src/components/ui/` (Button, Toast)
- **State management & persistence**:
  - `src/stores/aiStore.ts` — AI provider configurations, active provider, persisted to localStorage
  - `src/stores/editorStore.ts` — Current content & generation context
  - `src/stores/uiStore.ts` — Global toast notifications
  - `src/lib/editor/persistence.ts` — IndexedDB (`idb`) project storage
  - `src/lib/storage/memoryDb.ts` — IndexedDB working-memory context storage
- **Single-source lib modules** (`src/lib/`):
  - `types.ts` — Core type definitions
  - `constants.ts` — Verified provider models and aspect ratio dimensions
  - `canvas.ts` — Aspect-ratio dimensions and orientation math
  - `schemas.ts` — Zod schemas for AI outline validation
  - `site.ts` — App metadata and branding
  - `export/capture.ts` — Offscreen isolated DOM renderer for PNG/JPG/SVG/PDF/JSON export

## Data flow (generate)

1. User enters text or idea content in `InputPanel`.
2. Generate page builds an `AIGenerationRequest` and initiates a POST request to `/api/generate` with SSE streaming.
3. Server-side `generateContent(...)` executes the 4-phase pipeline:
   - **Phase 1: Content Analysis & Structuring** (with Zod validation and auto-correction)
   - **Phase 2: Design Architecture & Planning** (blueprint specifying palette, typography, grid, card styles)
   - **Phase 3: HTML/CSS Generation** (validated and quality-scored across attempts, sanitized)
   - **Phase 4: Export & Delivery**
4. Real-time progress events stream to the browser via SSE.
5. Generated HTML is rendered in `AIDesignRenderer` inside `CanvasView` with responsive scaling.
6. The completed project is saved to IndexedDB (`saveProject`).
7. User can export the infographic to PNG, JPG, SVG, PDF, or JSON.

## Key design decisions

- **Client-Managed API Keys**: User API keys are stored in `localStorage` and only relayed in generation requests (never stored on any backend database).
- **Server-Side Generation Proxy**: Upstream AI fetches run in the Next.js Node.js runtime, eliminating browser CORS issues and ad-blocker interference.
- **Provider Fallback & Resilience**: Model chains and cross-provider fallbacks automatically recover from transient rate limits and provider outages.
- **No Fabricated Output**: When an AI call fails, an honest actionable error is reported instead of fabricating dummy infographics.
- **Offscreen Isolated Export**: Uses a scoped detached DOM container to rasterize crisp high-DPI graphics without CSS leakage.