# InfoGraphic AI - AI-Powered Infographic Generator

A production-ready AI-powered infographic generator built with Next.js 15, TypeScript, and Tailwind CSS. Transform text, ideas, and images into beautiful, professional infographics.

## 📱 Download Android App

[![Download APK](https://img.shields.io/badge/Download-APK-green?style=for-the-badge&logo=android&logoColor=white)](https://github.com/piyushmehta910/Infographic-generator/releases/latest)

> **Install on Android**: Download the APK from the [Releases page](https://github.com/piyushmehta910/Infographic-generator/releases/latest), enable "Install from unknown sources" in settings, and tap to install.

## Live Demo

[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://infographic-generator.vercel.app)

## Core Philosophy

> **The AI generates structured content and HTML; sanitization and validation make it safe.**
> Everything runs client-side with your own API key.

## Features

### Input Methods

- **Text**: Paste notes, articles, reports, blog posts, research, scripts
- **Image Upload**: Drag & drop or browse (PNG, JPG, WEBP)
- **URL**: Paste a publicly accessible image URL for AI analysis

### AI Processing

- Grammar correction & spelling fix
- Professional rewriting & summarization
- Language detection
- Title & subtitle generation
- Bullet points, key facts, statistics extraction
- Timeline & process step creation
- CTA generation
- Icon & color palette recommendations
- Image analysis (OCR, subject detection, color extraction)

### Purposes

Pick a purpose (Blog Post, Marketing, Education, Business, Health, etc.) and the AI tailors structure, tone, and visual style accordingly.

### Aspect Ratios

1:1, 4:5, 9:16, 16:9, A4 Portrait, A4 Landscape, Letter, Custom

### Themes

Auto (AI-selected), Light, Dark, Minimal, Corporate, Midnight Blue, Modern, Glassmorphism, Neumorphism, Gradient, Material Design

### AI Providers (Bring Your Own Key)

- OpenAI (GPT-4o, GPT-4o-mini, GPT-4 Turbo)
- Google Gemini (1.5 Pro, 1.5 Flash, 2.0 Flash)
- Anthropic Claude (3.5 Sonnet, 3 Haiku)
- OpenRouter (Multi-model access)
- Groq (Fast inference)

### Export Formats

- PNG (High resolution, 2x pixel ratio)
- JPG (Compressed image)
- SVG (Vector)
- PDF (Print-ready document)
- JSON (Project data)

### Mobile & PWA

- **Fully responsive** - Works on mobile, tablet, and desktop
- **PWA support** - Install as an app on any device
- **Android APK** - Native Android app via TWA

### Generator Features

- Live canvas preview with zoom & aspect-ratio switching
- Multi-attempt HTML generation (validated, scored, best kept)
- Offline mode — the local generator still produces designs when no API key is configured
- API-key configuration via the Settings modal (stored in the browser)

### REST API

- `GET /api/v1/templates` - List available templates
- `GET /api/health` - Health check
- Client-side AI generation with your API key

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + CSS Variables
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Export**: html-to-image, jsPDF
- **AI Integration**: Direct API calls (OpenAI, Gemini, Claude, OpenRouter, Groq)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd infographic-generator

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configuration

1. Open the Generator (`/generate`)
2. Click the Settings (gear) icon in the top bar
3. Select your AI provider
4. Enter your API key
5. Choose a model (and temperature/max tokens)
6. Start generating!

## Project Structure

```
src/
├── app/
│   ├── page.tsx                # Landing page
│   ├── generate/               # Main generator/editor
│   │   └── page.tsx
│   ├── dashboard/              # Redirects to /generate
│   │   └── page.tsx
│   ├── api/
│   │   ├── health/route.ts
│   │   └── v1/templates/route.ts
│   ├── layout.tsx
│   ├── globals.css
│   ├── sitemap.ts
│   └── opengraph-image/
├── components/
│   ├── landing/               # Landing sections (Header, Hero, Features, FAQ, …)
│   ├── generate/              # Generator UI (InputPanel, CanvasView, StylePanel, ProviderSettings)
│   ├── templates/              # AIDesignRenderer (renders generated HTML)
│   └── ui/                     # Shared UI (Button, GlassCard, Modal, Toast)
├── stores/                     # Zustand state management
│   ├── aiStore.ts
│   ├── editorStore.ts
│   └── uiStore.ts
├── services/ai/                # AI provider integrations
│   ├── providers.ts            # 5 provider implementations
│   ├── pipeline.ts             # 3-step generation pipeline
│   ├── fallback.ts             # Model/provider fallback
│   ├── response.ts             # JSON/HTML extraction & sanitization
│   ├── normalize.ts            # Output normalization
│   ├── quality.ts              # HTML validation & scoring
│   ├── localGenerator.ts       # Offline generation fallback
│   ├── promptBuilder.ts        # Prompt construction
│   └── provider.ts             # Public re-export entry
└── lib/                        # Core types & constants
    ├── types.ts
    ├── constants.ts
    ├── purposes.ts
    ├── site.ts
    ├── canvas.ts
    └── templates.ts
```

## Deployment

### Vercel (Recommended)

1. Push to Git repository
2. Import to Vercel
3. Deploy (zero configuration needed)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

The `vercel.json` file is already configured for optimal deployment.

### Android APK Build

The APK is automatically built via GitHub Actions when you create a tag:

```bash
# Create a release tag
git tag v1.0.0
git push origin v1.0.0
```

This triggers the APK build workflow which:
1. Builds the Next.js app
2. Generates a TWA (Trusted Web Activity) project
3. Compiles the Android APK
4. Creates a GitHub Release with the APK download

You can also manually trigger the workflow from the Actions tab.

#### Manual APK Build with PWABuilder

1. Deploy the app to Vercel
2. Go to [PWABuilder](https://www.pwabuilder.com)
3. Enter your deployed URL
4. Click "Build My PWA" → Android
5. Download the generated APK

## API Keys

API keys are stored locally in the browser using localStorage. No keys are sent to any server other than your chosen AI provider. This ensures:

- **Privacy**: Your keys never leave your browser
- **Security**: No server-side storage of credentials
- **Control**: You can revoke keys at any time

## Adding New AI Providers

1. Implement the `AIProvider` interface in `src/services/ai/providers.ts`
2. Add it to `providerMap`
3. Add its model list to `AI_PROVIDERS` in `src/lib/constants.ts`

## Architecture Principles

1. **Client-First** - AI calls happen in the browser with the user's API key
2. **Provider-Agnostic** - Abstract `AIProvider` interface makes adding providers trivial
3. **Guaranteed Output** - The local generator always produces a result if AI fails
4. **Sanitized HTML** - Generated HTML is validated, scored, and sanitized before rendering
5. **Single-Sourced Config** - Branding, canvas math, and templates live in `src/lib/*`

## License

MIT
