import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const OPENAI_KEY = 'openai_api_key';
const AUDIENCE_KEY = 'content_command_audience';
const STYLE_KEY = 'content_command_default_style';

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [audience, setAudience] = useState('500k–10M founders/operators');
  const [defaultStyle, setDefaultStyle] = useState('ai_news');

  useEffect(() => {
    setApiKey(localStorage.getItem(OPENAI_KEY) || '');
    setAudience(localStorage.getItem(AUDIENCE_KEY) || '500k–10M founders/operators');
    setDefaultStyle(localStorage.getItem(STYLE_KEY) || 'ai_news');
  }, []);

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    localStorage.setItem(OPENAI_KEY, trimmedKey);
    localStorage.setItem(AUDIENCE_KEY, audience.trim() || '500k–10M founders/operators');
    localStorage.setItem(STYLE_KEY, defaultStyle);

    const existingLaidSettings = JSON.parse(localStorage.getItem('laid-settings') || '{}');
    localStorage.setItem(
      'laid-settings',
      JSON.stringify({
        ...existingLaidSettings,
        openaiApiKey: trimmedKey,
        audience: audience.trim() || '500k–10M founders/operators',
        defaultStyle,
      })
    );

    const existingKimiSettings = JSON.parse(localStorage.getItem('ai-content-settings') || '{}');
    localStorage.setItem(
      'ai-content-settings',
      JSON.stringify({
        ...existingKimiSettings,
        audience: audience.trim() || '500k–10M founders/operators',
        defaultStyle,
        apiKeys: {
          ...(existingKimiSettings.apiKeys || {}),
          openai: trimmedKey,
        },
      })
    );

    window.dispatchEvent(new Event('content-command-settings-updated'));
    toast.success('Settings saved. Your OpenAI API key is ready.');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Toaster richColors position="top-right" theme="dark" />

      <section className="rounded-[28px] border border-white/[0.08] bg-[#101014]/86 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Settings</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#F8FAFC] md:text-5xl">Connect your content engine</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#A1A1AA]">
              Add your OpenAI API key, audience, and default generation style. These settings are stored locally in this browser and used when you run a Content Sprint.
            </p>
          </div>
          <div className="rounded-full border border-[#A855F7]/30 bg-[#A855F7]/12 px-4 py-2 text-xs font-medium text-[#D8B4FE]">
            Obsidian Intelligence UI
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/[0.08] bg-[#101014] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.36)] md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-[#A855F7]/35 bg-[#A855F7]/15 text-[#F8FAFC] shadow-[0_0_34px_rgba(168,85,247,0.18)]">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F8FAFC]">OpenAI API Key</h3>
            <p className="text-sm text-[#A1A1AA]">Required to run the live six-agent pipeline.</p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">OpenAI API Key</label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.045] pr-12 text-[#F8FAFC] placeholder:text-[#71717A] focus-visible:ring-[#A855F7]/30"
              />
              <button
                type="button"
                onClick={() => setShowKey((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#A1A1AA] transition hover:bg-white/[0.06] hover:text-[#F8FAFC]"
                aria-label={showKey ? 'Hide OpenAI API key' : 'Show OpenAI API key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">Audience</label>
              <Input
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.045] text-[#F8FAFC] placeholder:text-[#71717A] focus-visible:ring-[#A855F7]/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">Default Style</label>
              <Select value={defaultStyle} onValueChange={setDefaultStyle}>
                <SelectTrigger className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.045] text-[#F8FAFC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-[#171720] text-[#F8FAFC]">
                  <SelectItem value="ai_news">AI News</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSave} className="h-12 rounded-2xl bg-gradient-to-r from-[#A855F7] to-[#22D3EE] px-6 text-sm font-semibold text-white shadow-[0_0_34px_rgba(168,85,247,0.28)] hover:opacity-95">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.045] p-5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#22D3EE]" />
          <div>
            <h4 className="text-sm font-semibold text-[#F8FAFC]">Where this is stored</h4>
            <p className="mt-1 text-sm leading-6 text-[#A1A1AA]">
              The API key is saved under <span className="font-mono text-[#F8FAFC]">openai_api_key</span> in localStorage. Generate reads this key before calling the six-agent pipeline.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
