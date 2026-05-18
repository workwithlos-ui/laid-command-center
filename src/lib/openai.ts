// ═══════════════════════════════════════════════════════════════════════════════
// OpenAI API Client - JSON-mode calls with retries
// ═══════════════════════════════════════════════════════════════════════════════

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AgentCallResult<T> {
  success: boolean;
  data?: T;
  raw?: string;
  error?: string;
  tokensUsed?: number;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const WRITER_MODEL = 'gpt-4o';
const DEFAULT_TEMP = 0.3;
const WRITER_TEMP = 0.4;
const MAX_TOKENS = 4096;
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 60000;

/**
 * Call the OpenAI Chat Completions API with JSON mode enabled.
 * Retries on parse failure up to MAX_RETRIES.
 */
export async function callAgent<T>(
  config: OpenAIConfig,
  prompt: string,
  options?: { isWriter?: boolean; label?: string }
): Promise<AgentCallResult<T>> {
  const model = options?.isWriter ? WRITER_MODEL : (config.model || DEFAULT_MODEL);
  const temperature = options?.isWriter ? WRITER_TEMP : (config.temperature || DEFAULT_TEMP);

  let lastError: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: MAX_TOKENS,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are a precise JSON-output agent. Always return valid JSON only. No markdown code fences. No explanatory text outside the JSON.',
            },
            { role: 'user', content: prompt },
          ] as ChatMessage[],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'unknown error');
        let errorMsg = `OpenAI API ${response.status}`;
        try {
          const parsed = JSON.parse(errorBody);
          errorMsg = parsed.error?.message || errorMsg;
        } catch {
          // not JSON
        }
        if (response.status === 401) {
          errorMsg = 'Invalid API key. Check your OpenAI API key in Settings.';
        } else if (response.status === 429) {
          errorMsg = 'Rate limited. Wait a moment and try again.';
        }
        lastError = errorMsg;
        // Retry on rate limit
        if (response.status === 429 && attempt < MAX_RETRIES) {
          await delay(3000 * (attempt + 1));
          continue;
        }
        break;
      }

      const result: ChatCompletionResponse = await response.json();
      const rawContent = result.choices[0]?.message?.content?.trim() || '';

      if (!rawContent) {
        lastError = 'Empty response from API';
        continue;
      }

      // Strip markdown code fences if present
      const jsonText = rawContent
        .replace(/^```(?:json)?\s*/, '')
        .replace(/\s*```\s*$/, '')
        .trim();

      try {
        const parsed = JSON.parse(jsonText) as T;
        return {
          success: true,
          data: parsed,
          raw: rawContent,
          tokensUsed: result.usage?.total_tokens,
        };
      } catch {
        lastError = `JSON parse failed. Got: ${jsonText.slice(0, 200)}...`;
        // Retry on parse failure
        if (attempt < MAX_RETRIES) {
          await delay(1000 * (attempt + 1));
          continue;
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = `Request timed out after ${REQUEST_TIMEOUT / 1000}s`;
      } else if (err instanceof Error) {
        lastError = err.message;
      } else {
        lastError = 'Unknown error';
      }
    }
  }

  return { success: false, error: lastError || 'All retries exhausted' };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if the OpenAI API key looks valid (basic format check)
 */
export function isValidApiKey(key: string): boolean {
  return key.startsWith('sk-') && key.length > 20;
}
