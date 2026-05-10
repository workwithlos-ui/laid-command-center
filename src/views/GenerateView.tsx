import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, ArrowRight, CheckCircle2, Clipboard, FileText, Instagram, KeyRound, Loader2, MessageSquareText, Sparkles, SquarePen, Video, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackDetailModal } from '@/components/PackDetailModal';
import { Toast } from '@/components/Toast';
import { generateContentPack } from '@/lib/contentGeneration';
import type { ContentPack, ContentStyle, GenerationProgress } from '@/data/types';
import { styleDescriptions, styleLabels } from '@/data/types';

const OPENAI_KEY = 'openai_api_key';
const PACKS_KEY = 'content-command-generated-packs';

const agents = [
  { key: 'strategizing', label: 'Strategy', icon: Sparkles },
  { key: 'finding', label: 'Research', icon: MessageSquareText },
  { key: 'filtering', label: 'Filter', icon: CheckCircle2 },
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

function readGeneratedPacks(): ContentPack[] {
  try {
    const raw = localStorage.getItem(PACKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGeneratedPacks(packs: ContentPack[]) {
  localStorage.setItem(PACKS_KEY, JSON.stringify(packs));
}

function mirrorPipelineSettings(apiKey: string, audience: string, style: ContentStyle) {
  const trimmedKey = apiKey.trim();
  localStorage.setItem(OPENAI_KEY, trimmedKey);
  localStorage.setItem('content_command_audience', audience);
  localStorage.setItem('content_command_default_style', style);

  const laidSettings = JSON.parse(localStorage.getItem('laid-settings') || '{}');
  localStorage.setItem('laid-settings', JSON.stringify({ ...laidSettings, openaiApiKey: trimmedKey, audience, defaultStyle: style }));

  const kimiSettings = JSON.parse(localStorage.getItem('ai-content-settings') || '{}');
  localStorage.setItem(
    'ai-content-settings',
    JSON.stringify({
      ...kimiSettings,
      audience,
      defaultStyle: style,
      apiKeys: { ...(kimiSettings.apiKeys || {}), openai: trimmedKey },
    })
  );
}

function packText(pack: ContentPack) {
  const longPostTitle = pack.long_post?.title || pack.tool_name || 'Content Sprint';
  const longPostBody = pack.long_post?.body_markdown || pack.summary || '';
  const thread = pack.x_thread?.tweets?.join('\n\n') || pack.x_thread?.hook || '';
  return `${longPostTitle}\n\n${longPostBody}\n\nX Thread:\n${thread}`;
}

export function GenerateView() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [theme, setTheme] = useState('AI updates that actually change workflow');
  const [customPrompt, setCustomPrompt] = useState('Create content from the latest AI update');
  const [audience, setAudience] = useState('500k–10M founders/operators');
  const [style, setStyle] = useState<ContentStyle>((localStorage.getItem('content_command_default_style') as ContentStyle) || 'ai_news');
  const [packs, setPacks] = useState<ContentPack[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [copiedPackId, setCopiedPackId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const refreshSettings = () => {
      setApiKey(localStorage.getItem(OPENAI_KEY) || '');
      setAudience(localStorage.getItem('content_command_audience') || '500k–10M founders/operators');
      setStyle(((localStorage.getItem('content_command_default_style') as ContentStyle) || 'ai_news'));
    };
    refreshSettings();
    const storedPacks = readGeneratedPacks();
    setPacks(storedPacks);
    setSelectedPackId(storedPacks[0]?.id || null);
    window.addEventListener('content-command-settings-updated', refreshSettings);
    return () => window.removeEventListener('content-command-settings-updated', refreshSettings);
  }, []);

  const selectedPack = useMemo(() => packs.find((pack) => pack.id === selectedPackId) || null, [packs, selectedPackId]);
  const activeIndex = agents.findIndex((agent) => agent.key === progress?.stage);
  const hasApiKey = apiKey.trim().length > 0;

  const persistPacks = (nextPacks: ContentPack[]) => {
    setPacks(nextPacks);
    saveGeneratedPacks(nextPacks);
  };

  const showToast = (message: string) => setToast(message);

  const handleGenerate = async () => {
    if (!hasApiKey) {
      showToast('Add your OpenAI API key in Settings to start generating');
      return;
    }

    if (!sourceUrl.trim() && !customPrompt.trim()) {
      showToast('Add a source URL or prompt first.');
      return;
    }

    setIsGenerating(true);
    setProgress({ stage: 'strategizing', message: 'Building the content strategy...' });
    mirrorPipelineSettings(apiKey, audience, style);

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
      const nextPacks = [pack, ...packs];
      persistPacks(nextPacks);
      setSelectedPackId(pack.id);
      setDetailOpen(true);
      setProgress({ stage: 'complete', message: 'Content sprint generated.', pack });
      showToast('Content sprint generated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed. Check your OpenAI API key and try again.';
      setProgress({ stage: 'error', message });
      showToast(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (pack: ContentPack) => {
    await navigator.clipboard.writeText(packText(pack));
    setCopiedPackId(pack.id);
    showToast('Pack copied.');
    setTimeout(() => setCopiedPackId(null), 1500);
  };

  const handleTogglePosted = (packId: string) => {
    const nextPacks = packs.map((pack) => (pack.id === packId ? { ...pack, posted: !pack.posted } : pack));
    persistPacks(nextPacks);
  };

  const handleDelete = (packId: string) => {
    const nextPacks = packs.filter((pack) => pack.id !== packId);
    persistPacks(nextPacks);
    setSelectedPackId(nextPacks[0]?.id || null);
    setDetailOpen(false);
    showToast('Content pack deleted.');
  };

  if (!hasApiKey) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
        <section className="w-full rounded-[28px] border border-white/[0.08] bg-[#101014]/88 p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl border border-[#A855F7]/35 bg-[#A855F7]/15 text-[#F8FAFC] shadow-[0_0_42px_rgba(168,85,247,0.26)]">
            <KeyRound className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-[#F8FAFC] md:text-5xl">Add your OpenAI API key in Settings to start generating</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#A1A1AA]">
            Content Command will only show real generated packs after your API key is saved. No placeholder mock content is displayed here.
          </p>
          <Button onClick={() => navigate('/settings')} className="mt-8 h-12 rounded-2xl bg-gradient-to-r from-[#A855F7] to-[#22D3EE] px-6 text-sm font-semibold text-white shadow-[0_0_34px_rgba(168,85,247,0.28)] hover:opacity-95">
            Go to Settings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
        <Toast message={toast} visible={Boolean(toast)} onClose={() => setToast('')} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="obsidian-card obsidian-glow rounded-[28px] p-5 md:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Generate</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#F8FAFC] md:text-5xl">Create content from the latest AI update</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#A1A1AA]">
              The six-agent pipeline turns one source, idea, or prompt into a premium content pack with platform-ready variations and a two-pass editor quality gate.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            OpenAI key connected
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

            <label className="mt-4 block text-xs font-medium text-[#A1A1AA]">Audience</label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} disabled={isGenerating} className="mt-2 h-12 rounded-2xl border-white/10 bg-white/[0.045] text-[#F8FAFC] focus-visible:ring-[#A855F7]/30" />

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

      {progress?.stage === 'error' && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4" />
          {progress.message}
        </div>
      )}

      {packs.length === 0 ? (
        <section className="rounded-[28px] border border-white/[0.08] bg-[#101014]/75 p-8 text-center">
          <h3 className="text-xl font-semibold text-[#F8FAFC]">No content packs yet.</h3>
          <p className="mt-2 text-sm text-[#A1A1AA]">Click Generate Content Sprint to create your first live six-agent content pack.</p>
        </section>
      ) : (
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
                  {copiedPackId === pack.id ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <Clipboard className="mr-1 h-3.5 w-3.5" />} Copy
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      <PackDetailModal pack={selectedPack} open={detailOpen} onOpenChange={setDetailOpen} onTogglePosted={handleTogglePosted} onDelete={handleDelete} />
      <Toast message={toast} visible={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
}
