# InfoGraphic AI — AI-Powered Infographic Generator

Turn any text into a polished, self-contained infographic in seconds. Paste notes, an article, or just a rough idea — a 4-phase AI pipeline researches, designs, codes, and validates the result, then you export it as PNG, JPG, SVG, PDF, or JSON.

Built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

## How It Works

1. **Content Analysis** — the AI completes, corrects, and structures your input: title, sections, bullets, statistics, timeline.
2. **Design Blueprint** — a full design system is planned: palette (WCAG AA-checked), typography scale, grid, card styles, decorations.
3. **HTML/CSS Generation** — the blueprint is hand-coded into a single self-contained HTML file sized exactly to the canvas, validated and quality-scored across multiple attempts.
4. **Export** — the final design renders in an isolated preview and exports via offscreen capture.

If a phase fails, the pipeline automatically falls back to other models — and then to other providers — before giving up with a clear error.

## Features

### Input
- **Text-only, by design**: paste articles, reports, notes, scripts, or a one-line idea
- Working-memory context from your previous generations is injected into the next prompt (per-project, stored locally)

### AI Providers (Bring Your Own Key)
- **OpenRouter** — hundreds of models incl. free tier
- **NVIDIA NIM** — Llama, Nemotron, DeepSeek, Qwen on NVIDIA's free tier
- **Groq** — fast LPU inference, free tier
- **Mistral** — La Plateforme API
- **Custom** — any OpenAI-compatible `/chat/completions` endpoint (e.g. Ollama, LM Studio, vLLM)

Configure provider, model, temperature, and max tokens in the Settings modal; verify credentials with the built-in Test Connection button.

### Canvas & Export
- 8 aspect ratios: 1:1, 4:5, 9:16, 16:9, A4 portrait/landscape, Letter, custom dimensions
- Live sandboxed preview with zoom
- **PNG / JPG** (2x pixel ratio), **SVG**, **PDF**, and **JSON** export

### Projects Dashboard
- Every generation is saved to IndexedDB in your browser
- Browse, reopen, or delete past projects at `/dashboard`

## Privacy & Security

- **Your API keys never leave your device unencrypted-at-rest** — they live in `localStorage` and are sent only in request bodies to the generation proxy, which forwards them to your chosen provider. Nothing is ever stored server-side.
- All generation runs server-side through `/api/generate` (Node runtime), eliminating browser CORS/ad-blocker failures.
- Generated HTML passes a server-side sanitizer plus client-side sandboxing before rendering.
- Custom base URLs are validated against SSRF (private ranges, link-local, cloud metadata endpoints are blocked).
- Requests are strictly schema-validated (Zod); upstream errors are truncated before reaching the client; failures return proper HTTP status codes (400/401/429/500/502/504).

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + CSS variables |
| State | Zustand |
| Validation | Zod |
| Storage | IndexedDB (`idb`) for projects & working memory |
| Export | html-to-image, jsPDF |
| Animations | Framer Motion |

## Getting Started

```bash
git clone https://github.com/piyushmehta910/Infographic-generator.git
cd Infographic-generator
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), go to **Generate**, click the ⚙️ Settings icon, pick a provider, paste your API key, choose a model, and generate.

> No account or sign-up needed — just your own provider key (free tiers work fine).

## REST API

| Endpoint | Method | Description |
|---|---|---|
| `/api/generate` | POST | Runs the full 4-phase pipeline server-side. Body: `{ request, options }` where `options` carries provider id/key/model, optional stored providers for fallback, and seed memory. Returns HTML + content + per-phase steps, or a typed error with an appropriate HTTP status. |
| `/api/test-provider` | POST | Validates a provider's credentials/base URL without running a generation. SSRF-guarded. |
| `/api/health` | GET | Health check. |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── generate/page.tsx         # Generator (input, canvas, settings, export)
│   ├── dashboard/page.tsx        # Saved projects browser
│   └── api/
│       ├── generate/route.ts     # Server-side pipeline proxy (Zod-validated)
│       ├── test-provider/route.ts# Credential check w/ SSRF guard
│       └── health/route.ts
├── components/
│   ├── landing/                  # Header, Hero, Features, HowItWorks, FAQ, …
│   ├── generate/                 # InputPanel, CanvasView, StylePanel, ProviderSettings
│   ├── templates/AIDesignRenderer.tsx  # Sandboxed iframe renderer for generated HTML
│   └── ui/                       # Button, Toast
├── stores/
│   ├── aiStore.ts                # Providers, keys, model config (persisted)
│   └── uiStore.ts / editorStore.ts
├── services/ai/
│   ├── pipeline.ts               # 4-phase orchestration + memory distillation
│   ├── fallback.ts               # Model-chain & cross-provider fallback
│   ├── providers.ts              # 5 provider implementations (fetch-based)
│   ├── promptBuilder.ts          # Phase prompts (content/blueprint/HTML)
│   ├── memory.ts                 # SessionMemory: distilled working-memory context
│   ├── response.ts               # JSON/HTML extraction + sanitization
│   ├── normalize.ts              # Content normalization
│   └── quality.ts                # HTML validation & scoring gates
└── lib/
    ├── types.ts                  # Core type definitions
    ├── schemas.ts                # Zod output schemas
    ├── canvas.ts                 # Aspect-ratio math
    ├── constants.ts              # Provider catalogs & defaults
    ├── export/capture.ts         # Offscreen render for pixel-perfect exports
    ├── storage/memoryDb.ts       # IndexedDB working-memory store
    └── editor/persistence.ts     # IndexedDB project store
```

## Deployment

Any Node host works — Vercel is zero-config:

```bash
npm i -g vercel
vercel --prod
```

Or self-host the standalone build:

```bash
npm run build
npm start   # or run .next/standalone/server.js
```

## Adding a New AI Provider

1. Implement the `AIProvider` interface in `src/services/ai/providers.ts`
2. Register it in `providerMap`
3. Add its catalog entry to `AI_PROVIDERS` in `src/lib/constants.ts`

## License

MIT
