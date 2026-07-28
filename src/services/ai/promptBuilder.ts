import { AIGenerationRequest } from '@/lib/types';

export function buildPrompt(request: AIGenerationRequest): string {
  const { input, inputType, templateId, aspectRatio, font, language, audience } = request;

  const systemPrompt = `You are a senior infographic content strategist.
Your output is consumed by a strict JSON parser and then rendered in responsive templates.

NON-NEGOTIABLE RULES:
- Return ONLY valid JSON. No markdown, no code fences, no commentary.
- Never generate HTML, CSS, SVG, XML, or any markup.
- Keep the source language unless the user explicitly asks for another language.
- Correct grammar/spelling and remove repetition while preserving meaning.
- Do not invent exact statistics, dates, or claims not present in the input. If uncertain, keep wording qualitative.

CONTENT QUALITY RULES:
- Make the title specific and high-impact (max 90 chars).
- Make subtitle concise and contextual (max 160 chars).
- Build clear, scannable sections for mobile reading:
  - 3 to 6 sections
  - each section content max 220 chars
  - each bullet max 90 chars
  - 2 to 5 bullets per section when useful
- Include 2 to 6 statistics only when data is available.
- Include timeline only when there is chronological/process information.
- Include a short action-oriented callToAction (max 70 chars).

DATA SHAPE RULES:
- Use stable kebab-case ids (e.g., "section-market-trend-1", "stat-conversion-rate").
- colors must contain 3 to 5 valid hex codes.
- icons should contain 3 to 8 relevant emoji strings.
- Allowed section.type values: "text", "bullets", "mixed".
- Ensure every required field is present, even when arrays are empty.

OUTPUT SCHEMA:
{
  "title": "string",
  "subtitle": "string",
  "sections": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "bullets": ["string"],
      "type": "text|bullets|mixed"
    }
  ],
  "statistics": [
    {
      "id": "string",
      "value": "string",
      "label": "string",
      "prefix": "string",
      "suffix": "string"
    }
  ],
  "timeline": [
    {
      "id": "string",
      "date": "string",
      "title": "string",
      "description": "string"
    }
  ],
  "colors": ["#hex1", "#hex2", "#hex3"],
  "icons": ["🎯", "📊", "💡"],
  "callToAction": "string",
  "metadata": {
    "language": "string"
  }
}`;

  let userPrompt = '';

  switch (inputType) {
    case 'text':
      userPrompt = `Analyze and transform the following content into an infographic structure:\n\n${input}`;
      break;
    case 'idea':
      userPrompt = `Create comprehensive infographic content based on this idea:\n\n${input}\n\nGenerate well-researched, factual content that explains this topic effectively.`;
      break;
    case 'image':
      userPrompt = `Analyze this image and create infographic content based on what you see. Describe the visual elements, colors, subjects, and any text you can read. Then structure this into infographic content.\n\nImage data included.`;
      break;
    case 'image-url':
      userPrompt = `Analyze the image at this URL and create infographic content based on what you see:\n\n${input}\n\nDescribe the visual elements, colors, subjects, and any text. Structure into infographic content.`;
      break;
    default:
      userPrompt = `Create infographic content based on:\n\n${input}`;
  }

  // Add context parameters
  const context: string[] = [];

  if (templateId) context.push(`Template: ${templateId}`);
  if (aspectRatio) context.push(`Aspect Ratio: ${aspectRatio}`);
  if (font) context.push(`Font: ${font}`);
  if (language) context.push(`Language: ${language}`);
  if (audience) context.push(`Target Audience: ${audience}`);

  if (context.length > 0) {
    userPrompt += `\n\nContext:\n${context.join('\n')}`;
  }

  return `${systemPrompt}\n\n${userPrompt}\n\nRespond with ONLY valid JSON, no other text.`;
}

export function buildImageAnalysisPrompt(imageData: string): string {
  return `Analyze this image and extract the following information in JSON format:
1. OCR Text - any text visible in the image
2. Subject - main subject of the image
3. Objects - detectable objects
4. Charts - any charts or graphs visible
5. Colors - dominant colors (hex codes)
6. Style - visual style (modern, vintage, corporate, etc.)
7. Theme - overall theme
8. Layout - composition layout

Respond with ONLY valid JSON:
{
  "ocrText": "string",
  "subject": "string",
  "objects": ["string"],
  "charts": ["string"],
  "colors": ["#hex"],
  "style": "string",
  "theme": "string",
  "layout": "string"
}

Image data: ${imageData.substring(0, 100)}...`;
}