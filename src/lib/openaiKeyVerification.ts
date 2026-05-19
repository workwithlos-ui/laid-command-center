export type OpenAIKeyVerificationStatus = 'unknown' | 'ok' | 'invalid';

export type OpenAIKeyVerificationResult = {
  status: OpenAIKeyVerificationStatus;
  message: string;
  checkedAt?: string;
  keyFingerprint?: string;
};

const OPENAI_KEY = 'openai_api_key';
const LAID_SETTINGS_KEY = 'laid-settings';
const KIMI_SETTINGS_KEY = 'ai-content-settings';
const CACHE_KEY = 'content-command-openai-key-verification';

export const OPENAI_KEY_VERIFICATION_EVENT = 'content-command-openai-key-verification-updated';

export const UNKNOWN_OPENAI_KEY_STATUS: OpenAIKeyVerificationResult = {
  status: 'unknown',
  message: 'OpenAI key not tested',
};

function fingerprintKey(key: string) {
  const trimmed = key.trim();
  if (!trimmed) return '';
  return `${trimmed.slice(0, 7)}:${trimmed.slice(-4)}:${trimmed.length}`;
}

export function readStoredOpenAIKey(): string {
  try {
    const directKey = localStorage.getItem(OPENAI_KEY) || '';
    const laidRaw = localStorage.getItem(LAID_SETTINGS_KEY);
    const kimiRaw = localStorage.getItem(KIMI_SETTINGS_KEY);
    const laidSettings = laidRaw ? JSON.parse(laidRaw) : {};
    const kimiSettings = kimiRaw ? JSON.parse(kimiRaw) : {};
    return directKey || kimiSettings.apiKeys?.openai || laidSettings.openaiApiKey || '';
  } catch {
    return '';
  }
}

export function readOpenAIKeyVerification(apiKey = readStoredOpenAIKey()): OpenAIKeyVerificationResult {
  const keyFingerprint = fingerprintKey(apiKey);
  if (!keyFingerprint) return UNKNOWN_OPENAI_KEY_STATUS;

  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return UNKNOWN_OPENAI_KEY_STATUS;
    const cached = JSON.parse(raw) as OpenAIKeyVerificationResult;
    return cached.keyFingerprint === keyFingerprint ? cached : UNKNOWN_OPENAI_KEY_STATUS;
  } catch {
    return UNKNOWN_OPENAI_KEY_STATUS;
  }
}

function writeOpenAIKeyVerification(result: OpenAIKeyVerificationResult) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
  window.dispatchEvent(new Event(OPENAI_KEY_VERIFICATION_EVENT));
}

export function clearOpenAIKeyVerification() {
  sessionStorage.removeItem(CACHE_KEY);
  window.dispatchEvent(new Event(OPENAI_KEY_VERIFICATION_EVENT));
}

export async function verifyOpenAIKey(apiKey = readStoredOpenAIKey()): Promise<OpenAIKeyVerificationResult> {
  const trimmedKey = apiKey.trim();
  const keyFingerprint = fingerprintKey(trimmedKey);
  if (!keyFingerprint) {
    clearOpenAIKeyVerification();
    return UNKNOWN_OPENAI_KEY_STATUS;
  }

  try {
    const response = await fetch('/api/openai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-openai-key': trimmedKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
    });

    const result: OpenAIKeyVerificationResult = {
      status: response.ok ? 'ok' : 'invalid',
      message: response.ok ? 'OpenAI key verified' : 'OpenAI key rejected - re-paste',
      checkedAt: new Date().toISOString(),
      keyFingerprint,
    };
    writeOpenAIKeyVerification(result);
    return result;
  } catch {
    const result: OpenAIKeyVerificationResult = {
      status: 'invalid',
      message: 'OpenAI key rejected - re-paste',
      checkedAt: new Date().toISOString(),
      keyFingerprint,
    };
    writeOpenAIKeyVerification(result);
    return result;
  }
}
