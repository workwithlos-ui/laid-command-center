import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export function SettingsView() {
  const [settings, setSettings] = useLocalStorage<{
    brandName: string;
    handle: string;
    cta: string;
  }>('laid-settings', {
    brandName: 'LAID',
    handle: '@loshustle',
    cta: 'DM me the keyword and I\'ll send it.',
  });

  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const data = {
      posted: localStorage.getItem('laid-posted'),
      stages: localStorage.getItem('laid-tracker-stages'),
      settings: localStorage.getItem('laid-settings'),
      copied: localStorage.getItem('laid-assets-copied'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laid-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    localStorage.removeItem('laid-posted');
    localStorage.removeItem('laid-tracker-stages');
    localStorage.removeItem('laid-settings');
    localStorage.removeItem('laid-assets-copied');
    window.location.reload();
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-lg border border-[#222222] bg-[#111111] p-5">
        <h3 className="text-sm font-semibold text-white">Brand Config</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Brand Name</label>
            <Input
              value={settings.brandName}
              onChange={(e) => setSettings((prev) => ({ ...prev, brandName: e.target.value }))}
              className="h-9 border-[#222222] bg-[#0a0a0a] text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Handle</label>
            <Input
              value={settings.handle}
              onChange={(e) => setSettings((prev) => ({ ...prev, handle: e.target.value }))}
              className="h-9 border-[#222222] bg-[#0a0a0a] text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">CTA Text</label>
            <Input
              value={settings.cta}
              onChange={(e) => setSettings((prev) => ({ ...prev, cta: e.target.value }))}
              className="h-9 border-[#222222] bg-[#0a0a0a] text-sm text-white"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#222222] bg-[#111111] p-5">
        <h3 className="text-sm font-semibold text-white">Data & Export</h3>
        <div className="mt-4 flex flex-col gap-3">
          <Button
            variant="outline"
            className="h-9 border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10 text-xs"
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

      <div className="rounded-lg border border-[#222222] bg-[#111111] p-5">
        <h3 className="text-sm font-semibold text-white">Danger Zone</h3>
        <div className="mt-4">
          {!confirmReset ? (
            <Button
              variant="outline"
              className="h-9 border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10 text-xs"
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
