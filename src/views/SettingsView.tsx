import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const LAID_SETTINGS_KEY = 'laid-settings';
const KIMI_SETTINGS_KEY = 'ai-content-settings';

function readSavedOpenAIKey(): string {
  try {
    const laidRaw = localStorage.getItem(LAID_SETTINGS_KEY);
    const kimiRaw = localStorage.getItem(KIMI_SETTINGS_KEY);
    const laidSettings = laidRaw ? JSON.parse(laidRaw) : {};
    const kimiSettings = kimiRaw ? JSON.parse(kimiRaw) : {};
    return kimiSettings.apiKeys?.openai || laidSettings.openaiApiKey || '';
  } catch {
    return '';
  }
}

function saveOpenAIKey(openaiApiKey: string) {
  const trimmedKey = openaiApiKey.trim();
  const laidRaw = localStorage.getItem(LAID_SETTINGS_KEY);
  const kimiRaw = localStorage.getItem(KIMI_SETTINGS_KEY);
  const laidSettings = laidRaw ? JSON.parse(laidRaw) : {};
  const kimiSettings = kimiRaw ? JSON.parse(kimiRaw) : {};

  localStorage.setItem(
    LAID_SETTINGS_KEY,
    JSON.stringify({
      brandName: 'Content Command',
      handle: '@contentcommand',
      cta: 'DM me and I will send the workflow.',
      audience: '$500K-$10M founders/operators',
      voiceTraining: laidSettings.voiceTraining || '',
      ...laidSettings,
      openaiApiKey: trimmedKey,
    })
  );

  localStorage.setItem(
    KIMI_SETTINGS_KEY,
    JSON.stringify({
      audience: kimiSettings.audience || '$500K-$10M founders/operators',
      voiceTraining: kimiSettings.voiceTraining || laidSettings.voiceTraining || '',
      ...kimiSettings,
      apiKeys: {
        ...(kimiSettings.apiKeys || {}),
        openai: trimmedKey,
      },
    })
  );
}

export function SettingsView() {
  const [openaiApiKey, setOpenaiApiKey] = useState(() => readSavedOpenAIKey());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveOpenAIKey(openaiApiKey);
    setSaved(true);
    window.dispatchEvent(new Event('content-command-settings-updated'));
    setTimeout(() => setSaved(false), 2600);
  };

  const hasKey = openaiApiKey.trim().length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="obsidian-card obsidian-glow rounded-[28px] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Settings</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#F8FAFC] md:text-5xl">Connect OpenAI</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#A1A1AA]">
              Add your OpenAI API key so Content Command can run the live six-agent pipeline. The key is stored only in this browser's localStorage.
            </p>
          </div>
          <div className={`rounded-full border px-4 py-2 text-xs ${hasKey ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-[#F8C471]/25 bg-[#F8C471]/10 text-[#F8C471]'}`}>
            {hasKey ? 'API key saved locally' : 'API key required'}
          </div>
        </div>
      </section>

      <section className="obsidian-elevated rounded-[28px] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-[#A855F7]/30 bg-[#A855F7]/12 text-[#D8B4FE]">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F8FAFC]">OpenAI API Key</h3>
            <p className="text-sm text-[#71717A]">Required before generating real content packs.</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">API key</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Input
                type={showKey ? 'text' : 'password'}
                value={openaiApiKey}
                onChange={(event) => {
                  setOpenaiApiKey(event.target.value);
                  setSaved(false);
                }}
                placeholder="sk-..."
                className="h-12 rounded-2xl border-white/10 bg-white/[0.045] pr-12 text-[#F8FAFC] placeholder:text-[#71717A] focus-visible:ring-[#A855F7]/30"
              />
              <button
                type="button"
                onClick={() => setShowKey((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#71717A] transition hover:bg-white/[0.06] hover:text-[#F8FAFC]"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button onClick={handleSave} className="h-12 rounded-2xl bg-gradient-to-r from-[#A855F7] to-[#22D3EE] px-6 text-sm font-semibold text-white shadow-[0_0_34px_rgba(168,85,247,0.24)] hover:opacity-95">
              Save
            </Button>
          </div>
          {saved && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              OpenAI API key saved. You can now generate content packs.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#22D3EE]" />
          <div>
            <h4 className="text-sm font-semibold text-[#F8FAFC]">Local browser storage</h4>
            <p className="mt-1 text-sm leading-6 text-[#A1A1AA]">
              This app stores your key in localStorage for this browser session and passes it to the six-agent pipeline when you click Generate Content Sprint.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
