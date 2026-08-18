# ARCHITECTURE

## High-level components

- **Landing page**: `src/app/page.tsx` composing sections in `src/components/landing/` (Header, Hero, Stats, Features, HowItWorks, Providers, UseCases, FAQ, CTA, Footer)
- **Generator/editor**: `src/app/generate/page.tsx`
- **Dashboard redirect**: `src/app/dashboard/page.tsx` (redirects to `/generate`)
- **API routes**:
  - `GET /api/v1/templates` (`src/app/api/v1/templates/route.ts`)
  - `GET /api/health` (`src/app/api/health/route.ts`)
- **AI services** (`src/services/ai/`):
  - `providers.ts` — the 3 provider implementations (`providerMap`, `SYSTEM_PROMPT`)
  - `pipeline.ts` — 4-phase `generateContent(...)` orchestration (content → design → HTML → export)
  - `fallback.ts` — model/provider fallback + `tryAllProviders` across stored keys
  - `response.ts` — JSON/HTML extraction + sanitization
  - `normalize.ts` — AI output normalization into `InfographicContent`
  - `quality.ts` — HTML validation + scoring (keeps the best of N attempts)
  - `promptBuilder.ts` — prompt construction
  - `provider.ts` — slim public re-export entry (keep import path stable)
- **Template config**: `src/lib/templates.ts` (`BUILT_IN_TEMPLATES`)
- **Template renderer**: `src/components/templates/AIDesignRenderer.tsx`
- **Shared UI**: `src/components/ui/` (Button, GlassCard, Modal, Toast)
- **State management** (Zustand):
  - `aiStore.ts` — provider configs + active provider
  - `editorStore.ts` — current content + generating flag
  - `uiStore.ts` — toasts
- **Single-source lib modules** (`src/lib/`):
  - `types.ts`, `constants.ts`, `purposes.ts`, `site.ts` (branding/URL), `canvas.ts` (aspect-ratio math), `templates.ts`

## Data flow (generate)

1. User enters input (text/idea/image/image-url) in the left panel.
2. Generate page builds an `AIGenerationRequest` and calls `generateContent(request, options)` where `options` carries the active provider, API key, model, temperature, maxTokens, and any other stored provider keys.
3. `generateContent(...)` runs the 4-phase pipeline:
   - content analysis & structuring (with Zod re-validation retry)
   - design architecture & planning (blueprint)
   - HTML generation (validated, scored, best-of-N kept, sanitized)
   - export & delivery
4. If any phase fails or no API key is configured, an actionable error is returned with the phases that ran and elapsed time — no offline fallback output is fabricated.
5. Generated HTML is rendered in `AIDesignRenderer` in the canvas; export logic produces PNG/JPG/SVG/PDF/JSON.

## Key design decisions

- Frontend-first UX with client-managed provider credentials (keys never leave the browser)
- Provider abstraction (`providerMap: Record<AIProviderId, AIProvider>`) for OpenRouter/NVIDIA NIM/Groq (free models only)
- Strict typing in `src/lib/types.ts`; shared config single-sourced in `src/lib/*`
- AI returns structured JSON + HTML; sanitization strips scripts/event handlers before rendering
- No offline generator: generation always requires a working AI provider, and failures surface as real errors instead of fabricating a design

## Deployment characteristics

- Next.js standalone output (`next.config.js`)
- Remote image loading enabled via permissive `images.remotePatterns`
- Canonical URL single-sourced in `src/lib/site.ts` (`APP_URL`)