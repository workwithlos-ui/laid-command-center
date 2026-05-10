import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Loader2, Search, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ContentPackDetailDialog } from '@/components/ContentPackDetailDialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { CommandCenterSettings, ContentPack } from '@/data/types';

const statusFilters = [
  { key: 'all', label: 'All Packs' },
  { key: 'ready', label: 'Ready' },
  { key: 'copied', label: 'Copied' },
];

const styleLabels: Record<ContentPack['style'], string> = {
  ai_news: 'AI News',
  workflow: 'Workflow',
  system: 'System',
};

type GenerationSource = 'llm' | 'github' | 'both';

const sourceLabels: Record<GenerationSource, string> = {
  llm: 'AI News (LLM)',
  github: 'GitHub Trending',
  both: 'Both',
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

export function FeedView() {
  const [contentPacks, setContentPacks] = useLocalStorage<ContentPack[]>('laid-content-packs', []);
  const [settings] = useLocalStorage<CommandCenterSettings>('laid-settings', defaultSettings);
  const [copiedPacks, setCopiedPacks] = useLocalStorage<string[]>('laid-copied-packs', []);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [theme, setTheme] = useState('AI tools for 500k-10M founders');
  const [style, setStyle] = useState<ContentPack['style']>(settings.defaultStyle);
  const [source, setSource] = useState<GenerationSource>('both');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '' });

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

  const selectedPack = contentPacks.find((pack) => pack.id === selectedPackId) || null;

  const filtered = useMemo(() => {
    return contentPacks.filter((pack) => {
      const matchStatus =
        statusFilter === 'all' ? true : statusFilter === 'copied' ? copiedPacks.includes(pack.id) : !copiedPacks.includes(pack.id);
      const query = search.toLowerCase();
      const matchSearch =
        !query ||
        pack.tool_name.toLowerCase().includes(query) ||
        pack.summary.toLowerCase().includes(query) ||
        pack.theme.toLowerCase().includes(query) ||
        pack.long_post.title.toLowerCase().includes(query);
      return matchStatus && matchSearch;
    });
  }, [contentPacks, copiedPacks, search, statusFilter]);

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
          source,
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
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#2a2416] bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.18),transparent_32%),linear-gradient(135deg,#121212,#070707)] p-5 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
              <Sparkles className="h-3 w-3" /> AI Content Command Center
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Generate a full pack from a real AI update.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#a0a0a0]">
              The backend finds a recent AI update, scores it, writes the operator post, runs the repurposer, checks quality, and saves the pack.
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
          <Input
            placeholder="Search content packs, tools, themes..."
            className="h-10 rounded-full border-[#222222] bg-[#111111] pl-9 text-sm text-white placeholder:text-[#666666]"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-full border border-[#222222] bg-[#101010] p-1">
          {statusFilters.map((filter) => (
            <Button
              key={filter.key}
              variant="ghost"
              size="sm"
              className={`h-8 rounded-full px-3 text-[11px] ${
                statusFilter === filter.key ? 'bg-[#c9a84c] text-black hover:bg-[#c9a84c]' : 'text-[#666666] hover:text-[#a0a0a0]'
              }`}
              onClick={() => setStatusFilter(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <p className="text-[11px] uppercase tracking-[0.2em] text-[#666666]">
        {filtered.length} content packs, {contentPacks.length * 5} generated formats
      </p>

      <div className="grid gap-3 xl:grid-cols-2">
        {isLoading && (
          <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6 text-sm text-[#a0a0a0]">
            <Loader2 className="mb-3 h-5 w-5 animate-spin text-[#c9a84c]" /> Loading saved content packs.
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6 text-sm text-[#a0a0a0]">
            No content packs yet. Click Generate from AI Update to create the first saved pack.
          </div>
        )}
        {filtered.map((pack) => (
          <button
            key={pack.id}
            className="group rounded-2xl border border-[#222222] bg-[#111111] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c9a84c]/60 hover:bg-[#141414]"
            onClick={() => setSelectedPackId(pack.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]">
                    {styleLabels[pack.style]}
                  </span>
                  {copiedPacks.includes(pack.id) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#22c55e]/10 px-2.5 py-1 text-[10px] font-semibold text-[#22c55e]">
                      <CheckCircle className="h-3 w-3" /> Copied
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-white">{pack.long_post.title}</h3>
              </div>
              <div className="rounded-full border border-[#222222] bg-[#0a0a0a] px-3 py-1 text-[11px] text-[#a0a0a0]">
                {pack.tool_name}
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#a0a0a0]">{pack.summary}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-[#222222] bg-[#0b0b0b] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#666666]">Impact</p>
                <p className="mt-1 text-lg font-semibold text-white">{pack.impact_score || 0}</p>
              </div>
              <div className="rounded-xl border border-[#222222] bg-[#0b0b0b] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#666666]">Story</p>
                <p className="mt-1 text-lg font-semibold text-white">{pack.story_score || 0}</p>
              </div>
              <div className="rounded-xl border border-[#222222] bg-[#0b0b0b] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#666666]">Formats</p>
                <p className="mt-1 text-lg font-semibold text-white">5</p>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-[#666666]">Source date: {pack.source_date || 'Verified in generation'}</p>
          </button>
        ))}
      </div>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-2xl border-[#2a2416] bg-[#0d0d0d] text-white">
          <DialogHeader>
            <DialogTitle>Generate from AI Update</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              The backend will find one real AI update from the last 14 days, create the pack, run checks, and save it.
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
              <label className="text-xs uppercase tracking-[0.18em] text-[#666666]">Source</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['llm', 'github', 'both'] as GenerationSource[]).map((item) => (
                  <Button
                    key={item}
                    variant="outline"
                    className={`rounded-xl border-[#222222] ${source === item ? 'bg-[#c9a84c] text-black hover:bg-[#d8ba62]' : 'bg-[#111111] text-[#a0a0a0]'}`}
                    onClick={() => setSource(item)}
                  >
                    {sourceLabels[item]}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-[#666666]">
                GitHub Trending pulls real AI and dev-tool repos from GitHub search. Both merges sources before scoring.
              </p>
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
