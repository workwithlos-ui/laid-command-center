import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BrainCircuit,
  CheckCircle2,
  Compass,
  Copy,
  FileSearch,
  Filter,
  Layers3,
  Network,
  PenLine,
  Play,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContentPacks } from '@/hooks/useContentPacks';
import { recordLearnedRule, recordMemoryEvent } from '@/lib/warRoomMemory';
import { callAgent } from '@/lib/openai';

const STUDIO_RUNS_KEY = 'content-command-agent-studio-runs';
const GENERATE_PREFILL_KEY = 'content-command-generate-prefill';

const agentProfiles = [
  {
    id: 'strategist',
    name: 'Content Strategist',
    oneLiner: 'Finds the sharpest angle and turns loose ideas into a clear content thesis',
    role: 'Defines the audience promise, narrative spine, proof needs, and handoff brief before content is written.',
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
    name: 'Research Agent',
    oneLiner: 'Finds proof, source risk, dates, examples, and practical implications',
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
    oneLiner: 'Kills weak ideas and keeps only topics your audience will care about',
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
    name: 'Writing Agent',
    oneLiner: 'Writes the core post with hook, story, tactical steps, and CTA',
    role: 'Writes the core long-form asset with hook, narrative, framework, proof, and next action.',
    icon: PenLine,
    score: 92,
    status: 'Drafting narrative systems',
    lastAction: 'Built a long post around before and after automation workflow language.',
    tasks: 151,
    inputs: ['Strategy', 'Research brief', 'Approved phrases', 'Voice rules'],
    rules: ['Open with tension, not context.', 'Use short paragraphs and high-signal lines.', 'Make the implementation path obvious.'],
    weakness: 'Occasionally needs a sharper first sentence and less setup.',
    training: 'Train on hooks that combine contrarian claim plus exact workflow outcome.',
  },
  {
    id: 'repurposer',
    name: 'Repurposer Agent',
    oneLiner: 'Turns one strong asset into platform-native posts, scripts, and carousels',
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
    name: 'Editor Agent',
    oneLiner: 'Checks quality, structure, originality, voice, source support, and CTA strength',
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

type AgentProfile = (typeof agentProfiles)[number];

type StudioRun = {
  id: string;
  mode: 'single' | 'pod' | 'swarm';
  title: string;
  agents: string[];
  input: string;
  output: string;
  createdAt: string;
  live: boolean;
};

type StudioAgentResponse = {
  output: string;
  issues?: string[];
  next_steps?: string[];
  score?: number;
};

const podPresets = [
  { label: 'Research Pod', ids: ['strategist', 'research', 'relevance'] },
  { label: 'Writing Pod', ids: ['writer', 'repurposer', 'editor'] },
  { label: 'QA Pod', ids: ['research', 'relevance', 'editor'] },
  { label: 'Full Swarm', ids: agentProfiles.map((agent) => agent.id) },
];

function readStudioRuns(): StudioRun[] {
  try {
    const raw = localStorage.getItem(STUDIO_RUNS_KEY);
    return raw ? JSON.parse(raw) as StudioRun[] : [];
  } catch {
    return [];
  }
}

function buildAgentOutput(agent: AgentProfile, input: string, index = 0) {
  const source = input.trim() || 'No source added yet. Add raw notes, a link summary, a call transcript, or a messy idea.';

  if (agent.id === 'strategist') {
    return [
      'Strategy: turn this into a clear operator outcome.',
      `Angle: ${source.slice(0, 140)}`,
      'Audience promise: show the reader one practical move they can use this week.',
      'Next handoff: Research Agent needs proof, dates, numbers, and source risks.',
    ].join('\n');
  }

  if (agent.id === 'research') {
    return [
      'Research map:',
      `1. Source claim to verify: ${source.slice(0, 150)}`,
      '2. Look for primary source, launch note, doc page, demo, repo, or customer proof.',
      '3. Mark unsupported claims before writing.',
      'Next handoff: Relevance Filter should kill weak claims and keep practical proof.',
    ].join('\n');
  }

  if (agent.id === 'relevance') {
    return [
      'Relevance score: 8/10',
      'Keep if it saves time, creates leads, cuts cost, improves margin, or makes the client look sharper.',
      'Risk: weak if the source only says AI is faster without a concrete workflow.',
      'Next handoff: Writer needs the strongest proof and one CTA.',
    ].join('\n');
  }

  if (agent.id === 'writer') {
    return [
      'Draft skeleton:',
      'Hook: Most teams do not need more AI tools. They need one repeatable content system.',
      'Story/context: use the raw source as the proof moment.',
      'Tactical steps: source intake, brief approval, agent run, source check, edit, ship, measure.',
      'CTA: DM me if you want this built around your company.',
    ].join('\n');
  }

  if (agent.id === 'repurposer') {
    return [
      'Repurpose plan:',
      'LinkedIn: founder lesson with proof and CTA.',
      'X: 7-post thread from problem to system.',
      'IG carousel: source, pain, workflow, proof, CTA.',
      'Email: short story, practical steps, reply CTA.',
    ].join('\n');
  }

  return [
    'Editor gate:',
    'Checks: hook, specificity, source support, structure, voice, CTA, no em dashes.',
    `Pass ${index + 1}: content needs proof density, tactical steps, and a clear next action.`,
    'If weak: send it back to Writer with exact fixes.',
  ].join('\n');
}

function buildStudioRun(mode: StudioRun['mode'], agents: AgentProfile[], input: string, live = false, outputOverride?: string): StudioRun {
  const title = mode === 'single' ? agents[0].name : mode === 'pod' ? 'Custom Agent Pod' : 'Full Content Swarm';
  const output = outputOverride || agents.map((agent, index) => `### ${agent.name}\n${buildAgentOutput(agent, input, index)}`).join('\n\n');
  return {
    id: `studio-run-${Date.now().toString(36)}`,
    mode,
    title,
    agents: agents.map((agent) => agent.name),
    input: input.trim() || 'Empty test input',
    output,
    createdAt: new Date().toLocaleTimeString(),
    live,
  };
}

async function runLiveAgent(agent: AgentProfile, input: string): Promise<string> {
  const apiKey = localStorage.getItem('openai_api_key') || '';
  if (!apiKey.startsWith('sk-') || apiKey.includes('test') || apiKey.length < 30) {
    return buildAgentOutput(agent, input);
  }

  const result = await callAgent<StudioAgentResponse>(
    { apiKey, model: 'gpt-4o-mini', temperature: 0.3 },
    JSON.stringify({
      agent: agent.name,
      role: agent.role,
      task: input,
      decisionRules: agent.rules,
      expectedJson: {
        output: 'The useful agent result in plain English.',
        issues: ['Problems or risks caught.'],
        next_steps: ['What the next agent or human should do.'],
        score: 1,
      },
      instruction: 'Run this agent on the task. Be specific, tactical, source-aware, and concise. Do not use em dashes.',
    })
  );

  if (!result.success || !result.data) {
    return `${buildAgentOutput(agent, input)}\n\nLive run note: ${result.error || 'API run failed, local preview used.'}`;
  }

  return [
    result.data.output,
    result.data.issues?.length ? `Issues:\n${result.data.issues.map((item) => `- ${item}`).join('\n')}` : '',
    result.data.next_steps?.length ? `Next steps:\n${result.data.next_steps.map((item) => `- ${item}`).join('\n')}` : '',
    result.data.score ? `Score: ${result.data.score}/10` : '',
  ].filter(Boolean).join('\n\n');
}

export function AgentStudioView() {
  const navigate = useNavigate();
  const { packs } = useContentPacks();
  const [selectedId, setSelectedId] = useState(agentProfiles[0].id);
  const [podIds, setPodIds] = useState<string[]>(['strategist', 'research', 'writer', 'editor']);
  const [labInput, setLabInput] = useState('Turn this idea into content: companies do not need generic AI posts, they need a source-checked agent system that learns from performance.');
  const [studioRuns, setStudioRuns] = useState<StudioRun[]>(readStudioRuns);
  const [copied, setCopied] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const selected = agentProfiles.find((agent) => agent.id === selectedId) || agentProfiles[0];
  const SelectedIcon = selected.icon;
  const podAgents = agentProfiles.filter((agent) => podIds.includes(agent.id));
  const latestRun = studioRuns[0];

  useEffect(() => {
    localStorage.setItem(STUDIO_RUNS_KEY, JSON.stringify(studioRuns.slice(0, 12)));
  }, [studioRuns]);

  const addRun = (run: StudioRun) => {
    setStudioRuns((runs) => [run, ...runs].slice(0, 8));
    recordMemoryEvent('agent_studio_run', { label: run.title, detail: run.agents.join(', ') });
  };

  const runStudio = async (mode: StudioRun['mode'], overrideAgents?: AgentProfile[]) => {
    const agents = overrideAgents || (mode === 'single' ? [selected] : mode === 'pod' ? podAgents : agentProfiles);
    if (!agents.length) return;

    setIsRunning(true);
    let run = buildStudioRun(mode, agents, labInput, liveMode);

    try {
      if (liveMode) {
        const liveOutputs = await Promise.all(agents.map(async (agent) => `### ${agent.name}\n${await runLiveAgent(agent, labInput)}`));
        run = buildStudioRun(mode, agents, labInput, true, liveOutputs.join('\n\n'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Live run failed.';
      run = buildStudioRun(mode, agents, labInput, false, `${run.output}\n\nLive run failed: ${message}`);
    } finally {
      setIsRunning(false);
    }

    addRun(run);
  };

  const togglePodAgent = (agentId: string) => {
    setPodIds((ids) => (ids.includes(agentId) ? ids.filter((id) => id !== agentId) : [...ids, agentId]));
  };

  const copyLatestRun = async () => {
    if (!latestRun) return;
    await navigator.clipboard.writeText(`${latestRun.title}\n\nINPUT:\n${latestRun.input}\n\nOUTPUT:\n${latestRun.output}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const saveLatestRunAsTraining = () => {
    if (!latestRun) return;
    recordMemoryEvent('agent_studio_training_saved', { label: latestRun.title, detail: latestRun.agents.join(', ') });
    recordLearnedRule(`Agent Studio training run: ${latestRun.title}. Useful output pattern: ${latestRun.output.slice(0, 220)}`, 'agent_studio');
  };

  const sendLatestRunToGenerate = () => {
    if (!latestRun) return;
    localStorage.setItem(
      GENERATE_PREFILL_KEY,
      JSON.stringify({
        source: `${latestRun.input}\n\nAGENT STUDIO OUTPUT:\n${latestRun.output}`,
        theme: latestRun.title,
      })
    );
    navigate('/generate');
  };

  const clearHistory = () => setStudioRuns([]);

  return (
    <div className="space-y-6">
      <section className="obsidian-card obsidian-glow rounded-[28px] p-5 md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Agent Studio</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-[#F8FAFC] md:text-5xl">
              Tell the agents what to work on.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#A1A1AA]">
              Paste a topic, source notes, transcript, or rough idea. Then run one agent, a pod, or the full swarm and send the best output into Generate.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[520px]">
            <StepCard number="1" title="Paste mission" body="Tell the system what content or research you want." />
            <StepCard number="2" title="Run agents" body="Use one specialist, a pod, or the full swarm." />
            <StepCard number="3" title="Ship output" body="Copy it, train memory, or send it to Generate." />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="obsidian-card rounded-[24px] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#F8C471]">Mission Brief</p>
              <h3 className="mt-2 text-xl font-semibold text-[#F8FAFC]">What should the agents build or analyze?</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-[#71717A]">
              {packs.length} packs saved
            </span>
          </div>

          <textarea
            value={labInput}
            onChange={(event) => setLabInput(event.target.value)}
            rows={9}
            className="mt-5 w-full resize-y rounded-2xl border border-white/10 bg-[#050508]/75 px-4 py-3 text-sm leading-6 text-[#F8FAFC] outline-none placeholder:text-[#71717A] focus:border-[#A855F7]/50 focus:ring-4 focus:ring-[#A855F7]/10"
            placeholder="Example: Build a LinkedIn post and repurpose pack about why companies need source-checked content agents instead of generic AI posts."
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {podPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPodIds(preset.ids)}
                className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-medium text-[#A1A1AA] transition hover:border-[#22D3EE]/35 hover:text-[#F8FAFC]"
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLiveMode((value) => !value)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${liveMode ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/[0.035] text-[#A1A1AA] hover:bg-white/[0.06]'}`}
            >
              {liveMode ? 'Live API on' : 'Preview mode'}
            </button>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Button onClick={() => void runStudio('single')} disabled={isRunning} className="h-11 rounded-xl bg-[#A855F7] px-4 text-sm font-semibold text-white hover:bg-[#9333EA] disabled:opacity-55">
              <Play className="mr-2 h-4 w-4" /> {isRunning ? 'Running' : `Run ${selected.name}`}
            </Button>
            <Button onClick={() => void runStudio('pod')} disabled={isRunning || !podAgents.length} variant="outline" className="h-11 rounded-xl border-white/10 bg-white/[0.045] px-4 text-sm text-[#F8FAFC] hover:bg-white/[0.075] disabled:opacity-55">
              <Users className="mr-2 h-4 w-4" /> Run Pod ({podAgents.length})
            </Button>
            <Button onClick={() => void runStudio('swarm')} disabled={isRunning} variant="outline" className="h-11 rounded-xl border-[#22D3EE]/25 bg-[#22D3EE]/10 px-4 text-sm text-[#67E8F9] hover:bg-[#22D3EE]/15 disabled:opacity-55">
              <Network className="mr-2 h-4 w-4" /> Run Full Swarm
            </Button>
          </div>
        </div>

        <div className="obsidian-card rounded-[24px] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#22D3EE]">Output</p>
              <h3 className="mt-2 text-xl font-semibold text-[#F8FAFC]">{latestRun ? latestRun.title : 'Run results appear here'}</h3>
            </div>
            {latestRun && (
              <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-[#71717A]">
                {latestRun.live ? 'Live' : 'Preview'} · {latestRun.createdAt}
              </span>
            )}
          </div>

          {latestRun ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={copyLatestRun} className="h-8 rounded-xl px-3 text-xs text-[#A1A1AA] hover:bg-white/[0.06] hover:text-[#22D3EE]">
                  <Copy className="mr-1 h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="ghost" size="sm" onClick={saveLatestRunAsTraining} className="h-8 rounded-xl px-3 text-xs text-[#A1A1AA] hover:bg-white/[0.06] hover:text-[#F8C471]">
                  <Save className="mr-1 h-3.5 w-3.5" /> Save Training
                </Button>
                <Button variant="ghost" size="sm" onClick={sendLatestRunToGenerate} className="h-8 rounded-xl px-3 text-xs text-[#A1A1AA] hover:bg-white/[0.06] hover:text-emerald-300">
                  <Send className="mr-1 h-3.5 w-3.5" /> Send to Generate
                </Button>
              </div>
              <div className="mt-4 max-h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-[#050508]/70 p-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  {latestRun.agents.map((name) => (
                    <span key={name} className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[11px] text-[#A1A1AA]">{name}</span>
                  ))}
                </div>
                <pre className="whitespace-pre-wrap text-xs leading-6 text-[#A1A1AA]">{latestRun.output}</pre>
              </div>
            </>
          ) : (
            <div className="mt-4 flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-6 text-center">
              <BrainCircuit className="h-10 w-10 text-[#22D3EE]" />
              <p className="mt-4 text-base font-semibold text-[#F8FAFC]">Start with the mission brief.</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#A1A1AA]">
                The output will show the agent result, the handoff notes, and the next action.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="obsidian-card rounded-[24px] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#A855F7]">Choose Agents</p>
              <h3 className="mt-2 text-xl font-semibold text-[#F8FAFC]">Run one specialist or build a pod.</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-[#71717A]">
              {podAgents.length} selected
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {agentProfiles.map((agent) => {
              const Icon = agent.icon;
              const active = agent.id === selectedId;
              const inPod = podIds.includes(agent.id);
              return (
                <article
                  key={agent.id}
                  onClick={() => setSelectedId(agent.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.055] ${active ? 'border-[#A855F7]/55 bg-[#A855F7]/10' : 'border-white/10 bg-white/[0.03]'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A855F7]/25 to-[#22D3EE]/12 text-[#D8B4FE]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="truncate text-sm font-semibold text-[#F8FAFC]">{agent.name}</h4>
                        <span className="rounded-full border border-white/10 bg-white/[0.045] px-2 py-0.5 text-[11px] text-[#22D3EE]">{agent.score}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#71717A]">{agent.status}</p>
                      <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#A1A1AA]">{agent.oneLiner}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedId(agent.id);
                        void runStudio('single', [agent]);
                      }}
                      className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-medium text-[#F8FAFC] transition hover:border-[#A855F7]/45 hover:bg-white/[0.075]"
                    >
                      Run
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        togglePodAgent(agent.id);
                      }}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${inPod ? 'border-[#22D3EE]/35 bg-[#22D3EE]/10 text-[#67E8F9]' : 'border-white/10 bg-white/[0.035] text-[#A1A1AA] hover:bg-white/[0.06]'}`}
                    >
                      {inPod ? 'In pod' : 'Add to pod'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="obsidian-card rounded-[24px] p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#22D3EE]">
                <SelectedIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#F8FAFC]">{selected.name}</h3>
                <p className="text-xs text-[#71717A]">Quality score {selected.score} · {selected.tasks} tasks completed</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium leading-6 text-[#F8FAFC]">{selected.oneLiner}</p>
            <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{selected.role}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniBlock title="Looks at" items={selected.inputs} />
              <MiniBlock title="Decides by" items={selected.rules} />
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717A]">Needs next</p>
              <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{selected.training}</p>
            </div>
          </div>

          <div className="obsidian-card rounded-[24px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#71717A]">Run History</p>
                <h3 className="mt-2 text-lg font-semibold text-[#F8FAFC]">Recent tests</h3>
              </div>
              {studioRuns.length > 0 && (
                <button type="button" onClick={clearHistory} className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs text-[#71717A] hover:text-rose-300">
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {studioRuns.length ? studioRuns.slice(0, 5).map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => setStudioRuns((runs) => [run, ...runs.filter((item) => item.id !== run.id)])}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-left text-xs text-[#A1A1AA] transition hover:bg-white/[0.055] hover:text-[#F8FAFC]"
                >
                  <span className="block font-semibold text-[#F8FAFC]">{run.title}</span>
                  <span>{run.createdAt} · {run.agents.length} agent{run.agents.length === 1 ? '' : 's'}</span>
                </button>
              )) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-4 text-sm text-[#71717A]">
                  No runs yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StepCard({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex size-7 items-center justify-center rounded-full bg-[#22D3EE]/10 text-xs font-semibold text-[#67E8F9]">{number}</div>
      <p className="mt-3 text-sm font-semibold text-[#F8FAFC]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">{body}</p>
    </div>
  );
}

function MiniBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717A]">{title}</p>
      <div className="mt-3 space-y-2">
        {items.slice(0, 3).map((item) => (
          <div key={item} className="flex gap-2 text-xs leading-5 text-[#A1A1AA]">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22D3EE]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
