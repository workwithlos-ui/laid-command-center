import { useState } from 'react';
import { Download, KeyRound, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { CommandCenterSettings } from '@/data/types';

const defaultSettings: CommandCenterSettings = {
  openaiApiKey: '',
  perplexityApiKey: '',
  audience: '$500k-$10M founders/operators',
  defaultStyle: 'ai_news',
};

export function SettingsView() {
  const [settings, setSettings] = useLocalStorage<CommandCenterSettings>('laid-settings', defaultSettings);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const data = {
      contentPacks: localStorage.getItem('laid-content-packs'),
      copiedPacks: localStorage.getItem('laid-copied-packs'),
      settings: localStorage.getItem('laid-settings'),
      posted: localStorage.getItem('laid-posted'),
      stages: localStorage.getItem('laid-tracker-stages'),
      copiedAssets: localStorage.getItem('laid-assets-copied'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laid-command-center-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    localStorage.removeItem('laid-content-packs');
    localStorage.removeItem('laid-copied-packs');
    localStorage.removeItem('laid-posted');
    localStorage.removeItem('laid-tracker-stages');
    localStorage.removeItem('laid-settings');
    localStorage.removeItem('laid-assets-copied');
    window.location.reload();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-2xl border border-[#2a2416] bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.14),transparent_32%),#111111] p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/10 p-2">
            <KeyRound className="h-4 w-4 text-[#c9a84c]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">AI Generation Settings</h3>
            <p className="mt-1 text-xs leading-5 text-[#a0a0a0]">
              Keys are stored in this browser with localStorage. They are sent to the generation endpoint only when you create a pack.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-[#666666]">OPENAI_API_KEY</label>
            <Input
              type="password"
              value={settings.openaiApiKey || ''}
              onChange={(event) => setSettings((prev) => ({ ...defaultSettings, ...prev, openaiApiKey: event.target.value }))}
              className="h-10 border-[#222222] bg-[#0a0a0a] text-sm text-white"
              placeholder="sk..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-[#666666]">PERPLEXITY_API_KEY</label>
            <Input
              type="password"
              value={settings.perplexityApiKey || ''}
              onChange={(event) => setSettings((prev) => ({ ...defaultSettings, ...prev, perplexityApiKey: event.target.value }))}
              className="h-10 border-[#222222] bg-[#0a0a0a] text-sm text-white"
              placeholder="Optional fallback"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-[#666666]">Audience</label>
            <Input
              value={settings.audience || defaultSettings.audience}
              onChange={(event) => setSettings((prev) => ({ ...defaultSettings, ...prev, audience: event.target.value }))}
              className="h-10 border-[#222222] bg-[#0a0a0a] text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-[#666666]">Default Style</label>
            <select
              value={settings.defaultStyle || defaultSettings.defaultStyle}
              onChange={(event) => setSettings((prev) => ({ ...defaultSettings, ...prev, defaultStyle: event.target.value as CommandCenterSettings['defaultStyle'] }))}
              className="h-10 w-full rounded-md border border-[#222222] bg-[#0a0a0a] px-3 text-sm text-white outline-none focus:border-[#c9a84c]"
            >
              <option value="ai_news">ai_news</option>
              <option value="workflow">workflow</option>
              <option value="system">system</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
        <h3 className="text-sm font-semibold text-white">Data & Export</h3>
        <div className="mt-4 flex flex-col gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-full border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10 text-xs"
            onClick={handleExport}
          >
            <Download className="mr-1 h-3 w-3" />
            Export Data
          </Button>
          <div className="text-xs text-[#666666]">
            Deploy URL: {window.location.href}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
        <h3 className="text-sm font-semibold text-white">Danger Zone</h3>
        <div className="mt-4">
          {!confirmReset ? (
            <Button
              variant="outline"
              className="h-9 rounded-full border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10 text-xs"
              onClick={() => setConfirmReset(true)}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Reset All
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#ef4444]">Are you sure?</span>
              <Button
                variant="outline"
                className="h-7 border-[#ef4444] bg-[#ef4444] text-white hover:bg-[#ef4444]/80 text-xs"
                onClick={handleReset}
              >
                Yes, Reset
              </Button>
              <Button
                variant="outline"
                className="h-7 border-[#222222] text-[#a0a0a0] text-xs"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
