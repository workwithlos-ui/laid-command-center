import { useMemo, useState } from 'react';
import { Check, Clipboard, FileText, Instagram, Loader2, MessageSquareText, RotateCcw, Sparkles, SquarePen, ThumbsDown, ThumbsUp, Video, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackDetailModal } from '@/components/PackDetailModal';
import { Toast } from '@/components/Toast';
import { useContentPacks } from '@/hooks/useContentPacks';
import { generateContentPack } from '@/lib/contentGeneration';
import { isUsingRealPipeline } from '@/lib/contentGeneration';
import type { ContentPack, ContentStyle, GenerationProgress, PackRating } from '@/data/types';
import { styleDescriptions, styleLabels } from '@/data/types';

const agents = [
  { key: 'strategizing', label: 'Strategy', icon: Sparkles },
  { key: 'finding', label: 'Research', icon: MessageSquareText },
  { key: 'filtering', label: 'Filter', icon: Check },
  { key: 'writing', label: 'Write', icon: SquarePen },
  { key: 'repurposing', label: 'Repurpose', icon: Instagram },
  { key: 'editing', label: 'Edit', icon: FileText },
];

const suggestions = [
  'Create content from the latest AI update that changes operator workflows',
  'Turn a new AI tool launch into a practical founder SOP',
  'Explain one repeatable automation for lead research and follow-up',
  'Build a content sprint around objections to AI adoption',
];

function packText(pack: ContentPack) {
  return `${pack.long_post.title}\n\n${pack.long_post.body_markdown}\n\nX Thread:\n${pack.x_thread.tweets.join('\n\n')}`;
}

export function GenerateView() {
  const { packs, addPack, updatePack, deletePack, togglePosted, resetToSamples } = useContentPacks();
  const [sourceUrl, setSourceUrl] = useState('');
  const [theme, setTheme] = useState('AI updates that actually change workflow');
  const [customPrompt, setCustomPrompt] = useState('Create content from the latest AI update');
  const [style, setStyle] = useState<ContentStyle>('ai_news');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(packs[0]?.id ?? null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [copiedPackId, setCopiedPackId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const selectedPack = useMemo(
    () => packs.find((pack) => pack.id === selectedPackId) || packs[0] || null,
    [packs, selectedPackId]
  );

  const activeIndex = agents.findIndex((agent) => agent.key === progress?.stage);
  const usingRealPipeline = isUsingRealPipeline();

  const showToast = (message: string) => setToast(message);

  const handleGenerate = async () => {
    if (!sourceUrl.trim() && !customPrompt.trim()) {
      showToast('Add a source URL or prompt first.');
      return;
    }

    setIsGenerating(true);
    setProgress({ stage: 'strategizing', message: 'Building the content strategy...' });

    try {
      const pack = await generateContentPack(
        {
          sourceUrl: sourceUrl.trim(),
          theme: theme.trim() || 'AI update',
          style,
          customPrompt: customPrompt.trim() || undefined,
        },
        setProgress
      );
      addPack(pack);
      setSelectedPackId(pack.id);
      setDetailOpen(true);
      setProgress({ stage: 'complete', message: 'Content sprint generated.', pack });
      showToast('Content sprint generated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed.';
      setProgress({ stage: 'error', message });
      showToast(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRate = (packId: string, rating: PackRating) => {
    updatePack(packId, { rating });
    showToast('Learning saved to brand memory.');
  };

  const handleCopy = async (pack: ContentPack) => {
    await navigator.clipboard.writeText(packText(pack));
    setCopiedPackId(pack.id);
    showToast('Pack copied.');
    setTimeout(() => setCopiedPackId(null), 1500);
  };

  return (
    <div className="space-y-8">
      <section className="obsidian-card obsidian-glow rounded-[28px] p-5 md:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Generate</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#F8FAFC] md:text-5xl">Create content from the latest AI update</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#A1A1AA]">
              The six-agent pipeline turns one source, idea, or prompt into a premium content pack with platform-ready variations and an editor quality pass.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-xs text-[#A1A1AA]">
            {usingRealPipeline ? 'Live six-agent pipeline' : 'Simulation mode until API key is added'}
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-white/10 bg-[#050508]/58 p-4">
            <label className="text-xs font-medium text-[#A1A1AA]">Source URL</label>
            <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} disabled={isGenerating} placeholder="https://openai.com/blog/..." className="mt-2 h-12 rounded-2xl border-white/10 bg-white/[0.045] text-[#F8FAFC] placeholder:text-[#71717A] focus-visible:ring-[#A855F7]/30" />
            <label className="mt-4 block text-xs font-medium text-[#A1A1AA]">Command prompt</label>
            <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} disabled={isGenerating} rows={5} className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-[#F8FAFC] outline-none transition focus:border-[#A855F7]/50 focus:ring-4 focus:ring-[#A855F7]/10" />
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#050508]/58 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-[#A1A1AA]">Style</label>
                <Select value={style} onValueChange={(value) => setStyle(value as ContentStyle)} disabled={isGenerating}>
                  <SelectTrigger className="mt-2 h-12 rounded-2xl border-white/10 bg-white/[0.045] text-[#F8FAFC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#171720] text-[#F8FAFC]">
                    {(Object.keys(styleLabels) as ContentStyle[]).map((item) => (
                      <SelectItem key={item} value={item} className="focus:bg-white/[0.06] focus:text-[#22D3EE]">
                        <div className="flex flex-col">
                          <span>{styleLabels[item]}</span>
                          <span className="text-[11px] text-[#71717A]">{styleDescriptions[item]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#A1A1AA]">Theme</label>
                <Input value={theme} onChange={(e) => setTheme(e.target.value)} disabled={isGenerating} className="mt-2 h-12 rounded-2xl border-white/10 bg-white/[0.045] text-[#F8FAFC] focus-visible:ring-[#A855F7]/30" />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#F8FAFC]">Six-agent progress</p>
                  <p className="mt-1 text-xs text-[#71717A]">{progress?.message || 'Ready to launch a sprint.'}</p>
                </div>
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-[#22D3EE]" />}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                {agents.map((agent, index) => {
                  const Icon = agent.icon;
                  const done = progress?.stage === 'complete' || (activeIndex >= 0 && index < activeIndex);
                  const active = index === activeIndex && isGenerating;
                  return (
                    <div key={agent.key} className="flex flex-1 items-center gap-2">
                      <div className={`relative flex size-10 items-center justify-center rounded-2xl border transition-all ${done ? 'border-[#22D3EE]/50 bg-[#22D3EE]/12 text-[#22D3EE]' : active ? 'border-[#A855F7]/70 bg-[#A855F7]/16 text-[#D8B4FE] shadow-[0_0_24px_rgba(168,85,247,0.24)]' : 'border-white/10 bg-white/[0.035] text-[#71717A]'}`} title={agent.label}>
                        <Icon className="h-4 w-4" />
                        <span className={`absolute -right-0.5 -top-0.5 size-2.5 rounded-full ${done ? 'bg-[#22D3EE]' : active ? 'bg-[#A855F7]' : 'bg-[#3f3f46]'}`} />
                      </div>
                      {index < agents.length - 1 && <div className="hidden h-px flex-1 bg-white/10 sm:block" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={handleGenerate} disabled={isGenerating} className="h-11 rounded-2xl bg-gradient-to-r from-[#A855F7] to-[#22D3EE] px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(168,85,247,0.24)] hover:opacity-95">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate Content Sprint
              </Button>
              <Button variant="outline" onClick={resetToSamples} className="h-11 rounded-2xl border-white/10 bg-white/[0.035] px-4 text-sm text-[#A1A1AA] hover:bg-white/[0.065] hover:text-[#F8FAFC]">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset samples
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button key={suggestion} onClick={() => setCustomPrompt(suggestion)} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-[#A1A1AA] transition hover:border-[#A855F7]/50 hover:text-[#F8FAFC]">
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packs.map((pack) => (
          <article key={pack.id} className="obsidian-elevated group rounded-[24px] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#A855F7]/35">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#71717A]">{pack.style.replace('_', ' ')}</div>
                <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 text-[#F8FAFC]">{pack.tool_name}</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-xs text-[#22D3EE]">
                {pack.critic_score || pack.quality_score || 86}
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#A1A1AA]">{pack.x_thread?.hook || pack.summary}</p>
            <div className="mt-5 flex items-center gap-2 text-[#71717A]">
              <FileText className="h-4 w-4" />
              <MessageSquareText className="h-4 w-4" />
              <Instagram className="h-4 w-4" />
              <Video className="h-4 w-4" />
              <span className="ml-auto text-xs">{new Date(pack.created_at).toLocaleDateString()}</span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button onClick={() => { setSelectedPackId(pack.id); setDetailOpen(true); }} className="h-9 rounded-xl bg-white/[0.07] px-3 text-xs text-[#F8FAFC] hover:bg-white/[0.1]">Open</Button>
              <Button variant="outline" onClick={() => handleCopy(pack)} className="h-9 rounded-xl border-white/10 bg-transparent px-3 text-xs text-[#A1A1AA] hover:bg-white/[0.06] hover:text-[#22D3EE]">
                {copiedPackId === pack.id ? <Check className="mr-1 h-3.5 w-3.5" /> : <Clipboard className="mr-1 h-3.5 w-3.5" />} Copy
              </Button>
              <button onClick={() => handleRate(pack.id, pack.rating === 'up' ? null : 'up')} className={`ml-auto rounded-xl p-2 ${pack.rating === 'up' ? 'bg-emerald-400/15 text-emerald-300' : 'text-[#71717A] hover:text-emerald-300'}`}><ThumbsUp className="h-4 w-4" /></button>
              <button onClick={() => handleRate(pack.id, pack.rating === 'down' ? null : 'down')} className={`rounded-xl p-2 ${pack.rating === 'down' ? 'bg-rose-400/15 text-rose-300' : 'text-[#71717A] hover:text-rose-300'}`}><ThumbsDown className="h-4 w-4" /></button>
              <button onClick={() => togglePosted(pack.id)} className="rounded-xl px-3 py-2 text-xs text-[#71717A] hover:text-[#F8FAFC]">{pack.posted ? 'Posted' : 'Queue'}</button>
            </div>
          </article>
        ))}
      </section>

      <PackDetailModal
        pack={selectedPack}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onTogglePosted={togglePosted}
        onDelete={(id) => {
          deletePack(id);
          setDetailOpen(false);
          showToast('Content pack deleted.');
        }}
      />
      <Toast message={toast} visible={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
}
