import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, ArrowRight, CheckCircle2, Clipboard, FileText, Instagram, KeyRound, Loader2, MessageSquareText, Mic, Sparkles, SquarePen, Video, Wand2, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackDetailModal } from '@/components/PackDetailModal';
import { Toast } from '@/components/Toast';
import { generateContentPack } from '@/lib/contentGeneration';
import { buildAgentArtifacts } from '@/lib/agentArtifacts';
import { buildSourcePreparation } from '@/lib/sourceIntelligence';
import { recordLearnedRule, recordMemoryEvent } from '@/lib/warRoomMemory';
import { getActiveClientWorkspace } from '@/lib/clientWorkspace';
import type { AgentArtifact, ClientWorkspace, ContentBriefSummary, ContentPack, ContentStyle, GenerationInputMode, GenerationProgress, SourceIntelligenceSummary } from '@/data/types';
import { styleDescriptions, styleLabels } from '@/data/types';

const OPENAI_KEY = 'openai_api_key';
const PACKS_KEY = 'content-command-generated-packs';
const GENERATE_PREFILL_KEY = 'content-command-generate-prefill';

const agents = [
  { key: 'strategizing', label: 'Strategy', icon: Sparkles },
  { key: 'finding', label: 'Research', icon: MessageSquareText },
  { key: 'filtering', label: 'Filter', icon: CheckCircle2 },
  { key: 'writing', label: 'Write', icon: SquarePen },
  { key: 'repurposing', label: 'Repurpose', icon: Instagram },
  { key: 'editing', label: 'Edit', icon: FileText },
];

const inputModes: Array<{ key: GenerationInputMode; label: string; helper: string; icon: typeof Clipboard }> = [
  { key: 'paste_content', label: 'Paste Content', helper: 'Paste a post, article, transcript, notes, or raw idea.', icon: Clipboard },
  { key: 'youtube_url', label: 'YouTube URL', helper: 'Use a video link as the source for the content sprint.', icon: Youtube },
  { key: 'voice_record', label: 'Voice Record', helper: 'Paste a voice transcript for now. Recording can plug in next.', icon: Mic },
  { key: 'interview', label: 'Interview', helper: 'Drop Q&A notes or a rough founder interview.', icon: MessageSquareText },
];

const modeCopy: Record<GenerationInputMode, { label: string; placeholder: string; sourceLabel?: string; sourcePlaceholder?: string }> = {
  paste_content: {
    label: 'Paste content',
    placeholder: 'Paste raw material here: a post, newsletter, call notes, transcript, research notes, or a messy founder thought.',
  },
  youtube_url: {
    label: 'Context or instructions',
    placeholder: 'Optional: tell the agents what angle, audience, or offer this video should support.',
    sourceLabel: 'YouTube URL',
    sourcePlaceholder: 'https://youtube.com/watch?v=...',
  },
  voice_record: {
    label: 'Voice transcript',
    placeholder: 'Paste the transcript from a voice note. The agents will turn the messy thought into structured content.',
  },
  interview: {
    label: 'Interview notes',
    placeholder: 'Paste founder Q&A, client notes, objections, stories, or raw call takeaways.',
  },
};

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

function AgentArtifactGrid({ artifacts }: { artifacts: AgentArtifact[] }) {
  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-[#101014]/82 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Agent Outputs</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#F8FAFC]">What each agent produced</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-[#A1A1AA]">
          {artifacts.length} inspected stages
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {artifacts.map((artifact) => {
          const statusTone = artifact.status === 'error' ? 'border-rose-400/25 bg-rose-400/10 text-rose-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
          return (
            <article key={artifact.key} className="rounded-[22px] border border-white/10 bg-[#050508]/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#F8FAFC]">{artifact.name}</div>
                  <div className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${statusTone}`}>
                    {artifact.status}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#22D3EE]/25 bg-[#22D3EE]/10 px-3 py-2 text-center">
                  <div className="text-lg font-semibold text-[#67E8F9]">{artifact.score}</div>
                  <div className="text-[9px] uppercase tracking-[0.16em] text-[#71717A]">score</div>
                </div>
              </div>

              <p className="mt-4 min-h-16 text-sm leading-6 text-[#A1A1AA]">{artifact.produced}</p>

              <div className="mt-4 space-y-2">
                {artifact.details.slice(0, 3).map((detail) => (
                  <div key={`${artifact.key}-${detail.label}`} className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[#71717A]">{detail.label}</div>
                    <div className="mt-1 line-clamp-2 text-xs leading-5 text-[#F8FAFC]">{detail.value}</div>
                  </div>
                ))}
              </div>

              {(artifact.issuesCaught.length > 0 || artifact.recommendations.length > 0) && (
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {artifact.issuesCaught.slice(0, 2).map((issue) => (
                    <div key={`${artifact.key}-${issue}`} className="text-xs leading-5 text-[#F8C471]">{issue}</div>
                  ))}
                  {artifact.recommendations.slice(0, 1).map((recommendation) => (
                    <div key={`${artifact.key}-${recommendation}`} className="text-xs leading-5 text-[#71717A]">{recommendation}</div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SourceBriefPanel({
  sourceIntelligence,
  contentBrief,
  approved,
  onApprove,
  onRevoke,
}: {
  sourceIntelligence: SourceIntelligenceSummary;
  contentBrief: ContentBriefSummary;
  approved: boolean;
  onApprove: () => void;
  onRevoke: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-[#101014]/82 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Source Intelligence</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#F8FAFC]">Approve the brief before writing</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#A1A1AA]">
            The agents use this evidence map and brief as their operating context. If it looks weak, add more source material before generating.
          </p>
        </div>
        <Button
          onClick={approved ? onRevoke : onApprove}
          className={`h-11 rounded-2xl px-5 text-sm font-semibold ${
            approved
              ? 'border border-emerald-400/25 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15'
              : 'bg-gradient-to-r from-[#A855F7] to-[#22D3EE] text-white shadow-[0_0_34px_rgba(168,85,247,0.22)] hover:opacity-95'
          }`}
        >
          {approved ? 'Brief Approved' : 'Approve Brief'}
        </Button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[22px] border border-white/10 bg-[#050508]/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-[#F8FAFC]">Evidence map</h4>
            <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-xs text-[#A1A1AA]">{sourceIntelligence.sourceLength} chars</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="Claims" value={String(sourceIntelligence.exactClaims.length)} />
            <Metric label="Proof" value={String(sourceIntelligence.proofSnippets.length)} />
            <Metric label="Links" value={String(sourceIntelligence.primaryLinks.length)} />
            <Metric label="Risks" value={String(sourceIntelligence.riskFlags.length)} />
          </div>
          <div className="mt-4 space-y-2">
            {sourceIntelligence.proofSnippets.slice(0, 3).map((proof) => (
              <div key={proof} className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs leading-5 text-[#A1A1AA]">{proof}</div>
            ))}
            {!sourceIntelligence.proofSnippets.length && (
              <div className="rounded-2xl border border-[#F8C471]/20 bg-[#F8C471]/10 px-3 py-2 text-xs leading-5 text-[#F8C471]">No strong proof snippets found yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-[#050508]/70 p-4">
          <h4 className="text-sm font-semibold text-[#F8FAFC]">Content brief</h4>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <BriefItem label="Angle" value={contentBrief.angle} />
            <BriefItem label="Audience" value={contentBrief.targetAudience} />
            <BriefItem label="Hook promise" value={contentBrief.hookPromise} />
            <BriefItem label="CTA" value={contentBrief.cta} />
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[#71717A]">Structure</div>
            <ol className="mt-2 space-y-1 text-xs leading-5 text-[#A1A1AA]">
              {contentBrief.contentStructure.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
            </ol>
          </div>
          {contentBrief.riskFlags.length > 0 && (
            <div className="mt-4 space-y-2">
              {contentBrief.riskFlags.map((risk) => (
                <div key={risk} className="rounded-2xl border border-[#F8C471]/20 bg-[#F8C471]/10 px-3 py-2 text-xs leading-5 text-[#F8C471]">{risk}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[#71717A]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[#F8FAFC]">{value}</div>
    </div>
  );
}

function BriefItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[#71717A]">{label}</div>
      <div className="mt-1 line-clamp-3 text-xs leading-5 text-[#F8FAFC]">{value}</div>
    </div>
  );
}

export function GenerateView() {
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState<GenerationInputMode>('paste_content');
  const [apiKey, setApiKey] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [theme, setTheme] = useState('AI updates that actually change workflow');
  const [customPrompt, setCustomPrompt] = useState('');
  const [audience, setAudience] = useState('500k–10M founders/operators');
  const [style, setStyle] = useState<ContentStyle>((localStorage.getItem('content_command_default_style') as ContentStyle) || 'ai_news');
  const [packs, setPacks] = useState<ContentPack[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [copiedPackId, setCopiedPackId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [approvedBriefKey, setApprovedBriefKey] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<ClientWorkspace>(() => getActiveClientWorkspace());

  useEffect(() => {
    const refreshSettings = () => {
      const workspace = getActiveClientWorkspace();
      setActiveWorkspace(workspace);
      setApiKey(localStorage.getItem(OPENAI_KEY) || '');
      setAudience(workspace.audience || localStorage.getItem('content_command_audience') || '500k-10M founders/operators');
      setStyle(((localStorage.getItem('content_command_default_style') as ContentStyle) || 'ai_news'));
    };
    refreshSettings();
    const storedPacks = readGeneratedPacks();
    const hydratedPacks = storedPacks.map((pack) => {
      if (pack.agent_outputs?.length) return pack;
      return {
        ...pack,
        agent_outputs: buildAgentArtifacts(
          { sourceUrl: pack.source_url, theme: pack.theme, style: pack.style, inputMode: 'paste_content', customPrompt: pack.summary, sourceContent: pack.summary },
          pack
        ),
      };
    });
    if (hydratedPacks.some((pack, index) => pack !== storedPacks[index])) saveGeneratedPacks(hydratedPacks);
    setPacks(hydratedPacks);
    setSelectedPackId(hydratedPacks[0]?.id || null);
    const prefillRaw = localStorage.getItem(GENERATE_PREFILL_KEY);
    if (prefillRaw) {
      try {
        const prefill = JSON.parse(prefillRaw) as { source?: string; theme?: string };
        if (prefill.source) {
          setInputMode('paste_content');
          setCustomPrompt(prefill.source);
        }
        if (prefill.theme) setTheme(prefill.theme);
      } catch {
        // ignore broken handoff data
      }
      localStorage.removeItem(GENERATE_PREFILL_KEY);
    }
    window.addEventListener('content-command-settings-updated', refreshSettings);
    window.addEventListener('content-command-workspace-updated', refreshSettings);
    return () => {
      window.removeEventListener('content-command-settings-updated', refreshSettings);
      window.removeEventListener('content-command-workspace-updated', refreshSettings);
    };
  }, []);

  const selectedPack = useMemo(() => packs.find((pack) => pack.id === selectedPackId) || null, [packs, selectedPackId]);
  const activeIndex = agents.findIndex((agent) => agent.key === progress?.stage);
  const hasApiKey = apiKey.trim().length > 0;
  const activeMode = modeCopy[inputMode];
  const currentRequest = useMemo(
    () => ({
      sourceUrl: inputMode === 'youtube_url' ? sourceUrl.trim() : '',
      theme: theme.trim() || 'AI update',
      style,
      inputMode,
      clientWorkspace: activeWorkspace,
      customPrompt: customPrompt.trim() || undefined,
      sourceContent: inputMode === 'paste_content' ? customPrompt.trim() : undefined,
      voiceTranscript: inputMode === 'voice_record' ? customPrompt.trim() : undefined,
      interviewNotes: inputMode === 'interview' ? customPrompt.trim() : undefined,
    }),
    [activeWorkspace, customPrompt, inputMode, sourceUrl, style, theme]
  );
  const hasSourceInput = inputMode === 'youtube_url' ? Boolean(sourceUrl.trim()) : Boolean(customPrompt.trim());
  const sourcePreparation = useMemo(
    () => (hasSourceInput ? buildSourcePreparation(currentRequest, audience) : null),
    [audience, currentRequest, hasSourceInput]
  );
  const briefKey = JSON.stringify({ currentRequest, audience });
  const briefApproved = approvedBriefKey === briefKey;

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

    if (inputMode === 'youtube_url' && !sourceUrl.trim()) {
      showToast('Add a YouTube URL first.');
      return;
    }

    if (inputMode !== 'youtube_url' && !customPrompt.trim()) {
      showToast('Paste source material first.');
      return;
    }

    if (!sourcePreparation || !briefApproved) {
      showToast('Approve the source brief before generating.');
      return;
    }

    setIsGenerating(true);
    setProgress({ stage: 'strategizing', message: 'Building the content strategy...' });
    mirrorPipelineSettings(apiKey, audience, style);

    try {
      const pack = await generateContentPack(
        {
          ...currentRequest,
          sourceIntelligence: sourcePreparation.sourceIntelligence,
          approvedBrief: { ...sourcePreparation.contentBrief, approvedAt: new Date().toISOString() },
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
    recordMemoryEvent('pack_copied', { packId: pack.id, label: pack.tool_name });
    recordLearnedRule(`User copied ${pack.tool_name}. Prefer this angle and format pattern when similar source material appears.`, 'copy');
    setCopiedPackId(pack.id);
    showToast('Pack copied.');
    setTimeout(() => setCopiedPackId(null), 1500);
  };

  const handleTogglePosted = (packId: string) => {
    const nextPacks = packs.map((pack) => (pack.id === packId ? { ...pack, posted: !pack.posted } : pack));
    recordMemoryEvent('posted_toggled', { packId });
    persistPacks(nextPacks);
  };

  const handleUpdatePack = (updatedPack: ContentPack) => {
    const nextPacks = packs.map((pack) => (pack.id === updatedPack.id ? updatedPack : pack));
    persistPacks(nextPacks);
    setSelectedPackId(updatedPack.id);
    showToast('Pack updated.');
  };

  const handleDelete = (packId: string) => {
    const nextPacks = packs.filter((pack) => pack.id !== packId);
    recordMemoryEvent('pack_deleted', { packId });
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
              Paste raw material, add a YouTube source, drop a voice transcript, or run interview notes through the agent system. Active client: <span className="font-medium text-[#F8FAFC]">{activeWorkspace.name}</span>.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              OpenAI key connected
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-xs text-[#A1A1AA]">
              {activeWorkspace.industry || 'Client workspace ready'}
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-2 rounded-[24px] border border-white/10 bg-[#050508]/58 p-2 sm:grid-cols-4">
          {inputModes.map((mode) => {
            const Icon = mode.icon;
            const active = inputMode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => setInputMode(mode.key)}
                className={`flex min-h-24 flex-col items-start gap-2 rounded-[18px] border p-4 text-left transition ${
                  active
                    ? 'border-[#22D3EE]/35 bg-[#22D3EE]/10 text-[#F8FAFC] shadow-[0_0_34px_rgba(34,211,238,0.12)]'
                    : 'border-transparent bg-white/[0.025] text-[#A1A1AA] hover:border-white/10 hover:bg-white/[0.045] hover:text-[#F8FAFC]'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-[#22D3EE]' : 'text-[#71717A]'}`} />
                <span className="text-sm font-semibold">{mode.label}</span>
                <span className="text-xs leading-5 text-[#71717A]">{mode.helper}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-white/10 bg-[#050508]/58 p-4">
            {activeMode.sourceLabel && (
              <>
                <label className="text-xs font-medium text-[#A1A1AA]">{activeMode.sourceLabel}</label>
                <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} disabled={isGenerating} placeholder={activeMode.sourcePlaceholder} className="mt-2 h-12 rounded-2xl border-white/10 bg-white/[0.045] text-[#F8FAFC] placeholder:text-[#71717A] focus-visible:ring-[#A855F7]/30" />
              </>
            )}
            <label className={`${activeMode.sourceLabel ? 'mt-4' : ''} block text-xs font-medium text-[#A1A1AA]`}>{activeMode.label}</label>
            <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} disabled={isGenerating} rows={activeMode.sourceLabel ? 5 : 8} placeholder={activeMode.placeholder} className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-[#F8FAFC] outline-none transition placeholder:text-[#71717A] focus:border-[#A855F7]/50 focus:ring-4 focus:ring-[#A855F7]/10" />
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
                  <p className="text-xs font-medium text-[#F8FAFC]">Agent progress</p>
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
              <Button onClick={handleGenerate} disabled={isGenerating || !briefApproved} className="h-11 rounded-2xl bg-gradient-to-r from-[#A855F7] to-[#22D3EE] px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(168,85,247,0.24)] hover:opacity-95 disabled:opacity-45">
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

      {sourcePreparation && (
        <SourceBriefPanel
          sourceIntelligence={sourcePreparation.sourceIntelligence}
          contentBrief={sourcePreparation.contentBrief}
          approved={briefApproved}
          onApprove={() => {
            setApprovedBriefKey(briefKey);
            recordMemoryEvent('brief_approved', { label: sourcePreparation.contentBrief.angle, detail: sourcePreparation.contentBrief.hookPromise });
            recordLearnedRule(`Approved brief angle: ${sourcePreparation.contentBrief.angle}`, 'brief_approval');
          }}
          onRevoke={() => setApprovedBriefKey(null)}
        />
      )}

      {selectedPack?.agent_outputs?.length ? <AgentArtifactGrid artifacts={selectedPack.agent_outputs} /> : null}

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
                <Button onClick={() => { setSelectedPackId(pack.id); setDetailOpen(true); recordMemoryEvent('pack_opened', { packId: pack.id, label: pack.tool_name }); }} className="h-9 rounded-xl bg-white/[0.07] px-3 text-xs text-[#F8FAFC] hover:bg-white/[0.1]">Open</Button>
                <Button variant="outline" onClick={() => handleCopy(pack)} className="h-9 rounded-xl border-white/10 bg-transparent px-3 text-xs text-[#A1A1AA] hover:bg-white/[0.06] hover:text-[#22D3EE]">
                  {copiedPackId === pack.id ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <Clipboard className="mr-1 h-3.5 w-3.5" />} Copy
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      <PackDetailModal pack={selectedPack} open={detailOpen} onOpenChange={setDetailOpen} onTogglePosted={handleTogglePosted} onDelete={handleDelete} onUpdatePack={handleUpdatePack} />
      <Toast message={toast} visible={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
}
