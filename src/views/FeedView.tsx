import { useMemo, useState } from 'react';
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { seedContentPacks } from '@/data/contentPacks';
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

const defaultSettings: CommandCenterSettings = {
  openaiApiKey: '',
  perplexityApiKey: '',
  audience: '$500k-$10M founders/operators',
  defaultStyle: 'ai_news',
};

function contentPackToText(pack: ContentPack, section: string) {
  if (section === 'long') return `${pack.long_post.title}\n\n${pack.long_post.body_markdown}`;
  if (section === 'x') return [pack.x_thread.hook, ...pack.x_thread.tweets].join('\n\n');
  if (section === 'ig') return `${pack.ig_caption.hook}\n\n${pack.ig_caption.body}\n\n${pack.ig_caption.cta}`;
  if (section === 'carousel') {
    return pack.carousel.slides
      .map((slide, index) => `${index + 1}. ${slide.title}\n${slide.bullets.map((bullet) => `• ${bullet}`).join('\n')}`)
      .join('\n\n');
  }
  return `${pack.short_script.title}\n\n${pack.short_script.beats.map((beat) => `• ${beat}`).join('\n')}`;
}

function updatePackSection(pack: ContentPack, section: string, value: string): ContentPack {
  if (section === 'long') {
    const [title = pack.long_post.title, ...bodyParts] = value.split('\n');
    return { ...pack, long_post: { title: title.trim() || pack.long_post.title, body_markdown: bodyParts.join('\n').trim() } };
  }
  if (section === 'x') {
    const parts = value.split('\n\n').map((item) => item.trim()).filter(Boolean);
    return { ...pack, x_thread: { hook: parts[0] || pack.x_thread.hook, tweets: parts.slice(1) } };
  }
  if (section === 'ig') {
    const parts = value.split('\n\n').map((item) => item.trim()).filter(Boolean);
    return {
      ...pack,
      ig_caption: {
        hook: parts[0] || pack.ig_caption.hook,
        body: parts.slice(1, -1).join('\n\n') || pack.ig_caption.body,
        cta: parts[parts.length - 1] || pack.ig_caption.cta,
      },
    };
  }
  if (section === 'carousel') {
    const slides = value
      .split('\n\n')
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block, index) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const title = (lines[0] || `Slide ${index + 1}`).replace(/^\d+\.\s*/, '');
        const bullets = lines.slice(1).map((line) => line.replace(/^•\s*/, '').trim()).filter(Boolean);
        return { title, bullets: bullets.length ? bullets : ['Add the key point', 'Add the proof or example'] };
      });
    return { ...pack, carousel: { slides: slides.length ? slides : pack.carousel.slides } };
  }
  if (section === 'script') {
    const lines = value.split('\n').map((item) => item.replace(/^•\s*/, '').trim()).filter(Boolean);
    return { ...pack, short_script: { title: lines[0] || pack.short_script.title, beats: lines.slice(1) } };
  }
  return pack;
}

export function FeedView() {
  const [contentPacks, setContentPacks] = useLocalStorage<ContentPack[]>('laid-content-packs', seedContentPacks);
  const [settings] = useLocalStorage<CommandCenterSettings>('laid-settings', defaultSettings);
  const [copiedPacks, setCopiedPacks] = useLocalStorage<string[]>('laid-copied-packs', []);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [theme, setTheme] = useState('AI tools for content creators');
  const [style, setStyle] = useState<ContentPack['style']>(settings.defaultStyle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '' });

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

  const handleCopy = (pack: ContentPack, section: string) => {
    navigator.clipboard.writeText(contentPackToText(pack, section));
    setCopiedPacks((prev) => (prev.includes(pack.id) ? prev : [...prev, pack.id]));
    showToast('Copied to clipboard.');
  };

  const handleUpdatePack = (pack: ContentPack) => {
    setContentPacks((prev) => prev.map((item) => (item.id === pack.id ? pack : item)));
  };

  const generatePack = async () => {
    setError('');
    const apiKey = settings.openaiApiKey || settings.perplexityApiKey;
    if (!apiKey) {
      setError('Add an OpenAI API key in Settings first. The key stays in localStorage and is sent only for generation.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-content-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          provider: settings.openaiApiKey ? 'openai' : 'perplexity',
          theme,
          style,
          audience: settings.audience || defaultSettings.audience,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Generation failed.');
      setContentPacks((prev) => [payload.contentPack, ...prev]);
      setSelectedPackId(payload.contentPack.id);
      setGenerateOpen(false);
      showToast('Content pack generated.');
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
              Turn real AI updates into a complete founder content pack.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#a0a0a0]">
              Find one useful tool update, score it for operator impact, write the long post, then repurpose it into X, Instagram, carousel, and script formats.
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

      <p className="text-[11px] uppercase tracking-[0.2em] text-[#666666]">
        {filtered.length} content packs, {contentPacks.length * 5} generated formats
      </p>

      <div className="grid gap-3 xl:grid-cols-2">
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
                <p className="mt-1 text-lg font-semibold text-white">{pack.impact_score || 88}</p>
              </div>
              <div className="rounded-xl border border-[#222222] bg-[#0b0b0b] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#666666]">Formats</p>
                <p className="mt-1 text-lg font-semibold text-white">5</p>
              </div>
              <div className="rounded-xl border border-[#222222] bg-[#0b0b0b] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#666666]">Audience</p>
                <p className="mt-1 truncate text-xs font-semibold text-white">{pack.audience}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#222222] pt-3 text-[11px] text-[#666666]">
              <span>{pack.theme}</span>
              <span className="text-[#c9a84c] opacity-0 transition-opacity group-hover:opacity-100">Open pack</span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-[#222222] bg-[#111111] py-12 text-center text-sm text-[#666666]">
          No content packs match your search.
        </div>
      )}

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="border-[#2a2416] bg-[#0d0d0d] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Generate from AI Update</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              Enter a theme. The pipeline finds recent AI updates, filters for operator value, then writes the pack.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#666666]">Theme</label>
              <Input
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                className="border-[#222222] bg-[#090909] text-white"
                placeholder="AI tools for content creators"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#666666]">Style</label>
              <select
                value={style}
                onChange={(event) => setStyle(event.target.value as ContentPack['style'])}
                className="h-10 w-full rounded-md border border-[#222222] bg-[#090909] px-3 text-sm text-white outline-none focus:border-[#c9a84c]"
              >
                <option value="ai_news">ai_news</option>
                <option value="workflow">workflow</option>
                <option value="system">system</option>
              </select>
            </div>
            {error && <p className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 p-3 text-xs text-[#fca5a5]">{error}</p>}
            <Button
              className="h-11 w-full rounded-full bg-[#c9a84c] text-sm font-semibold text-black hover:bg-[#d8ba62]"
              onClick={generatePack}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {isGenerating ? 'Generating pack...' : 'Run Content Pipeline'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPack} onOpenChange={(open) => !open && setSelectedPackId(null)}>
        {selectedPack && (
          <DialogContent className="max-h-[92vh] overflow-hidden border-[#2a2416] bg-[#0d0d0d] p-0 text-white sm:max-w-5xl">
            <div className="border-b border-[#222222] bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.14),transparent_36%),#0d0d0d] p-5">
              <DialogHeader>
                <DialogTitle className="text-2xl tracking-tight">{selectedPack.long_post.title}</DialogTitle>
                <DialogDescription className="text-[#a0a0a0]">
                  {selectedPack.tool_name} sourced from{' '}
                  <a className="text-[#c9a84c] underline-offset-4 hover:underline" href={selectedPack.source_url} target="_blank" rel="noreferrer">
                    original update <ExternalLink className="inline h-3 w-3" />
                  </a>
                </DialogDescription>
              </DialogHeader>
            </div>
            <Tabs defaultValue="long" className="flex min-h-0 flex-1 flex-col p-5">
              <TabsList className="mb-4 grid h-auto grid-cols-5 rounded-full border border-[#222222] bg-[#080808] p-1">
                <TabsTrigger value="long" className="rounded-full text-xs">Long Post</TabsTrigger>
                <TabsTrigger value="x" className="rounded-full text-xs">X Thread</TabsTrigger>
                <TabsTrigger value="ig" className="rounded-full text-xs">IG Caption</TabsTrigger>
                <TabsTrigger value="carousel" className="rounded-full text-xs">Carousel</TabsTrigger>
                <TabsTrigger value="script" className="rounded-full text-xs">Script</TabsTrigger>
              </TabsList>
              {['long', 'x', 'ig', 'carousel', 'script'].map((section) => (
                <TabsContent key={section} value={section} className="mt-0 min-h-0">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#666666]">Review, edit, or copy this section</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10"
                      onClick={() => handleCopy(selectedPack, section)}
                    >
                      <Copy className="mr-1 h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <Textarea
                    value={contentPackToText(selectedPack, section)}
                    onChange={(event) => handleUpdatePack(updatePackSection(selectedPack, section, event.target.value))}
                    className="min-h-[52vh] resize-none border-[#222222] bg-[#080808] font-mono text-xs leading-6 text-[#d7d7d7] focus-visible:ring-[#c9a84c]"
                  />
                </TabsContent>
              ))}
            </Tabs>
          </DialogContent>
        )}
      </Dialog>

      {toast.visible && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transform lg:bottom-8">
          <div className="flex items-center gap-2 rounded-full border border-[#c9a84c] bg-[#111111] px-4 py-3 shadow-lg">
            <span className="text-sm font-medium text-white">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
