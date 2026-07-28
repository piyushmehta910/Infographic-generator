# InfoGraphic AI - AI-Powered Infographic Generator

A production-ready AI-powered infographic generator built with Next.js 15, TypeScript, and Tailwind CSS. Transform text, ideas, and images into beautiful, professional infographics.

## Core Philosophy

> **AI generates structured content, not HTML.**
> HTML/CSS templates generate the final infographic.

## Features

### Input Methods

- **Text**: Paste notes, articles, reports, blog posts, research, scripts
- **Idea**: Describe a concept and AI generates comprehensive content
- **Image Upload**: Drag & drop or browse (PNG, JPG, WEBP)
- **Image URL**: Paste a publicly accessible image URL for AI analysis

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

### Templates (8 Built-in)

- **Modern** - Clean, minimal with geometric accents
- **Business** - Corporate professional design
- **Timeline** - Chronological flow layout
- **Comparison** - Side-by-side comparisons
- **Education** - Learning-focused layouts
- **Medical** - Healthcare information design
- **Technology** - Modern tech-forward aesthetic
- **Startup** - Energetic pitch deck style
- **Marketing** - Social media optimized

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
- SVG (Vector format)
- PDF (Document format)
- HTML (Self-contained)
- JSON (Project data)

### Editor Features

- Live canvas preview
- Text editing (title, subtitle, CTA)
- Font selection (Inter, Poppins, Roboto, Manrope, Nunito, DM Sans)
- Alignment controls (left, center, right, justify)
- Spacing controls (compact, comfortable, spacious)
- Grid overlay & snap-to-grid
- Zoom controls
- Undo/Redo history
- Auto-save to browser storage

### REST API

- `POST /api/v1/generate` - Generate infographic content
- `GET /api/v1/templates` - List available templates
- Client-side AI generation with your API key

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + CSS Variables
- **State Management**: Zustand (with persist middleware)
- **Animations**: Framer Motion
- **Forms**: React Hook Form
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

1. Navigate to the dashboard
2. Click Settings (gear icon)
3. Select your AI provider
4. Enter your API key
5. Choose a model
6. Start generating!

## Project Structure

```
src/
├── app/
│   ├── (marketing)/          # Landing page
│   │   └── page.tsx
│   ├── dashboard/            # Main editor dashboard
│   │   └── page.tsx
│   ├── api/v1/               # REST API endpoints
│   │   ├── generate/route.ts
│   │   └── templates/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── templates/            # Template renderers
│   │   ├── TemplateRenderer.tsx
│   │   ├── ModernTemplate.tsx
│   │   └── BusinessTemplate.tsx
│   └── ui/                   # Shared UI components
├── stores/                   # Zustand state management
│   ├── editorStore.ts
│   ├── templateStore.ts
│   ├── aiStore.ts
│   ├── projectStore.ts
│   └── uiStore.ts
├── services/
│   ├── ai/                   # AI provider integrations
│   │   ├── provider.ts       # 5 provider implementations
│   │   └── promptBuilder.ts
│   └── template/             # Template engine
│       └── templateEngine.ts
├── lib/                      # Core types & constants
│   ├── types.ts
│   └── constants.ts
└── styles/
    └── themes/
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

## API Keys

API keys are stored locally in the browser using localStorage. No keys are sent to any server other than your chosen AI provider. This ensures:

- **Privacy**: Your keys never leave your browser
- **Security**: No server-side storage of credentials
- **Control**: You can revoke keys at any time

## Adding New Templates

1. Create a new component in `src/components/templates/`
2. Add the template config in `src/services/template/templateEngine.ts`
3. Register the component in `TemplateRenderer.tsx`
4. The template automatically appears in the dashboard

## Architecture Principles

1. **AI Never Generates HTML** - AI returns structured JSON only
2. **Template-Driven** - All rendering is done by pre-built React components
3. **Provider-Agnostic** - Abstract AI provider interface makes adding new providers trivial
4. **Client-First** - AI calls happen in the browser with user's API key
5. **Extensible** - New templates, providers, and export formats require minimal changes

## License

MIT
