import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clipboard, Download, FileText, KeyRound, Loader2, Mic, MicOff, Pencil, RefreshCw, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, Video, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Toast } from '@/components/Toast';
import { generateApprovedContentPack, prepareGenerationBrief } from '@/lib/contentGeneration';
import { saveOutputEdit, saveRating } from '@/lib/warRoomMemory';
import type { ContentBrief, ContentPack, ContentStyle, GenerationProgress, PipelineAgentRun, SourcePreparation, WarRoomOutput } from '@/data/types';
import { formatDescriptions, styleLabels } from '@/data/types';

const OPENAI_KEY = 'openai_api_key';
const PACKS_KEY = 'content-command-generated-packs';

type InputMode = 'paste' | 'youtube' | 'voice' | 'interview';
type SpeechTarget = 'voice' | 'interview';
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionEventLike = { resultIndex: number; results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } } };
type SpeechRecognitionErrorLike = { error?: string; message?: string };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const inputModes: Array<{ key: InputMode; label: string; description: string }> = [
  { key: 'paste', label: 'Paste Content', description: 'Default. Paste notes, transcript, article, or source material.' },
  { key: 'youtube', label: 'YouTube URL', description: 'Pull transcript context from a video URL.' },
  { key: 'voice', label: 'Voice Record', description: 'Use browser speech recognition for raw operator notes.' },
  { key: 'interview', label: 'Interview', description: 'Answer guided questions so the system can build source context.' },
];

const rewriteControls = ['Add tactical depth', 'Match Los voice', 'Add more proof', 'Strengthen hook', 'Remove generic phrasing', 'Make it contrarian', 'Shorter version', 'Story version', 'SOP version', 'Sharper CTA'];

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
  localStorage.setItem('ai-content-settings', JSON.stringify({ ...kimiSettings, audience, defaultStyle: style, apiKeys: { ...(kimiSettings.apiKeys || {}), openai: trimmedKey } }));
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function exportPack(pack: ContentPack) {
  const body = JSON.stringify(pack, null, 2);
  const blob = new Blob([body], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${pack.tool_name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-war-room-pack.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function scoreColor(score: number) {
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-amber-400';
  return 'bg-red-500';
}

function AgentPipelineCard({ agent }: { agent: PipelineAgentRun }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{agent.name}</div>
          <div className="text-xs uppercase tracking-[0.18em] text-[#c9a84c]">{agent.status}</div>
        </div>
        {agent.status === 'running' ? <Loader2 className="h-5 w-5 animate-spin text-[#c9a84c]" /> : agent.status === 'done' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : agent.status === 'error' ? <AlertCircle className="h-5 w-5 text-red-400" /> : <div className="h-3 w-3 rounded-full bg-white/20" />}
      </div>
      <p className="min-h-[44px] text-xs leading-5 text-white/70">{agent.produced || 'Waiting for upstream context.'}</p>
      {agent.issuesCaught.length > 0 && <p className="mt-2 text-xs text-amber-200">Issues: {agent.issuesCaught.join('; ')}</p>}
      <div className="mt-3 flex items-center justify-between text-xs text-white/50">
        <span>Score {agent.score || 0}/10</span>
        <span>{agent.timeSpentMs ? `${Math.round(agent.timeSpentMs / 1000)}s` : '0s'}</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-white/70"><span>{label}</span><span>{value}/10</span></div>
      <div className="h-2 rounded-full bg-white/10"><div className={`h-2 rounded-full ${scoreColor(value)}`} style={{ width: `${Math.max(8, value * 10)}%` }} /></div>
    </div>
  );
}

function EditableOutput({ pack, output, onChange, onToast }: { pack: ContentPack; output: WarRoomOutput; onChange: (output: WarRoomOutput) => void; onToast: (message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(output.content);
  useEffect(() => setDraft(output.content), [output.content]);
  const saveEdit = () => {
    saveOutputEdit(pack.id, output, output.content, draft);
    onChange({ ...output, content: draft, editedAt: new Date().toISOString(), version: output.version + 1 });
    setEditing(false);
    onToast('Edit saved to memory.');
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{output.label}</h3>
          <p className="text-sm text-white/50">{formatDescriptions[output.format]}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => copyText(output.content).then(() => onToast('Copied output.'))}><Clipboard className="mr-2 h-4 w-4" />Copy</Button>
          <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setEditing((value) => !value)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => onToast('Regenerate uses the same approved brief and memory context on the next run.')}><RefreshCw className="mr-2 h-4 w-4" />Regenerate</Button>
        </div>
      </div>
      {editing ? <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-[420px] border-white/10 bg-black text-sm leading-6 text-white" /> : <pre className="min-h-[420px] whitespace-pre-wrap rounded-xl bg-black/40 p-4 text-sm leading-6 text-white/85">{output.content}</pre>}
      {editing && <div className="mt-3 flex justify-end gap-2"><Button variant="outline" className="border-white/15 bg-white/5 text-white" onClick={() => setEditing(false)}>Cancel</Button><Button className="bg-[#c9a84c] text-black hover:bg-[#d9b95c]" onClick={saveEdit}>Save Edit To Memory</Button></div>}
      <div className="mt-4 flex flex-wrap gap-2">
        {rewriteControls.map((control) => <Button key={control} size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-xs text-white/70 hover:bg-white/10" onClick={() => onToast(`${control} queued as a rewrite instruction.`)}>{control}</Button>)}
      </div>
    </div>
  );
}

function WarRoomWorkspace({ pack, progressAgents, onPackChange, onClose, onToast }: { pack: ContentPack; progressAgents: PipelineAgentRun[]; onPackChange: (pack: ContentPack) => void; onClose: () => void; onToast: (message: string) => void }) {
  const outputs = pack.war_room_outputs || [];
  const [activeFormat, setActiveFormat] = useState(outputs[0]?.format || 'long_post');
  const activeOutput = outputs.find((output) => output.format === activeFormat) || outputs[0];
  const agents = pack.pipeline_agents?.length ? pack.pipeline_agents : progressAgents;
  const scores = pack.quality_scores;
  const updateOutput = (updated: WarRoomOutput) => {
    const nextOutputs = outputs.map((output) => (output.format === updated.format ? updated : output));
    onPackChange({ ...pack, war_room_outputs: nextOutputs });
  };
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur">
      <div className="grid h-[92vh] w-[94vw] grid-cols-1 overflow-hidden rounded-3xl border border-white/10 bg-[#080808] shadow-2xl lg:grid-cols-[380px_1fr]">
        <aside className="overflow-y-auto border-b border-white/10 bg-white/[0.03] p-5 lg:border-b-0 lg:border-r">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[0.22em] text-[#c9a84c]">AI content war room</p><h2 className="text-xl font-semibold text-white">{pack.tool_name}</h2></div>
            <Button variant="outline" className="border-white/15 bg-white/5 text-white" onClick={onClose}>Close</Button>
          </div>
          <div className="mb-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-white">Quality Gate</span><span className={scores?.passed ? 'text-emerald-300' : 'text-red-300'}>{scores?.passed ? 'Passed' : 'Needs Review'}</span></div>
            {scores && <div className="space-y-3"><ScoreBar label="Hook" value={scores.hookStrength} /><ScoreBar label="Specificity" value={scores.specificity} /><ScoreBar label="Proof" value={scores.proof} /><ScoreBar label="Usefulness" value={scores.usefulness} /><ScoreBar label="Originality" value={scores.originality} /><ScoreBar label="Voice" value={scores.voiceMatch} /><ScoreBar label="CTA" value={scores.ctaStrength} /><ScoreBar label="Platform" value={scores.platformFit} /><div className="rounded-xl bg-white/5 p-3 text-sm text-white">Composite: {scores.composite}/10</div>{scores.reasons.map((reason) => <p key={reason} className="text-xs text-white/60">{reason}</p>)}</div>}
          </div>
          <div className="mb-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <h3 className="mb-2 text-sm font-semibold text-white">Source Brief</h3>
            <p className="text-sm text-white/70">{pack.content_brief?.angle}</p>
            <p className="mt-2 text-xs text-white/50">Why now: {pack.content_brief?.whyNow}</p>
            <p className="mt-2 text-xs text-white/50">CTA: {pack.content_brief?.cta}</p>
          </div>
          <div className="mb-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Live 8-step pipeline</h3>
            <div className="space-y-3">{agents.map((agent) => <AgentPipelineCard key={agent.key} agent={agent} />)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Source Check</h3>
            <div className="space-y-2">{pack.checked_claims?.map((claim) => <div key={claim.id} className={`rounded-xl border p-3 text-xs ${claim.status === 'unsupported' ? 'border-red-500/50 bg-red-500/10 text-red-100' : claim.status === 'weak' ? 'border-amber-500/50 bg-amber-500/10 text-amber-100' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'}`}><p className="font-semibold">{claim.claim}</p><p className="mt-1 opacity-75">Source: {claim.source}</p><p className="mt-1 uppercase tracking-[0.18em]">{claim.status}</p></div>)}</div>
          </div>
        </aside>
        <main className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.22em] text-[#c9a84c]">Outputs</p><h2 className="text-2xl font-semibold text-white">Full content pack</h2></div><div className="flex gap-2"><Button variant="outline" className="border-white/15 bg-white/5 text-white" onClick={() => copyText(outputs.map((output) => `${output.label}\n${output.content}`).join('\n\n')).then(() => onToast('Copied full pack.'))}><Clipboard className="mr-2 h-4 w-4" />Copy All</Button><Button className="bg-[#c9a84c] text-black hover:bg-[#d9b95c]" onClick={() => exportPack(pack)}><Download className="mr-2 h-4 w-4" />Export</Button></div></div>
            <div className="flex gap-2 overflow-x-auto pb-1">{outputs.map((output) => <button key={output.format} onClick={() => setActiveFormat(output.format)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${activeFormat === output.format ? 'border-[#c9a84c] bg-[#c9a84c] text-black' : 'border-white/10 bg-white/[0.03] text-white/70'}`}>{output.label}</button>)}</div>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 xl:grid-cols-[1fr_320px]">
            {activeOutput && <EditableOutput pack={pack} output={activeOutput} onChange={updateOutput} onToast={onToast} />}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="mb-3 text-sm font-semibold text-white">Why This Works</h3><div className="space-y-3 text-sm text-white/70"><p><strong className="text-white">Hook type:</strong> {pack.why_this_works?.hookType}</p><p><strong className="text-white">Target desire:</strong> {pack.why_this_works?.targetDesire}</p><p><strong className="text-white">CTA logic:</strong> {pack.why_this_works?.ctaLogic}</p><div><strong className="text-white">Proof used:</strong>{pack.why_this_works?.proofUsed.map((item) => <p key={item} className="mt-1 text-xs text-white/55">{item}</p>)}</div><div><strong className="text-white">Audience pain:</strong>{pack.why_this_works?.audiencePainAddressed.map((item) => <p key={item} className="mt-1 text-xs text-white/55">{item}</p>)}</div><div><strong className="text-white">Platform logic:</strong>{pack.why_this_works?.platformLogic.map((item) => <p key={item} className="mt-1 text-xs text-white/55">{item}</p>)}</div></div></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="mb-3 text-sm font-semibold text-white">Memory Controls</h3><div className="flex gap-2"><Button className="bg-emerald-500 text-black hover:bg-emerald-400" onClick={() => { saveRating(pack.id, 'up', activeOutput?.format); onToast('Thumbs up saved to memory.'); }}><ThumbsUp className="mr-2 h-4 w-4" />Good</Button><Button className="bg-red-500 text-white hover:bg-red-400" onClick={() => { saveRating(pack.id, 'down', activeOutput?.format, 'User rejected this output in workspace.'); onToast('Thumbs down saved to memory.'); }}><ThumbsDown className="mr-2 h-4 w-4" />Weak</Button></div><p className="mt-3 text-xs text-white/50">Ratings and edits are fed into the next generation as learned rules.</p></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function BriefPanel({ preparation, briefDraft, setBriefDraft, onApprove, onCancel, isGenerating }: { preparation: SourcePreparation; briefDraft: ContentBrief; setBriefDraft: (brief: ContentBrief) => void; onApprove: () => void; onCancel: () => void; isGenerating: boolean }) {
  return (
    <div className="rounded-3xl border border-[#c9a84c]/40 bg-[#111]/95 p-6 shadow-2xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.22em] text-[#c9a84c]">Approval required</p><h2 className="text-2xl font-semibold text-white">One-page content brief</h2></div><ShieldCheck className="h-7 w-7 text-[#c9a84c]" /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2 text-sm text-white/70"><span>Angle</span><Textarea value={briefDraft.angle} onChange={(event) => setBriefDraft({ ...briefDraft, angle: event.target.value, editedAt: new Date().toISOString() })} className="border-white/10 bg-black text-white" /></label>
        <label className="space-y-2 text-sm text-white/70"><span>Target audience</span><Textarea value={briefDraft.targetAudience} onChange={(event) => setBriefDraft({ ...briefDraft, targetAudience: event.target.value, editedAt: new Date().toISOString() })} className="border-white/10 bg-black text-white" /></label>
        <label className="space-y-2 text-sm text-white/70"><span>Hook promise</span><Textarea value={briefDraft.hookPromise} onChange={(event) => setBriefDraft({ ...briefDraft, hookPromise: event.target.value, editedAt: new Date().toISOString() })} className="border-white/10 bg-black text-white" /></label>
        <label className="space-y-2 text-sm text-white/70"><span>Why now</span><Textarea value={briefDraft.whyNow} onChange={(event) => setBriefDraft({ ...briefDraft, whyNow: event.target.value, editedAt: new Date().toISOString() })} className="border-white/10 bg-black text-white" /></label>
        <label className="space-y-2 text-sm text-white/70"><span>CTA</span><Textarea value={briefDraft.cta} onChange={(event) => setBriefDraft({ ...briefDraft, cta: event.target.value, editedAt: new Date().toISOString() })} className="border-white/10 bg-black text-white" /></label>
        <div className="space-y-2 text-sm text-white/70"><span>Proof available</span><div className="rounded-xl border border-white/10 bg-black p-3 text-white/70">{briefDraft.proofAvailable.map((item) => <p key={item} className="mb-2 text-xs">{item}</p>)}</div></div>
        <div className="space-y-2 text-sm text-white/70"><span>Content structure</span><div className="rounded-xl border border-white/10 bg-black p-3 text-white/70">{briefDraft.contentStructure.map((item) => <p key={item} className="mb-2 text-xs">{item}</p>)}</div></div>
        <div className="space-y-2 text-sm text-white/70"><span>Risk flags</span><div className="rounded-xl border border-white/10 bg-black p-3 text-white/70">{briefDraft.riskFlags.length ? briefDraft.riskFlags.map((item) => <p key={item} className="mb-2 text-xs text-amber-200">{item}</p>) : <p className="text-xs">No major risk flags found.</p>}</div></div>
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4"><h3 className="mb-2 text-sm font-semibold text-white">Source intelligence collected</h3><div className="grid gap-3 text-xs text-white/60 sm:grid-cols-3"><span>{preparation.sourceIntelligence.exactClaims.length} claims</span><span>{preparation.sourceIntelligence.proofSnippets.length} proof snippets</span><span>{preparation.sourceIntelligence.riskFlags.length} risk flags</span></div></div>
      <div className="mt-5 flex flex-wrap justify-end gap-3"><Button variant="outline" className="border-white/15 bg-white/5 text-white" onClick={onCancel}>Edit Source</Button><Button variant="outline" className="border-white/15 bg-white/5 text-white" onClick={() => setBriefDraft({ ...briefDraft, editedAt: new Date().toISOString() })}>Edit Brief</Button><Button className="bg-[#c9a84c] text-black hover:bg-[#d9b95c]" onClick={onApprove} disabled={isGenerating}>{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Approve Brief</Button></div>
    </div>
  );
}

export function GenerateView() {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [sourceUrl, setSourceUrl] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceInterim, setVoiceInterim] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechTarget, setActiveSpeechTarget] = useState<SpeechTarget | null>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<string[]>(['', '', '', '', '']);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [theme, setTheme] = useState('AI implementation operator story');
  const [customPrompt, setCustomPrompt] = useState('Build a proof-led content pack that sounds like Los and never invents unsupported facts.');
  const [audience, setAudience] = useState('500k to 10M founders and operators');
  const [style, setStyle] = useState<ContentStyle>((localStorage.getItem('content_command_default_style') as ContentStyle) || 'system');
  const [preparation, setPreparation] = useState<SourcePreparation | null>(null);
  const [briefDraft, setBriefDraft] = useState<ContentBrief | null>(null);
  const [packs, setPacks] = useState<ContentPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [toast, setToast] = useState('');
  const supportsSpeechRecognition = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    setApiKey(localStorage.getItem(OPENAI_KEY) || '');
    setAudience(localStorage.getItem('content_command_audience') || '500k to 10M founders and operators');
    const storedPacks = readGeneratedPacks();
    setPacks(storedPacks);
    setSelectedPackId(storedPacks[0]?.id || null);
    return () => recognitionRef.current?.abort();
  }, []);

  const selectedPack = useMemo(() => packs.find((pack) => pack.id === selectedPackId) || null, [packs, selectedPackId]);
  const interviewQuestions = useMemo(() => ['What happened and why does it matter?', 'What proof, number, quote, or source supports it?', 'What does everyone else say about this topic?', 'What should Los say differently?', 'What should the audience do next?'], []);
  const interviewSource = useMemo(() => interviewQuestions.map((question, index) => interviewAnswers[index]?.trim() ? `Question ${index + 1}: ${question}\nAnswer: ${interviewAnswers[index]}` : '').filter(Boolean).join('\n\n'), [interviewAnswers, interviewQuestions]);
  const hasApiKey = apiKey.trim().length > 0;

  const persistPacks = (nextPacks: ContentPack[]) => {
    setPacks(nextPacks);
    saveGeneratedPacks(nextPacks);
  };
  const showToast = (message: string) => setToast(message);
  const stopRecognition = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setActiveSpeechTarget(null);
    setVoiceInterim('');
  };
  const startRecognition = (target: SpeechTarget) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError('Speech recognition is not available in this browser. Use Chrome or Safari, or type your source content.');
      return;
    }
    if (isListening) stopRecognition();
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); setActiveSpeechTarget(target); setVoiceError(''); };
    recognition.onend = () => { setIsListening(false); setActiveSpeechTarget(null); setVoiceInterim(''); recognitionRef.current = null; };
    recognition.onerror = (event) => { setVoiceError(event.message || event.error || 'Speech recognition error.'); setIsListening(false); };
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalTranscript += text;
        else interimTranscript += text;
      }
      if (finalTranscript.trim()) {
        if (target === 'voice') setVoiceTranscript((current) => `${current}${current ? ' ' : ''}${finalTranscript.trim()}`);
        else setInterviewAnswers((answers) => answers.map((answer, index) => (index === currentQuestionIndex ? `${answer}${answer ? ' ' : ''}${finalTranscript.trim()}` : answer)));
      }
      setVoiceInterim(interimTranscript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const activeSourceContent = inputMode === 'paste' ? pastedContent : inputMode === 'voice' ? voiceTranscript : inputMode === 'interview' ? interviewSource : '';
  const canPrepare = hasApiKey && ((inputMode === 'youtube' && sourceUrl.trim()) || (inputMode !== 'youtube' && activeSourceContent.trim().length > 20));
  const buildRequest = () => ({ sourceUrl: inputMode === 'youtube' ? sourceUrl : '', pastedContent: activeSourceContent, theme, style, customPrompt, mode: 'all_agents' as const });

  const handlePrepareBrief = async () => {
    if (!canPrepare) { showToast('Add source context and API key before generation.'); return; }
    mirrorPipelineSettings(apiKey, audience, style);
    setIsGenerating(true);
    setPreparation(null);
    setBriefDraft(null);
    try {
      const prepared = await prepareGenerationBrief(buildRequest(), setProgress);
      setPreparation(prepared);
      setBriefDraft(prepared.contentBrief);
      showToast('Brief ready for approval.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Brief preparation failed.';
      setProgress({ stage: 'error', message });
      showToast(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveBrief = async () => {
    if (!preparation || !briefDraft) return;
    setIsGenerating(true);
    try {
      const approved = { ...preparation, contentBrief: { ...briefDraft, approvedAt: new Date().toISOString() } };
      const pack = await generateApprovedContentPack(buildRequest(), approved, setProgress);
      const nextPacks = [pack, ...packs.filter((item) => item.id !== pack.id)];
      persistPacks(nextPacks);
      setSelectedPackId(pack.id);
      setPreparation(null);
      setBriefDraft(null);
      showToast('War room pack generated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed.';
      setProgress({ stage: 'error', message });
      showToast(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSelectedPack = (pack: ContentPack) => {
    persistPacks(packs.map((item) => (item.id === pack.id ? pack : item)));
  };

  return (
    <div className="min-h-screen bg-[#050505] p-4 text-white lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.28em] text-[#c9a84c]">Taste, proof, memory, speed</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">AI Content War Room</h1><p className="mt-3 max-w-2xl text-white/60">No source context means no generation. Build the evidence layer, approve the brief, then let the eight-agent pipeline produce and defend every asset.</p></div><Button variant="outline" className="border-white/15 bg-white/5 text-white" onClick={() => window.location.href = '/settings'}><KeyRound className="mr-2 h-4 w-4" />Settings</Button></div>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 grid grid-cols-2 gap-2">{inputModes.map((mode) => <button key={mode.key} onClick={() => setInputMode(mode.key)} className={`rounded-2xl border p-3 text-left ${inputMode === mode.key ? 'border-[#c9a84c] bg-[#c9a84c]/15' : 'border-white/10 bg-black/20'}`}><div className="text-sm font-semibold text-white">{mode.label}</div><div className="mt-1 text-xs text-white/50">{mode.description}</div></button>)}</div>
            <div className="space-y-4">
              <label className="block text-sm text-white/70">OpenAI API key<Input value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" placeholder="sk-..." className="mt-2 border-white/10 bg-black text-white" /></label>
              <label className="block text-sm text-white/70">Audience<Input value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-2 border-white/10 bg-black text-white" /></label>
              <label className="block text-sm text-white/70">Theme<Input value={theme} onChange={(event) => setTheme(event.target.value)} className="mt-2 border-white/10 bg-black text-white" /></label>
              <label className="block text-sm text-white/70">Style<select value={style} onChange={(event) => setStyle(event.target.value as ContentStyle)} className="mt-2 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-white"><option value="ai_news">{styleLabels.ai_news}</option><option value="workflow">{styleLabels.workflow}</option><option value="system">{styleLabels.system}</option></select></label>
              {inputMode === 'youtube' && <label className="block text-sm text-white/70">YouTube URL<Input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-2 border-white/10 bg-black text-white" /></label>}
              {inputMode === 'paste' && <label className="block text-sm text-white/70">Source content<Textarea value={pastedContent} onChange={(event) => setPastedContent(event.target.value)} placeholder="Paste transcript, notes, article, claims, numbers, quotes, or proof here." className="mt-2 min-h-[220px] border-white/10 bg-black text-white" /></label>}
              {inputMode === 'voice' && <div className="space-y-3"><div className="flex gap-2"><Button className="bg-[#c9a84c] text-black hover:bg-[#d9b95c]" onClick={() => isListening && activeSpeechTarget === 'voice' ? stopRecognition() : startRecognition('voice')}>{isListening && activeSpeechTarget === 'voice' ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}{isListening && activeSpeechTarget === 'voice' ? 'Stop' : 'Record'}</Button></div><Textarea value={`${voiceTranscript}${voiceInterim ? ` ${voiceInterim}` : ''}`} onChange={(event) => setVoiceTranscript(event.target.value)} className="min-h-[220px] border-white/10 bg-black text-white" />{!supportsSpeechRecognition && <p className="text-xs text-amber-200">Browser speech recognition is not available. Type notes instead.</p>}{voiceError && <p className="text-xs text-red-300">{voiceError}</p>}</div>}
              {inputMode === 'interview' && <div className="space-y-3"><div className="rounded-2xl border border-white/10 bg-black/30 p-4"><p className="text-sm font-semibold text-white">Question {currentQuestionIndex + 1}</p><p className="mt-2 text-sm text-white/60">{interviewQuestions[currentQuestionIndex]}</p><Textarea value={interviewAnswers[currentQuestionIndex]} onChange={(event) => setInterviewAnswers((answers) => answers.map((answer, index) => index === currentQuestionIndex ? event.target.value : answer))} className="mt-3 min-h-[140px] border-white/10 bg-black text-white" /><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" className="border-white/15 bg-white/5 text-white" onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}>Previous</Button><Button variant="outline" className="border-white/15 bg-white/5 text-white" onClick={() => setCurrentQuestionIndex(Math.min(interviewQuestions.length - 1, currentQuestionIndex + 1))}>Next</Button><Button className="bg-[#c9a84c] text-black hover:bg-[#d9b95c]" onClick={() => isListening && activeSpeechTarget === 'interview' ? stopRecognition() : startRecognition('interview')}>{isListening && activeSpeechTarget === 'interview' ? 'Stop Recording' : 'Record Answer'}</Button></div></div></div>}
              <label className="block text-sm text-white/70">Direction for agents<Textarea value={customPrompt} onChange={(event) => setCustomPrompt(event.target.value)} className="mt-2 min-h-[90px] border-white/10 bg-black text-white" /></label>
              <Button className="w-full bg-[#c9a84c] text-black hover:bg-[#d9b95c]" onClick={handlePrepareBrief} disabled={!canPrepare || isGenerating}>{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Build Source Brief</Button>
            </div>
          </section>
          <section className="space-y-6">
            {progress && <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"><div className="mb-4 flex items-center gap-3"><Video className="h-5 w-5 text-[#c9a84c]" /><div><p className="text-sm font-semibold text-white">{progress.stage}</p><p className="text-sm text-white/60">{progress.message}</p></div></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{progress.agents?.map((agent) => <AgentPipelineCard key={agent.key} agent={agent} />)}</div></div>}
            {preparation && briefDraft && <BriefPanel preparation={preparation} briefDraft={briefDraft} setBriefDraft={setBriefDraft} onApprove={handleApproveBrief} onCancel={() => { setPreparation(null); setBriefDraft(null); }} isGenerating={isGenerating} />}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-[#c9a84c]">Recent packs</p><h2 className="text-xl font-semibold text-white">Memory-backed output history</h2></div><FileText className="h-5 w-5 text-white/40" /></div><div className="grid gap-3 md:grid-cols-2">{packs.length ? packs.slice(0, 6).map((pack) => <button key={pack.id} onClick={() => setSelectedPackId(pack.id)} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left hover:border-[#c9a84c]/50"><div className="mb-2 flex items-center justify-between gap-3"><h3 className="font-semibold text-white">{pack.tool_name}</h3><span className="text-xs text-[#c9a84c]">{pack.quality_scores?.composite || Math.round((pack.quality_score || 80) / 10)}/10</span></div><p className="line-clamp-2 text-sm text-white/55">{pack.summary}</p></button>) : <p className="text-sm text-white/50">No generated packs yet.</p>}</div></div>
          </section>
        </div>
      </div>
      {selectedPack && <WarRoomWorkspace pack={selectedPack} progressAgents={progress?.agents || []} onPackChange={updateSelectedPack} onClose={() => setSelectedPackId(null)} onToast={showToast} />}
      <Toast message={toast} visible={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
}
