import { AIGenerationRequest } from '@/lib/types';

export function buildPrompt(request: AIGenerationRequest): string {
  const { input, inputType, templateId, aspectRatio, font, language, audience } = request;

  const systemPrompt = `You are an expert infographic content creator. Your role is to analyze input content and return structured JSON for an infographic.

RULES:
- NEVER generate HTML, CSS, or any markup
- ALWAYS return valid JSON only
- Fix grammar, spelling, and improve wording
- Remove repetition
- Summarize effectively
- Detect and preserve the original language
- Generate engaging titles and subtitles
- Create meaningful sections with bullet points
- Extract key statistics and facts
- Create timeline events if chronological information exists
- Create process steps if applicable
- Recommend relevant emoji/icons
- Suggest a cohesive color palette (3-5 hex colors)
- Generate a compelling call-to-action

OUTPUT SCHEMA:
{
  "title": "string - Main headline (max 100 chars)",
  "subtitle": "string - Supporting headline (max 200 chars)",
  "sections": [
    {
      "id": "string - unique id",
      "title": "string - section title",
      "content": "string - main content",
      "bullets": ["string - bullet points"],
      "type": "text|bullets|mixed"
    }
  ],
  "statistics": [
    {
      "id": "string - unique id",
      "value": "string - the number/metric",
      "label": "string - description of the metric",
      "prefix": "string - optional symbol like $",
      "suffix": "string - optional like %"
    }
  ],
  "timeline": [
    {
      "id": "string - unique id",
      "date": "string - date/time period",
      "title": "string - event title",
      "description": "string - event description"
    }
  ],
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "icons": ["🎯", "📊", "💡"],
  "callToAction": "string - compelling CTA"
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