import { useEffect, useState } from 'react';
import { ArrowRight, Copy, FileText, Layers, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ContentPackDetailDialog } from '@/components/ContentPackDetailDialog';
import { StatCard } from '@/components/StatCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { CommandCenterSettings, ContentPack } from '@/data/types';

const styleLabels: Record<ContentPack['style'], string> = {
  ai_news: 'AI News',
  workflow: 'Workflow',
  system: 'System',
};

const defaultSettings: CommandCenterSettings = {
  openaiApiKey: '',
  perplexityApiKey: '',
  audience: '$500k-$10M founders/operators',
  defaultStyle: 'ai_news',
};

function normalizeContentPack(payload: unknown): ContentPack | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  return (record.contentPack || record) as ContentPack;
}

export function DashboardView() {
  const navigate = useNavigate();
  const [contentPacks, setContentPacks] = useLocalStorage<ContentPack[]>('laid-content-packs', []);
  const [settings] = useLocalStorage<CommandCenterSettings>('laid-settings', defaultSettings);
  const [copiedPacks, setCopiedPacks] = useLocalStorage<string[]>('laid-copied-packs', []);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [theme, setTheme] = useState('AI tools for 500k-10M founders');
  const [style, setStyle] = useState<ContentPack['style']>(settings.defaultStyle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadPacks() {
      try {
        const response = await fetch('/api/contentPacks');
        if (!response.ok) throw new Error('Unable to load saved content packs.');
        const packs = await response.json();
        if (active && Array.isArray(packs)) setContentPacks(packs);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load saved content packs.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadPacks();
    return () => {
      active = false;
    };
  }, [setContentPacks]);

  const formatsGenerated = contentPacks.length * 5;
  const latestPack = contentPacks[0];
  const updatesCovered = new Set(contentPacks.map((pack) => pack.tool_name)).size;
  const averageImpact = Math.round(
    contentPacks.reduce((sum, pack) => sum + (pack.impact_score || 0), 0) / Math.max(contentPacks.length, 1)
  );
  const selectedPack = contentPacks.find((pack) => pack.id === selectedPackId) || null;

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2200);
  };

  const handleCopy = (pack: ContentPack) => {
    setCopiedPacks((prev) => (prev.includes(pack.id) ? prev : [...prev, pack.id]));
    showToast('Copied to clipboard.');
  };

  const handleUpdatePack = (pack: ContentPack) => {
    setContentPacks((prev) => prev.map((item) => (item.id === pack.id ? pack : item)));
  };

  const generatePack = async () => {
    setError('');
    setIsGenerating(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (settings.openaiApiKey) headers['x-openai-api-key'] = settings.openaiApiKey;
      const response = await fetch('/api/generateContentPack', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          apiKey: settings.openaiApiKey || undefined,
          theme,
          style,
          audience: settings.audience || defaultSettings.audience,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Generation failed.');
      const contentPack = normalizeContentPack(payload);
      if (!contentPack?.id) throw new Error('Generation returned an invalid content pack.');
      setContentPacks((prev) => [contentPack, ...prev.filter((item) => item.id !== contentPack.id)]);
      setSelectedPackId(contentPack.id);
      setGenerateOpen(false);
      showToast('Content pack generated and saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-[#2a2416] bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.2),transparent_32%),linear-gradient(145deg,#131313,#070707)] p-6 shadow-2xl shadow-black/40">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
              <Sparkles className="h-3 w-3" /> AI Content Command Center
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              One click from live AI update to full content pack.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a0a0a0]">
              LAID finds one recent AI update, scores it for operator impact, writes the long post, repurposes it, checks quality, saves it, and shows it here.
            </p>
          </div>
          <Button
            className="h-11 rounded-full bg-[#c9a84c] px-5 text-sm font-semibold text-black hover:bg-[#d8ba62]"
            onClick={() => setGenerateOpen(true)}
          >
            <Wand2 className="mr-2 h-4 w-4" /> Generate from AI Update
          </Button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard value={contentPacks.length} label="Content Packs" sublabel="saved server side" />
        <StatCard value={updatesCovered} label="AI Updates Covered" sublabel="real sources" />
        <StatCard value={formatsGenerated} label="Formats Generated" sublabel="5 per pack" />
        <StatCard value={averageImpact} label="Avg Impact" sublabel="workflow score" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[#222222] bg-[#111111]">
          <div className="flex items-center justify-between border-b border-[#222222] px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Saved content packs</h3>
              <p className="mt-1 text-xs text-[#666666]">Click any card to review the Long Post, X Thread, IG Caption, Carousel, and Short Script tabs.</p>
            </div>
            <FileText className="h-4 w-4 text-[#c9a84c]" />
          </div>
          <div className="divide-y divide-[#222222]">
            {isLoading && (
              <div className="px-4 py-6 text-sm text-[#a0a0a0]">
                <Loader2 className="mb-3 h-5 w-5 animate-spin text-[#c9a84c]" /> Loading saved packs.
              </div>
            )}
            {!isLoading && contentPacks.length === 0 && (
              <div className="px-4 py-6 text-sm text-[#a0a0a0]">No saved packs yet. Generate one from a recent AI update.</div>
            )}
            {contentPacks.slice(0, 8).map((pack) => (
              <button
                key={pack.id}
                className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-[#151515]"
                onClick={() => setSelectedPackId(pack.id)}
              >
                <div className="mt-1 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/10 p-2">
                  <FileText className="h-4 w-4 text-[#c9a84c]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{pack.long_post.title}</span>
                    <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#a0a0a0]">
                      {pack.style}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#a0a0a0]">{pack.summary}</p>
                  <p className="mt-2 text-[11px] text-[#666666]">{pack.tool_name} · Source date: {pack.source_date || 'Verified in generation'}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-[#666666]" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#222222] bg-[#111111]">
          <div className="border-b border-[#222222] px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Command Center Activity</h3>
          </div>
          <div className="space-y-3 p-4">
            <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#666666]">Current focus</p>
              <p className="mt-2 text-sm font-medium text-white">{latestPack?.theme || 'No active theme yet'}</p>
            </div>
            <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#666666]">Copy history</p>
              <p className="mt-2 text-sm font-medium text-white">{copiedPacks.length} packs copied for publishing</p>
            </div>
            <Button
              variant="outline"
              className="h-10 w-full rounded-full border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10"
              onClick={() => latestPack && navigator.clipboard.writeText(latestPack.long_post.body_markdown)}
              disabled={!latestPack}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Latest Long Post
            </Button>
            <Button
              variant="outline"
              className="h-10 w-full rounded-full border-[#222222] text-[#a0a0a0] hover:border-[#c9a84c] hover:text-[#c9a84c]"
              onClick={() => navigate('/feed')}
            >
              <Layers className="mr-2 h-4 w-4" /> Open Pack Library
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-2xl border-[#2a2416] bg-[#0d0d0d] text-white">
          <DialogHeader>
            <DialogTitle>Generate from AI Update</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              LAID will run the backend finder, filter, writer, repurposer, quality gate, and server save flow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-[#666666]">Theme</label>
              <Input
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                className="mt-2 rounded-xl border-[#222222] bg-[#111111] text-white"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-[#666666]">Style</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['ai_news', 'workflow', 'system'] as ContentPack['style'][]).map((item) => (
                  <Button
                    key={item}
                    variant="outline"
                    className={`rounded-xl border-[#222222] ${style === item ? 'bg-[#c9a84c] text-black hover:bg-[#d8ba62]' : 'bg-[#111111] text-[#a0a0a0]'}`}
                    onClick={() => setStyle(item)}
                  >
                    {styleLabels[item]}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-[#666666]">Audience</label>
              <Textarea
                value={settings.audience || defaultSettings.audience}
                readOnly
                className="mt-2 h-20 resize-none rounded-xl border-[#222222] bg-[#111111] text-white"
              />
            </div>
            <Button
              className="h-11 w-full rounded-full bg-[#c9a84c] font-semibold text-black hover:bg-[#d8ba62]"
              onClick={generatePack}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {isGenerating ? 'Running backend pipeline...' : 'Generate from AI Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ContentPackDetailDialog
        pack={selectedPack}
        open={!!selectedPack}
        onOpenChange={(open) => !open && setSelectedPackId(null)}
        onUpdate={handleUpdatePack}
        onCopy={(pack) => handleCopy(pack)}
      />

      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#c9a84c]/40 bg-[#111111] px-4 py-2 text-sm text-white shadow-2xl">
          {toast.message}
        </div>
      )}
    </div>
  );
}
