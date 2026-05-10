import { useMemo, useState } from 'react';
import { BrainCircuit, CheckCircle2, Compass, FileSearch, Filter, History, Layers3, PenLine, RefreshCw, ShieldCheck, Sparkles, Target, Zap } from 'lucide-react';
import { useContentPacks } from '@/hooks/useContentPacks';

const agentProfiles = [
  {
    id: 'strategist',
    name: 'Content Strategist',
    role: 'Defines the angle, audience promise, and narrative thesis before content is written.',
    icon: Compass,
    score: 94,
    status: 'Planning sprint architecture',
    lastAction: 'Selected workflow-first positioning for AI update content.',
    tasks: 184,
    inputs: ['Brand memory', 'Audience pain points', 'Theme and source prompt', 'Historical winners'],
    rules: ['Lead with a concrete operator outcome.', 'Reject broad AI commentary without a use case.', 'Map every sprint to one measurable reader action.'],
    weakness: 'Can over-prioritize frameworks when a timely news hook would move faster.',
    training: 'Add three examples of high-performing contrarian news angles.',
  },
  {
    id: 'research',
    name: 'Research / News Finder',
    role: 'Extracts what changed, why it matters, and which proof points deserve attention.',
    icon: FileSearch,
    score: 91,
    status: 'Scanning source relevance',
    lastAction: 'Converted tool update notes into founder-facing implications.',
    tasks: 169,
    inputs: ['Source URL', 'Custom prompt', 'Known tools', 'Market context'],
    rules: ['Prioritize new and specific details.', 'Separate fact from interpretation.', 'Surface concrete demos, dates, and workflow changes.'],
    weakness: 'Needs stronger pressure to discard vendor fluff.',
    training: 'Feed examples of weak launch copy rewritten into practical implications.',
  },
  {
    id: 'relevance',
    name: 'Relevance Filter',
    role: 'Decides whether an idea is worth turning into content for this audience.',
    icon: Filter,
    score: 89,
    status: 'Filtering weak hooks',
    lastAction: 'Flagged vague productivity claims and demanded implementation detail.',
    tasks: 173,
    inputs: ['Research brief', 'Audience objections', 'Failure patterns', 'Strategist thesis'],
    rules: ['Cut ideas without a clear reader payoff.', 'Prefer examples over adjectives.', 'Score for urgency, specificity, and usefulness.'],
    weakness: 'May reject brand-building posts that do not have immediate tactical utility.',
    training: 'Add examples of successful credibility-building posts with soft CTAs.',
  },
  {
    id: 'writer',
    name: 'Long-Post Writer',
    role: 'Writes the core long-form asset with hook, narrative, framework, and CTA.',
    icon: PenLine,
    score: 92,
    status: 'Drafting narrative systems',
    lastAction: 'Built a long post around before/after automation workflow language.',
    tasks: 151,
    inputs: ['Strategy', 'Research brief', 'Approved phrases', 'Voice rules'],
    rules: ['Open with tension, not context.', 'Use short paragraphs and high-signal lines.', 'Make the implementation path obvious.'],
    weakness: 'Occasionally needs a sharper first sentence and less setup.',
    training: 'Train on hooks that combine contrarian claim + exact workflow outcome.',
  },
  {
    id: 'repurposer',
    name: 'Repurposer',
    role: 'Transforms the core asset into X threads, Instagram captions, carousels, scripts, and LinkedIn variants.',
    icon: Layers3,
    score: 90,
    status: 'Packaging platform variations',
    lastAction: 'Generated carousel slides from the long-post framework.',
    tasks: 156,
    inputs: ['Long post', 'Platform format rules', 'CTA intent', 'Audience reading context'],
    rules: ['Preserve the core promise across formats.', 'Rewrite for platform behavior, not just length.', 'Keep every derivative independently useful.'],
    weakness: 'Carousel headlines can become too explanatory.',
    training: 'Add punchier slide headline examples with fewer words.',
  },
  {
    id: 'editor',
    name: 'Editor Quality Gate',
    role: 'Runs the final pass for clarity, originality, specificity, brand fit, and publishability.',
    icon: ShieldCheck,
    score: 96,
    status: 'Enforcing quality gates',
    lastAction: 'Auto-retried weak specificity and improved CTA precision.',
    tasks: 211,
    inputs: ['All generated formats', 'Six-gate rubric', 'Banned phrases', 'Voice rules'],
    rules: ['No generic AI hype.', 'Every claim needs a useful implication.', 'If it would not stop the scroll, send it back.'],
    weakness: 'Can be conservative with experimental tone.',
    training: 'Approve controlled experiments with bolder personality in the opening line.',
  },
];

export function AgentStudioView() {
  const { packs } = useContentPacks();
  const [selectedId, setSelectedId] = useState(agentProfiles[0].id);
  const selected = agentProfiles.find((agent) => agent.id === selectedId) || agentProfiles[0];
  const generatedPacks = packs.length;

  const learningHistory = useMemo(
    () => [
      `Observed ${generatedPacks || 'sample'} content sprint${generatedPacks === 1 ? '' : 's'} in this workspace.`,
      'Quality gate now rewards specificity, workflow utility, and sharper CTAs.',
      'Down-rated outputs are routed into Brand Memory as failure-pattern candidates.',
    ],
    [generatedPacks]
  );

  return (
    <div className="space-y-8">
      <section className="obsidian-card obsidian-glow rounded-[28px] p-6 md:p-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Agent Studio</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[#F8FAFC] md:text-5xl">Your six-agent content team.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#A1A1AA]">
              Each agent owns a distinct decision layer. Together they behave like a real editorial team: strategy, research, filtering, writing, repurposing, and final quality control.
            </p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4 text-right">
            <div className="text-2xl font-semibold text-[#F8FAFC]">92%</div>
            <div className="text-xs text-[#71717A]">Average team quality</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agentProfiles.map((agent) => {
          const Icon = agent.icon;
          const active = agent.id === selectedId;
          return (
            <button key={agent.id} onClick={() => setSelectedId(agent.id)} className={`obsidian-elevated group rounded-[24px] p-5 text-left transition duration-300 hover:-translate-y-1 ${active ? 'border-[#A855F7]/50 shadow-[0_0_44px_rgba(168,85,247,0.12)]' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A855F7]/20 to-[#22D3EE]/12 text-[#D8B4FE]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F8FAFC]">{agent.name}</h3>
                    <p className="mt-1 text-xs text-[#71717A]">{agent.status}</p>
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-xs text-[#22D3EE]">{agent.score}</div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#A1A1AA]">{agent.role}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/[0.035] p-3">
                  <div className="text-lg font-semibold text-[#F8FAFC]">{agent.tasks}</div>
                  <div className="text-[11px] text-[#71717A]">tasks completed</div>
                </div>
                <div className="rounded-2xl bg-white/[0.035] p-3">
                  <div className="flex items-center gap-1 text-sm font-semibold text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Active</div>
                  <div className="mt-1 text-[11px] text-[#71717A]">agent status</div>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="obsidian-card rounded-[24px] p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#22D3EE]">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#F8FAFC]">{selected.name}</h3>
              <p className="text-xs text-[#71717A]">Quality score {selected.score} · {selected.tasks} tasks completed</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#A1A1AA]">{selected.role}</p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F8FAFC]"><Zap className="h-4 w-4 text-[#F8C471]" /> Last action</div>
            <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{selected.lastAction}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailBlock icon={Target} title="Inputs" items={selected.inputs} />
          <DetailBlock icon={CheckCircle2} title="Decision rules" items={selected.rules} />
          <DetailBlock icon={RefreshCw} title="Current weakness" items={[selected.weakness]} />
          <DetailBlock icon={History} title="Learning history" items={learningHistory} />
          <div className="obsidian-elevated rounded-[24px] p-5 md:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]"><Sparkles className="h-4 w-4 text-[#22D3EE]" /> Recommended training</div>
            <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">{selected.training}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailBlock({ icon: Icon, title, items }: { icon: typeof Target; title: string; items: string[] }) {
  return (
    <div className="obsidian-elevated rounded-[24px] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]"><Icon className="h-4 w-4 text-[#22D3EE]" /> {title}</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs leading-5 text-[#A1A1AA]">{item}</div>
        ))}
      </div>
    </div>
  );
}
