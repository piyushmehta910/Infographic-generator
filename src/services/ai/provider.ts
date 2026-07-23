import { AIProviderId, InfographicContent, AIGenerationRequest, AIGenerationResult } from '@/lib/types';
import { buildPrompt, buildImageAnalysisPrompt } from './promptBuilder';

export interface AIProvider {
  id: AIProviderId;
  generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string>;
}

class OpenAIProviderImpl implements AIProvider {
  id: AIProviderId = 'openai';

  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

class GeminiProviderImpl implements AIProvider {
  id: AIProviderId = 'gemini';

  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-pro'}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

class ClaudeProviderImpl implements AIProvider {
  id: AIProviderId = 'claude';

  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }
}

class OpenRouterProviderImpl implements AIProvider {
  id: AIProviderId = 'openrouter';

  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://infographic-generator.vercel.app',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

class GroqProviderImpl implements AIProvider {
  id: AIProviderId = 'groq';

  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
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

function parseAIResponse(text: string): InfographicContent {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and fill defaults
    return {
      title: parsed.title || 'Untitled Infographic',
      subtitle: parsed.subtitle || '',
      sections: (parsed.sections || []).map((s: any, i: number) => ({
        id: s.id || `section-${i}`,
        title: s.title || '',
        content: s.content || '',
        bullets: s.bullets || [],
        type: s.type || 'text',
      })),
      statistics: (parsed.statistics || []).map((s: any, i: number) => ({
        id: s.id || `stat-${i}`,
        value: s.value || '0',
        label: s.label || '',
        prefix: s.prefix || '',
        suffix: s.suffix || '',
      })),
      timeline: (parsed.timeline || []).map((t: any, i: number) => ({
        id: t.id || `timeline-${i}`,
        date: t.date || '',
        title: t.title || '',
        description: t.description || '',
      })),
      colors: parsed.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      icons: parsed.icons || ['📊', '📈', '💡'],
      callToAction: parsed.callToAction || 'Learn more today',
      metadata: {
        language: parsed.metadata?.language || 'en',
        wordCount: parsed.sections?.reduce((acc: number, s: any) => acc + (s.content?.length || 0), 0) || 0,
        readingTime: 0,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (e) {
    throw new Error('Failed to parse AI response as JSON');
  }
}

export async function generateContent(
  request: AIGenerationRequest,
  apiKey: string,
  providerId: AIProviderId,
  model: string,
  temperature: number = 0.7,
  maxTokens: number = 4096
): Promise<AIGenerationResult> {
  const startTime = Date.now();

  try {
    const provider = providerMap[providerId];
    if (!provider) {
      throw new Error(`Unknown AI provider: ${providerId}`);
    }

    const prompt = buildPrompt(request);
    const response = await provider.generate(prompt, apiKey, model, temperature, maxTokens);
    const content = parseAIResponse(response);

    return {
      success: true,
      content,
      provider: providerId,
      model,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }
}

export async function analyzeImage(
  imageData: string,
  apiKey: string,
  providerId: AIProviderId,
  model: string
): Promise<any> {
  const provider = providerMap[providerId];
  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerId}`);
  }

  const prompt = buildImageAnalysisPrompt(imageData);
  const response = await provider.generate(prompt, apiKey, model, 0.3, 1024);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in image analysis response');
  }

  return JSON.parse(jsonMatch[0]);
}