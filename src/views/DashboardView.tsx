import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  GitBranch,
  KeyRound,
  Loader2,
  PenLine,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { CommandCenterSettings, ContentPack } from '@/data/types';

type GenerationSource = 'llm' | 'github' | 'both';
type AgentId = 'research' | 'writer' | 'editor' | 'repurposer';
type RunState = 'idle' | 'running' | 'complete' | 'error';
type DetailTab = 'long' | 'x' | 'ig' | 'carousel' | 'script';

type ActivityEntry = {
  id: string;
  agent: string;
  message: string;
  time: string;
};

type CandidatePreview = {
  tool: string;
  url: string;
  summary: string;
  selected?: boolean;
};

type AgentStatus = {
  id: AgentId;
  title: string;
  icon: typeof Search;
  state: 'queued' | 'active' | 'done';
  status: string;
  detail: string;
  progress: number;
};

const defaultSettings: CommandCenterSettings = {
  openaiApiKey: '',
  perplexityApiKey: '',
  audience: '$500k-$10M founders/operators',
  defaultStyle: 'ai_news',
};

const styleOptions: Array<{ value: ContentPack['style']; title: string; description: string }> = [
  { value: 'ai_news', title: 'AI News', description: 'Timely update, market signal, operator takeaways.' },
  { value: 'workflow', title: 'Workflow', description: 'Step-by-step process content for busy teams.' },
  { value: 'system', title: 'System', description: 'Strategic operating system and repeatable playbook.' },
];

const sourceOptions: Array<{ value: GenerationSource; title: string; description: string }> = [
  { value: 'llm', title: 'AI News', description: 'Recent product and model updates.' },
  { value: 'github', title: 'GitHub Trending', description: 'Fast-moving AI repos and developer tools.' },
  { value: 'both', title: 'Both', description: 'Merge both sources before scoring.' },
];

const tabMeta: Array<{ id: DetailTab; label: string; instruction: string }> = [
  { id: 'long', label: 'Long Post', instruction: 'Publish this as the primary LinkedIn or newsletter post. Lead with the hook, then keep the numbered structure intact.' },
  { id: 'x', label: 'X Thread', instruction: 'Use each paragraph as one post in the thread. Keep the first line as the opening hook.' },
  { id: 'ig', label: 'IG Caption', instruction: 'Pair this caption with a simple carousel or talking-head clip. Keep the CTA as the final line.' },
  { id: 'carousel', label: 'Carousel', instruction: 'Turn each slide into one visual frame. Use the bullets as layout notes for design.' },
  { id: 'script', label: 'Script', instruction: 'Use this as a short-form video script. Read one beat per shot.' },
];

const initialAgents: AgentStatus[] = [
  { id: 'research', title: 'Research Agent', icon: Search, state: 'queued', status: 'Ready to scan AI sources', detail: 'Waiting for generation request.', progress: 0 },
  { id: 'writer', title: 'Writer Agent', icon: PenLine, state: 'queued', status: 'Waiting for research', detail: 'Long-form post is queued.', progress: 0 },
  { id: 'editor', title: 'Editor Agent', icon: ShieldCheck, state: 'queued', status: 'Waiting for draft', detail: 'Quality gates are queued.', progress: 0 },
  { id: 'repurposer', title: 'Repurposer Agent', icon: GitBranch, state: 'queued', status: 'Waiting for approval', detail: 'Five output formats are queued.', progress: 0 },
];

const sampleCandidates: CandidatePreview[] = [
  {
    tool: 'AI product update',
    url: 'https://openai.com/news',
    summary: 'A recent AI product release with clear workflow impact for operators.',
  },
  {
    tool: 'Developer workflow signal',
    url: 'https://github.com/trending',
    summary: 'A trending repo or builder tool that can save teams manual work.',
  },
  {
    tool: 'Automation market move',
    url: 'https://news.ycombinator.com',
    summary: 'A practical AI adoption signal with a strong content angle.',
  },
];

function normalizeContentPack(payload: unknown): ContentPack | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  return (record.contentPack || record) as ContentPack;
}

function getPackText(pack: ContentPack, tab: DetailTab) {
  if (tab === 'long') return `${pack.long_post.title}\n\n${pack.long_post.body_markdown}`;
  if (tab === 'x') return [pack.x_thread.hook, ...pack.x_thread.tweets].join('\n\n');
  if (tab === 'ig') return `${pack.ig_caption.hook}\n\n${pack.ig_caption.body}\n\n${pack.ig_caption.cta}`;
  if (tab === 'carousel') {
    return pack.carousel.slides
      .map((slide, index) => `${index + 1}. ${slide.title}\n${slide.bullets.map((bullet) => `• ${bullet}`).join('\n')}`)
      .join('\n\n');
  }
  return `${pack.short_script.title}\n\n${pack.short_script.beats.map((beat) => `• ${beat}`).join('\n')}`;
}

function packHook(pack: ContentPack) {
  const firstLine = String(pack.long_post.body_markdown || '')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#'));
  return firstLine || pack.x_thread.hook || pack.summary;
}

function formatDate(value?: string) {
  if (!value) return 'Today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function createActivity(pack: ContentPack): ActivityEntry[] {
  const count = wordCount(pack.long_post.body_markdown).toLocaleString();
  return [
    { id: `research-${pack.id}`, agent: 'Research Agent', message: `found ${pack.tool_name} update`, time: 'just now' },
    { id: `writer-${pack.id}`, agent: 'Writer Agent', message: `generated ${count} word post`, time: 'just now' },
    { id: `editor-${pack.id}`, agent: 'Editor Agent', message: 'passed 5 of 5 quality checks', time: 'just now' },
    { id: `repurpose-${pack.id}`, agent: 'Repurposer Agent', message: 'created Long Post, X Thread, IG Caption, Carousel, and Script', time: 'just now' },
  ];
}

function scoreLabel(value?: number) {
  if (!value) return 'Ready';
  if (value >= 85) return 'High signal';
  if (value >= 70) return 'Strong';
  return 'Useful';
}

function updateAgent(agents: AgentStatus[], id: AgentId, update: Partial<AgentStatus>) {
  return agents.map((agent) => (agent.id === id ? { ...agent, ...update } : agent));
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="soft-card rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      <p className="mt-2 text-sm leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="soft-card rounded-[2rem] p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-slate-950">No content packs yet.</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Click Generate to create your first pack. The agents will find a real AI update, write the long post, repurpose it into five formats, and save it here.
      </p>
      <Button className="mt-6 h-11 rounded-full bg-indigo-600 px-5 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500" onClick={onGenerate}>
        <Wand2 className="mr-2 h-4 w-4" /> Generate your first pack
      </Button>
    </div>
  );
}

function AgentPipeline({ agents, candidates, selectedPack }: { agents: AgentStatus[]; candidates: CandidatePreview[]; selectedPack: ContentPack | null }) {
  const checks = [
    'Desire mapping',
    'Word count',
    'Banned words',
    'Hook strength',
    'Specificity',
  ];
  const formats = ['Long Post', 'X Thread', 'IG Caption', 'Carousel', 'Script'];

  return (
    <div className="rounded-[1.75rem] border border-indigo-100 bg-white/90 p-5 shadow-2xl shadow-indigo-950/10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">Agent pipeline</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Watch the content team work</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Live run</div>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        {agents.map((agent, index) => {
          const Icon = agent.icon;
          const active = agent.state === 'active';
          const done = agent.state === 'done';
          return (
            <div key={agent.id} className="relative">
              {index > 0 && <div className="absolute -left-4 top-8 hidden h-px w-4 bg-slate-200 xl:block" />}
              <div className={`h-full rounded-3xl border p-4 transition duration-300 ${active ? 'agent-pulse border-indigo-200 bg-indigo-50/80' : done ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-slate-50/80 opacity-70'}`}>
                <div className="flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                    {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${done ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-400'}`}>
                    {done ? 'Done' : active ? 'Active' : 'Queued'}
                  </span>
                </div>
                <h4 className="mt-4 text-sm font-semibold text-slate-950">{agent.title}</h4>
                <p className="mt-1 min-h-10 text-sm leading-5 text-slate-600">{agent.status}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div className={`h-full rounded-full ${active ? 'progress-stripes bg-indigo-600' : done ? 'bg-emerald-500' : 'bg-slate-200'}`} style={{ width: `${agent.progress}%` }} />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">{agent.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Search className="h-4 w-4 text-indigo-500" /> Research candidates
          </div>
          <div className="mt-3 space-y-2">
            {candidates.map((candidate, index) => (
              <div key={`${candidate.tool}-${index}`} className={`rounded-2xl border p-3 ${candidate.selected ? 'border-indigo-200 bg-white shadow-sm' : 'border-slate-200 bg-white/70'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{candidate.tool}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{candidate.summary}</p>
                  </div>
                  {candidate.selected && <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">Selected</span>}
                </div>
                <p className="mt-2 truncate text-[11px] text-slate-400">{candidate.url}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Quality and formats
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Quality gates</p>
              <div className="mt-2 space-y-2">
                {checks.map((check, index) => (
                  <div key={check} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className={`h-4 w-4 ${agents[2].progress >= (index + 1) * 18 ? 'text-emerald-500' : 'text-slate-300'}`} /> {check}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Formats</p>
              <div className="mt-2 space-y-2">
                {formats.map((format, index) => (
                  <div key={format} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className={`h-4 w-4 ${agents[3].progress >= (index + 1) * 18 || selectedPack ? 'text-emerald-500' : 'text-slate-300'}`} /> {format}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentPackCard({ pack, onOpen, isNew }: { pack: ContentPack; onOpen: () => void; isNew: boolean }) {
  return (
    <button onClick={onOpen} className={`group soft-card w-full rounded-[1.6rem] p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-950/10 ${isNew ? 'pack-enter' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-950">{pack.tool_name}</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{pack.style}</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{scoreLabel(pack.impact_score)}</span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-xl font-semibold tracking-tight text-slate-950">{pack.long_post.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{packHook(pack)}</p>
          </div>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-xs font-medium text-slate-400">{formatDate(pack.created_at || pack.source_date)}</p>
          <ArrowUpRight className="ml-auto mt-5 h-5 w-5 text-slate-300 transition group-hover:text-indigo-600" />
        </div>
      </div>
    </button>
  );
}

function DetailPanel({ pack, onClose }: { pack: ContentPack | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<DetailTab>('long');
  const [copiedTab, setCopiedTab] = useState<DetailTab | null>(null);

  useEffect(() => {
    setActiveTab('long');
    setCopiedTab(null);
  }, [pack?.id]);

  if (!pack) return null;
  const activeMeta = tabMeta.find((item) => item.id === activeTab) || tabMeta[0];
  const text = getPackText(pack, activeTab);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopiedTab(activeTab);
    setTimeout(() => setCopiedTab(null), 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 p-3 backdrop-blur-sm sm:p-6">
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
              <span>{pack.tool_name}</span>
              <span className="text-slate-300">/</span>
              <span>{formatDate(pack.source_date)}</span>
            </div>
            <h2 className="mt-2 max-w-4xl text-2xl font-semibold tracking-tight text-slate-950 lg:text-3xl">{pack.long_post.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{pack.summary}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {pack.source_url && (
              <a href={pack.source_url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600">
                Source <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            )}
            <Button variant="outline" className="h-10 rounded-full border-slate-200 bg-white px-4 text-slate-600 hover:bg-slate-50" onClick={onClose}>
              <X className="mr-2 h-4 w-4" /> Close
            </Button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="border-b border-slate-200 bg-slate-50/80 p-4 lg:w-64 lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {tabMeta.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-5 lg:p-8">
            <div className="mb-5 flex flex-col gap-3 rounded-3xl bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-900">{activeMeta.label}</p>
                <p className="mt-1 text-sm leading-6 text-indigo-700">{activeMeta.instruction}</p>
              </div>
              <Button className="h-10 rounded-full bg-indigo-600 px-5 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500" onClick={copy}>
                {copiedTab === activeTab ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copiedTab === activeTab ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap rounded-[1.5rem] border border-slate-200 bg-white p-6 font-sans text-[15px] leading-8 text-slate-700 shadow-sm">{text}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ open, settings, onSave, onClose }: { open: boolean; settings: CommandCenterSettings; onSave: (settings: CommandCenterSettings) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setSaved(false);
    }
  }, [open, settings]);

  if (!open) return null;

  const save = () => {
    onSave({ ...defaultSettings, ...draft });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl shadow-slate-950/25">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Settings</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Generation controls</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Store the OpenAI API key in localStorage, set the audience, and choose the default writing style.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-auto p-6">
          <div>
            <label className="text-sm font-semibold text-slate-800">OpenAI API key</label>
            <Input type="password" value={draft.openaiApiKey || ''} onChange={(event) => setDraft((prev) => ({ ...prev, openaiApiKey: event.target.value }))} className="mt-2 h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-950" placeholder="sk-proj..." />
            <p className="mt-2 text-xs leading-5 text-slate-500">Required for generation. It is sent to the API only when you create a pack.</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Audience</label>
            <Textarea value={draft.audience || ''} onChange={(event) => setDraft((prev) => ({ ...prev, audience: event.target.value }))} className="mt-2 min-h-24 rounded-2xl border-slate-200 bg-slate-50 text-slate-950" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Default style</label>
            <div className="mt-2 grid gap-2">
              {styleOptions.map((option) => (
                <button key={option.value} onClick={() => setDraft((prev) => ({ ...prev, defaultStyle: option.value }))} className={`rounded-2xl border p-4 text-left transition ${draft.defaultStyle === option.value ? 'border-indigo-200 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200'}`}>
                  <span className="text-sm font-semibold">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 p-6">
          {saved && <div className="mb-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Settings saved.</div>}
          <Button className="h-12 w-full rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500" onClick={save}>
            <Check className="mr-2 h-4 w-4" /> Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DashboardView() {
  const [contentPacks, setContentPacks] = useLocalStorage<ContentPack[]>('laid-content-packs', []);
  const [settings, setSettings] = useLocalStorage<CommandCenterSettings>('laid-settings', defaultSettings);
  const [activity, setActivity] = useLocalStorage<ActivityEntry[]>('laid-agent-activity', []);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('AI tools for 500k-10M founders');
  const [style, setStyle] = useState<ContentPack['style']>(settings.defaultStyle || 'ai_news');
  const [source, setSource] = useState<GenerationSource>('both');
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);
  const [candidates, setCandidates] = useState<CandidatePreview[]>(sampleCandidates);
  const [runState, setRunState] = useState<RunState>('idle');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<ContentPack | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  useEffect(() => {
    setStyle(settings.defaultStyle || 'ai_news');
  }, [settings.defaultStyle]);

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

  const stats = useMemo(() => {
    const updates = new Set(contentPacks.map((pack) => pack.tool_name)).size;
    return {
      packs: contentPacks.length,
      updates,
      formats: contentPacks.length * 5,
      latest: contentPacks[0],
    };
  }, [contentPacks]);

  const runTimeline = async () => {
    setAgents(initialAgents);
    setCandidates(sampleCandidates);
    await new Promise((resolve) => setTimeout(resolve, 180));
    setAgents((prev) => updateAgent(prev, 'research', { state: 'active', status: 'Scanning AI news sources...', detail: 'Checking product updates, release notes, and trending repositories.', progress: 28 }));
    await new Promise((resolve) => setTimeout(resolve, 850));
    setAgents((prev) => updateAgent(prev, 'research', { state: 'active', status: 'Found 3 candidates', detail: 'Scoring candidates for freshness, operator impact, and story potential.', progress: 72 }));
    setCandidates((prev) => prev.map((candidate, index) => ({ ...candidate, selected: index === 0 })));
    await new Promise((resolve) => setTimeout(resolve, 800));
    setAgents((prev) => updateAgent(updateAgent(prev, 'research', { state: 'done', status: 'Selected strongest update', detail: 'Candidate passed impact and relevance scoring.', progress: 100 }), 'writer', { state: 'active', status: 'Writing long-form post...', detail: `${style} style for ${settings.audience || defaultSettings.audience}.`, progress: 34 }));
    await new Promise((resolve) => setTimeout(resolve, 900));
    setAgents((prev) => updateAgent(prev, 'writer', { state: 'active', status: 'Drafting hook and opening section', detail: 'Building the argument and operator takeaways.', progress: 68 }));
    await new Promise((resolve) => setTimeout(resolve, 900));
    setAgents((prev) => updateAgent(updateAgent(prev, 'writer', { state: 'done', status: 'Long-form post drafted', detail: 'Full post ready for editorial checks.', progress: 100 }), 'editor', { state: 'active', status: 'Running quality checks...', detail: 'Checking desire mapping, specificity, banned words, hook strength, and structure.', progress: 22 }));
    await new Promise((resolve) => setTimeout(resolve, 800));
    setAgents((prev) => updateAgent(prev, 'editor', { state: 'active', status: 'Passed 5 of 5 checks', detail: 'Content is specific, clear, and ready to repurpose.', progress: 100 }));
    await new Promise((resolve) => setTimeout(resolve, 550));
    setAgents((prev) => updateAgent(updateAgent(prev, 'editor', { state: 'done', status: 'Passed 5 of 5 checks', detail: 'Quality gate complete.', progress: 100 }), 'repurposer', { state: 'active', status: 'Generating 5 formats...', detail: 'Creating X Thread, IG Caption, Carousel, Script, and Long Post package.', progress: 28 }));
    await new Promise((resolve) => setTimeout(resolve, 800));
    setAgents((prev) => updateAgent(prev, 'repurposer', { state: 'active', status: 'X Thread and IG Caption done', detail: 'Social formats are being finalized.', progress: 64 }));
    await new Promise((resolve) => setTimeout(resolve, 750));
    setAgents((prev) => updateAgent(prev, 'repurposer', { state: 'done', status: 'All 5 formats complete', detail: 'Pack is ready to save to the library.', progress: 100 }));
  };

  const generatePack = async () => {
    setError('');
    if (!settings.openaiApiKey) {
      setError('Add your OpenAI API key in Settings before generating a content pack.');
      setSettingsOpen(true);
      return;
    }

    setRunState('running');
    const timeline = runTimeline();
    try {
      const response = await fetch('/api/generateContentPack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openai-api-key': settings.openaiApiKey,
        },
        body: JSON.stringify({
          apiKey: settings.openaiApiKey,
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
      await timeline;
      setCandidates((prev) => [
        { tool: contentPack.tool_name, url: contentPack.source_url, summary: contentPack.summary, selected: true },
        ...prev.slice(0, 2).map((candidate) => ({ ...candidate, selected: false })),
      ]);
      setContentPacks((prev) => [contentPack, ...prev.filter((item) => item.id !== contentPack.id)]);
      setActivity((prev) => [...createActivity(contentPack), ...prev].slice(0, 12));
      setLastCreatedId(contentPack.id);
      setSelectedPack(contentPack);
      setRunState('complete');
      setTimeout(() => {
        setGenerateOpen(false);
        setRunState('idle');
      }, 850);
    } catch (err) {
      setRunState('error');
      setError(err instanceof Error ? err.message : 'Generation failed.');
      setAgents((prev) => prev.map((agent) => (agent.state === 'active' ? { ...agent, state: 'queued', status: 'Stopped by error', detail: 'Review the message and try again.' } : agent)));
    }
  };

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="glass-panel sticky top-4 z-30 rounded-full px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg shadow-slate-950/20">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">LAID Content OS</p>
                <p className="hidden text-xs text-slate-500 sm:block">Dashboard, agents, and library in one command center.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-10 rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50" onClick={() => setSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Button>
              <Button className="h-10 rounded-full bg-indigo-600 px-4 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500" onClick={() => setGenerateOpen(true)}>
                <Wand2 className="mr-2 h-4 w-4" /> Generate
              </Button>
            </div>
          </div>
        </header>

        <section className="premium-gradient overflow-hidden rounded-[2.5rem] p-6 shadow-2xl shadow-indigo-950/10 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" /> AI Content Command Center
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 text-balance sm:text-5xl lg:text-6xl">
                Turn real AI updates into publish-ready content packs.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Pick a theme, watch four visible agents research and create, then open the finished pack with Long Post, X Thread, IG Caption, Carousel, and Script tabs.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button className="h-12 rounded-full bg-indigo-600 px-6 text-base font-semibold text-white shadow-xl shadow-indigo-600/25 hover:bg-indigo-500" onClick={() => setGenerateOpen(true)}>
                  <Wand2 className="mr-2 h-5 w-5" /> Generate from AI Update
                </Button>
                <Button variant="outline" className="h-12 rounded-full border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setSettingsOpen(true)}>
                  <KeyRound className="mr-2 h-5 w-5" /> Configure API key
                </Button>
              </div>
              {!settings.openaiApiKey && (
                <div className="mt-5 flex max-w-2xl items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Add an OpenAI API key in Settings before your first generation run.
                </div>
              )}
            </div>
            <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">Agent status</p>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">Ready</span>
              </div>
              <div className="mt-5 space-y-3">
                {initialAgents.map((agent) => {
                  const Icon = agent.icon;
                  return (
                    <div key={agent.id} className="flex items-center gap-3 rounded-2xl bg-white/8 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{agent.title}</p>
                        <p className="text-xs text-slate-400">Standing by for the next run.</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Content Packs" value={stats.packs} detail="Saved in the library and ready to publish." />
          <StatCard label="AI Updates Covered" value={stats.updates} detail="Unique updates transformed into campaigns." />
          <StatCard label="Formats Generated" value={stats.formats} detail="Five formats created for every pack." />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Content packs</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Click any card to open the full detail view and copy each format.</p>
              </div>
              <Button variant="outline" className="h-10 rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50" onClick={() => setGenerateOpen(true)}>
                <Wand2 className="mr-2 h-4 w-4" /> New pack
              </Button>
            </div>
            {isLoading ? (
              <div className="soft-card rounded-[2rem] p-8 text-sm text-slate-500">
                <Loader2 className="mb-3 h-5 w-5 animate-spin text-indigo-600" /> Loading saved content packs.
              </div>
            ) : contentPacks.length === 0 ? (
              <EmptyState onGenerate={() => setGenerateOpen(true)} />
            ) : (
              <div className="grid gap-4">
                {contentPacks.map((pack) => (
                  <ContentPackCard key={pack.id} pack={pack} onOpen={() => setSelectedPack(pack)} isNew={pack.id === lastCreatedId} />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="soft-card rounded-[2rem] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Agent Activity</h3>
                  <p className="mt-1 text-sm text-slate-500">Recent actions from the content team.</p>
                </div>
                <Activity className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="mt-5 space-y-4">
                {(activity.length ? activity : [
                  { id: 'empty-1', agent: 'Research Agent', message: 'waiting for the first AI update scan', time: 'ready' },
                  { id: 'empty-2', agent: 'Writer Agent', message: 'ready to generate the first long post', time: 'ready' },
                  { id: 'empty-3', agent: 'Repurposer Agent', message: 'ready to create five formats', time: 'ready' },
                ]).slice(0, 6).map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/40" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.agent} <span className="font-normal text-slate-500">{item.message}</span></p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3 w-3" /> {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-card rounded-[2rem] p-5">
              <h3 className="text-lg font-semibold text-slate-950">How to use it</h3>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li className="flex gap-3"><span className="font-semibold text-indigo-600">1.</span> Add your OpenAI API key in Settings.</li>
                <li className="flex gap-3"><span className="font-semibold text-indigo-600">2.</span> Click Generate from AI Update.</li>
                <li className="flex gap-3"><span className="font-semibold text-indigo-600">3.</span> Watch the agents research, write, edit, and repurpose.</li>
                <li className="flex gap-3"><span className="font-semibold text-indigo-600">4.</span> Open a pack and copy the format you need.</li>
              </ol>
            </div>
          </aside>
        </section>
      </div>

      {generateOpen && (
        <div className="fixed inset-0 z-40 overflow-auto bg-slate-950/35 p-3 backdrop-blur-sm sm:p-6">
          <div className="mx-auto my-4 max-w-6xl rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/25 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">Generate from AI Update</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Brief the agents</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Set the theme, style, and source. When you start, the pipeline shows each agent working in real time.</p>
              </div>
              <button onClick={() => runState === 'running' ? undefined : setGenerateOpen(false)} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-800">Theme</label>
                  <Input value={theme} onChange={(event) => setTheme(event.target.value)} className="mt-2 h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-950" placeholder="Example: AI agents for local service businesses" disabled={runState === 'running'} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-800">Style</label>
                  <div className="mt-2 grid gap-2">
                    {styleOptions.map((option) => (
                      <button key={option.value} onClick={() => setStyle(option.value)} disabled={runState === 'running'} className={`rounded-2xl border p-4 text-left transition ${style === option.value ? 'border-indigo-200 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200'}`}>
                        <span className="text-sm font-semibold">{option.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-800">Source</label>
                  <div className="mt-2 grid gap-2">
                    {sourceOptions.map((option) => (
                      <button key={option.value} onClick={() => setSource(option.value)} disabled={runState === 'running'} className={`rounded-2xl border p-4 text-left transition ${source === option.value ? 'border-indigo-200 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200'}`}>
                        <span className="text-sm font-semibold">{option.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {!settings.openaiApiKey && (
                  <button onClick={() => setSettingsOpen(true)} className="flex w-full items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-left text-sm leading-6 text-indigo-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Add your OpenAI API key in Settings before starting.
                  </button>
                )}
                <Button className="h-12 w-full rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500" onClick={generatePack} disabled={runState === 'running'}>
                  {runState === 'running' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  {runState === 'running' ? 'Agents working...' : 'Start agent pipeline'}
                </Button>
              </div>

              <AgentPipeline agents={agents} candidates={candidates} selectedPack={runState === 'complete' ? stats.latest || null : null} />
            </div>
          </div>
        </div>
      )}

      <SettingsPanel open={settingsOpen} settings={settings} onSave={setSettings} onClose={() => setSettingsOpen(false)} />
      <DetailPanel pack={selectedPack} onClose={() => setSelectedPack(null)} />
    </div>
  );
}
