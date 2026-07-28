import { AIProviderId, InfographicContent, AIGenerationRequest, AIGenerationResult } from '@/lib/types';
import { 
  buildContentAnalysisPrompt, 
  buildDesignBlueprintPrompt, 
  buildHTMLGenerationPrompt,
  buildDesignRevisionPrompt,
  buildImageAnalysisPrompt 
} from './promptBuilder';

export interface AIProvider {
  id: AIProviderId;
  generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string>;
}

async function generateWithRetry(
  provider: AIProvider,
  prompt: string,
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await provider.generate(prompt, apiKey, model, temperature, maxTokens);
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('rate_limit_exceeded') || 
                          error?.message?.includes('Rate limit') ||
                          error?.message?.includes('429');
      
      if (isRateLimit && attempt < maxRetries) {
        // Wait 10 seconds before retrying on rate limit
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

class OpenAIProviderImpl implements AIProvider {
  id: AIProviderId = 'openai';
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: model || 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature, max_tokens: maxTokens }),
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${await response.text()}`);
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

class GeminiProviderImpl implements AIProvider {
  id: AIProviderId = 'gemini';
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-pro'}:generateContent?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature, maxOutputTokens: maxTokens } }),
    });
    if (!response.ok) throw new Error(`Gemini API error: ${await response.text()}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

class ClaudeProviderImpl implements AIProvider {
  id: AIProviderId = 'claude';
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: model || 'claude-3-5-sonnet-20241022', max_tokens: maxTokens, temperature, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!response.ok) throw new Error(`Claude API error: ${await response.text()}`);
    const data = await response.json();
    return data.content?.[0]?.text || '';
  }
}

class OpenRouterProviderImpl implements AIProvider {
  id: AIProviderId = 'openrouter';
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': 'https://infographic-generator.vercel.app' },
      body: JSON.stringify({ model: model || 'openai/gpt-4o', messages: [{ role: 'user', content: prompt }], temperature, max_tokens: maxTokens }),
    });
    if (!response.ok) throw new Error(`OpenRouter API error: ${await response.text()}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

class GroqProviderImpl implements AIProvider {
  id: AIProviderId = 'groq';
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    // Token reduction strategy for rate limits
    const isSmallModel = model.includes('8b') || model.includes('20b');
    const reducedMaxTokens = isSmallModel ? Math.min(maxTokens, 4000) : maxTokens;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: reducedMaxTokens
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorData = JSON.parse(errorText);
      if (errorData.error?.type === 'tokens' && errorData.error?.code === 'rate_limit_exceeded') {
        throw new Error(`GROQ_RATE_LIMIT: ${errorData.error.message}. Please try a smaller model or reduce your request size.`);
      }
      throw new Error(`Groq API error: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

const providerMap: Record<string, AIProvider> = {
  openai: new OpenAIProviderImpl(),
  gemini: new GeminiProviderImpl(),
  claude: new ClaudeProviderImpl(),
  openrouter: new OpenRouterProviderImpl(),
  groq: new GroqProviderImpl(),
};

function extractJSON(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in AI response');
  return JSON.parse(jsonMatch[0]);
}

function extractHTML(text: string): string {
  let html = text.trim();
  const codeBlockMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    html = codeBlockMatch[1].trim();
  }
  if (!html.startsWith('<!') && !html.startsWith('<html')) {
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;overflow:hidden}</style></head><body>${html}</body></html>`;
  }
  return html;
}

/**
 * Main pipeline: Content Analysis -> Design Blueprint -> HTML Generation
 */
export async function generateContent(
  request: AIGenerationRequest,
  apiKey: string,
  providerId: AIProviderId,
  model: string,
  temperature: number = 0.7,
  maxTokens: number = 4096
): Promise<AIGenerationResult> {
  const startTime = Date.now();

  // For design mode, use the full AI pipeline
  if (request.inputType === 'design' || request.inputType === 'text' || request.inputType === 'idea' || request.inputType === 'image' || request.inputType === 'image-url') {
    if (!apiKey || apiKey.trim() === '') {
      return {
        success: false,
        error: 'AI generation requires an API key. Please configure your AI provider in Settings.',
        provider: 'local' as AIProviderId,
        processingTime: Date.now() - startTime,
      };
    }

    const provider = providerMap[providerId];
    if (!provider) {
      return {
        success: false,
        error: `Unknown AI provider: ${providerId}`,
        provider: providerId,
        processingTime: Date.now() - startTime,
      };
    }

    try {
      // ============================================
      // STEP 1: Content Analysis & Correction
      // ============================================
      const contentPrompt = buildContentAnalysisPrompt(request);
      const contentResponse = await generateWithRetry(provider, contentPrompt, apiKey, model, 0.9, 2048);
      const contentResult = extractJSON(contentResponse);

      // If content is incomplete, return the questions for the user to answer
      if (!contentResult.isComplete) {
        return {
          success: false,
          error: 'CONTENT_INCOMPLETE',
          content: contentResult,
          provider: providerId,
          model,
          processingTime: Date.now() - startTime,
        };
      }

      // ============================================
      // STEP 2: Design Blueprint
      // ============================================
      const blueprintPrompt = buildDesignBlueprintPrompt(contentResult.correctedContent, request);
      const blueprintResponse = await generateWithRetry(provider, blueprintPrompt, apiKey, model, 1.0, 4096);
      const blueprint = extractJSON(blueprintResponse);

      // ============================================
      // STEP 3: HTML/CSS Generation
      // ============================================
      const htmlPrompt = buildHTMLGenerationPrompt(contentResult.correctedContent, blueprint, request);
      const htmlResponse = await generateWithRetry(provider, htmlPrompt, apiKey, model, 0.9, maxTokens);
      const html = extractHTML(htmlResponse);

      return {
        success: true,
        content: {
          title: contentResult.correctedContent.title,
          subtitle: contentResult.correctedContent.subtitle,
          sections: contentResult.correctedContent.sections,
          statistics: contentResult.correctedContent.statistics,
          timeline: contentResult.correctedContent.timeline,
          colors: [blueprint.colorPalette.primary, blueprint.colorPalette.secondary, blueprint.colorPalette.accent, blueprint.colorPalette.background, blueprint.colorPalette.text],
          icons: contentResult.correctedContent.suggestedIcons,
          callToAction: contentResult.correctedContent.callToAction,
        },
        generatedHtml: html,
        blueprint: blueprint,
        provider: providerId,
        model,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate infographic',
        provider: providerId,
        processingTime: Date.now() - startTime,
      };
    }
  }

  // For other modes, use local generation (backward compatibility)
  return generateLocalContent(request, providerId, model, startTime);
}

/**
 * Revision pipeline: User feedback -> Revised Blueprint -> New HTML
 */
export async function reviseDesign(
  currentHtml: string,
  currentBlueprint: any,
  content: any,
  userFeedback: string,
  apiKey: string,
  providerId: AIProviderId,
  model: string,
  temperature: number = 0.4,
  maxTokens: number = 4096
): Promise<AIGenerationResult> {
  const startTime = Date.now();

  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: 'API key required for revision',
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }

  const provider = providerMap[providerId];
  if (!provider) {
    return {
      success: false,
      error: `Unknown AI provider: ${providerId}`,
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }

  try {
    // Revise blueprint based on feedback
    const revisionPrompt = buildDesignRevisionPrompt(currentBlueprint, userFeedback, content);
    const revisionResponse = await provider.generate(revisionPrompt, apiKey, model, temperature, 2048);
    const revisedBlueprint = extractJSON(revisionResponse);

    // Generate new HTML from revised blueprint
    // We need to create a request object for the HTML generation
    const request: AIGenerationRequest = {
      input: '',
      inputType: 'design',
      aspectRatio: '1:1',
    };

    const htmlPrompt = buildHTMLGenerationPrompt(content, revisedBlueprint, request);
    const htmlResponse = await provider.generate(htmlPrompt, apiKey, model, 0.2, maxTokens);
    const html = extractHTML(htmlResponse);

    return {
      success: true,
      content,
      generatedHtml: html,
      blueprint: revisedBlueprint,
      provider: providerId,
      model,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revise design',
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Local fallback content generation (no API key required)
 */
function generateLocalContent(
  request: AIGenerationRequest,
  providerId: AIProviderId,
  model: string,
  startTime: number
): AIGenerationResult {
  const sentences = request.input.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const words = request.input.split(/\s+/).filter(w => w.length > 0);
  
  const title = sentences[0]?.trim().substring(0, 80) || 'Your Infographic';
  
  const sections: InfographicContent['sections'] = sentences.slice(0, 4).map((s, i) => ({
    id: `section-${i}`,
    title: `Key Point ${i + 1}`,
    content: s.trim().substring(0, 300),
    bullets: [],
    icon: ['📊', '📈', '💡', '🎯'][i],
    type: 'text' as const,
  }));

  const stats = request.input.match(/\d+[%]?/g);
  const statistics: InfographicContent['statistics'] = stats ? stats.slice(0, 4).map((num, i) => ({
    id: `stat-${i}`,
    value: num,
    label: ['Growth', 'Impact', 'Reach', 'Rate'][i] || `Metric ${i + 1}`,
    prefix: '',
    suffix: num.includes('%') ? '' : '%',
  })) : [
    { id: 'stat-1', value: '95%', label: 'Effectiveness', prefix: '', suffix: '' },
    { id: 'stat-2', value: '3x', label: 'Improvement', prefix: '', suffix: '' },
    { id: 'stat-3', value: '50M+', label: 'Users', prefix: '', suffix: '' },
  ];

  const content: InfographicContent = {
    title,
    subtitle: `${words.length} words analyzed | ${sections.length} key insights`,
    sections,
    statistics,
    timeline: [],
    colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'],
    icons: ['📊', '📈', '💡', '🎯'],
    callToAction: 'Get Started Today →',
  };

  return {
    success: true,
    content,
    provider: 'local' as AIProviderId,
    model: 'local-generator',
    processingTime: Date.now() - startTime,
  };
}

export async function analyzeImage(
  imageData: string,
  apiKey: string,
  providerId: AIProviderId,
  model: string
): Promise<any> {
  const provider = providerMap[providerId];
  if (!provider) throw new Error(`Unknown AI provider: ${providerId}`);
  const prompt = buildImageAnalysisPrompt(imageData);
  const response = await provider.generate(prompt, apiKey, model, 0.3, 1024);
  return extractJSON(response);
}

/**
 * Direct HTML generation from content + blueprint (skips content analysis)
 * Used when user approves a blueprint after content analysis
 */
export async function generateHTMLFromBlueprint(
  content: any,
  blueprint: any,
  apiKey: string,
  providerId: AIProviderId,
  model: string,
  aspectRatio: string = '1:1',
  maxTokens: number = 4096
): Promise<AIGenerationResult> {
  const startTime = Date.now();
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, error: 'API key required for HTML generation', provider: providerId, processingTime: Date.now() - startTime };
  }
  const provider = providerMap[providerId];
  if (!provider) {
    return { success: false, error: `Unknown AI provider: ${providerId}`, provider: providerId, processingTime: Date.now() - startTime };
  }
  try {
    const request: AIGenerationRequest = { input: '', inputType: 'design', aspectRatio: aspectRatio as any };
    const htmlPrompt = buildHTMLGenerationPrompt(content, blueprint, request);
    const htmlResponse = await provider.generate(htmlPrompt, apiKey, model, 0.2, maxTokens);
    const html = extractHTML(htmlResponse);
    return { success: true, content, generatedHtml: html, blueprint, provider: providerId, model, processingTime: Date.now() - startTime };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate HTML from blueprint', provider: providerId, processingTime: Date.now() - startTime };
  }
}

/**
 * Direct design blueprint generation from already-analyzed content
 * Used when content has been analyzed and we need a fresh blueprint
 */
export async function generateBlueprintFromContent(
  content: any,
  request: AIGenerationRequest,
  apiKey: string,
  providerId: AIProviderId,
  model: string
): Promise<AIGenerationResult> {
  const startTime = Date.now();
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, error: 'API key required for blueprint generation', provider: providerId, processingTime: Date.now() - startTime };
  }
  const provider = providerMap[providerId];
  if (!provider) {
    return { success: false, error: `Unknown AI provider: ${providerId}`, provider: providerId, processingTime: Date.now() - startTime };
  }
  try {
    const blueprintPrompt = buildDesignBlueprintPrompt(content, request);
    const blueprintResponse = await provider.generate(blueprintPrompt, apiKey, model, 0.4, 2048);
    const blueprint = extractJSON(blueprintResponse);
    return { success: true, content, blueprint, provider: providerId, model, processingTime: Date.now() - startTime };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate blueprint', provider: providerId, processingTime: Date.now() - startTime };
  }
}

// Re-export for backward compatibility
export { buildContentAnalysisPrompt, buildDesignBlueprintPrompt, buildHTMLGenerationPrompt, buildDesignRevisionPrompt } from './promptBuilder';
