import { useMemo, useState } from 'react';
import { FileSearch, RadioTower, ShieldCheck, TrendingUp } from 'lucide-react';
import { buildSourceIntelligence } from '@/lib/sourceIntelligence';

const radarSignals = [
  {
    title: 'AI search visibility',
    signal: 'Companies need content that can be cited by ChatGPT, Gemini, Claude, and Perplexity.',
    action: 'Build source-backed answers for high-intent buyer questions.',
    score: 94,
  },
  {
    title: 'Founder-led proof',
    signal: 'Generic AI posts are saturated. Original tests, teardown posts, and workflows still break through.',
    action: 'Turn one client or internal workflow into a weekly proof series.',
    score: 89,
  },
  {
    title: 'Agent implementation',
    signal: 'Buyers are moving from prompt hacks to role-based AI systems with memory and QA.',
    action: 'Show the before and after: messy source material to approved content pack.',
    score: 91,
  },
];

export function MarketRadarView() {
  const [topic, setTopic] = useState('AI content agent systems for companies');
  const [sourceNotes, setSourceNotes] = useState('');
  const intelligence = useMemo(
    () => buildSourceIntelligence({ sourceUrl: '', theme: topic, style: 'ai_news', inputMode: 'paste_content', customPrompt: sourceNotes || topic, sourceContent: sourceNotes || topic }),
    [sourceNotes, topic]
  );
  const liveSignals = sourceNotes.trim()
    ? [
        {
          title: 'Proof-backed angle',
          signal: intelligence.proofSnippets[0] || 'The notes need more proof before this becomes a strong content angle.',
          action: intelligence.differentiatedAngles[0],
          score: Math.min(96, 62 + intelligence.exactClaims.length * 5 + intelligence.primaryLinks.length * 6),
        },
        {
          title: 'Audience pain',
          signal: intelligence.audiencePainLanguage[0] || 'Pain language is thin. Add buyer phrases, objections, or call notes.',
          action: 'Turn the pain into a before and after workflow.',
          score: Math.min(92, 58 + intelligence.audiencePainLanguage.length * 7),
        },
        {
          title: 'Risk flags',
          signal: intelligence.riskFlags[0] || 'No major risk flags found in the current notes.',
          action: intelligence.riskFlags.length ? 'Add more source detail before writing.' : 'Move this into Idea Scoring or Generate.',
          score: intelligence.riskFlags.length ? 68 : 88,
        },
      ]
    : radarSignals;

  return (
    <div className="space-y-6">
      <section className="obsidian-card obsidian-glow rounded-[28px] p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Market Radar</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.03em] text-[#F8FAFC] md:text-5xl">
              Find the content angles before the market gets noisy.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#A1A1AA]">
              A command surface for trends, source context, creator saturation, and the angles worth turning into sales content.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#22D3EE]/25 bg-[#22D3EE]/10 px-4 py-2 text-xs font-medium text-[#67E8F9]">
            <RadioTower className="h-4 w-4" />
            Radar ready
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-[24px] border border-white/10 bg-[#101014]/80 p-5">
          <label className="text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">Topic</label>
          <input value={topic} onChange={(event) => setTopic(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm text-[#F8FAFC] outline-none focus:border-[#22D3EE]/50" />
          <label className="mt-4 block text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">Source notes</label>
          <textarea value={sourceNotes} onChange={(event) => setSourceNotes(event.target.value)} rows={7} placeholder="Paste market notes, competitor posts, customer language, trend links, or raw observations." className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-[#F8FAFC] outline-none placeholder:text-[#71717A] focus:border-[#22D3EE]/50" />
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[#101014]/80 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
            <FileSearch className="h-4 w-4 text-[#F8C471]" />
            Live evidence read
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <RadarMetric label="claims" value={String(intelligence.exactClaims.length)} />
            <RadarMetric label="proof" value={String(intelligence.proofSnippets.length)} />
            <RadarMetric label="pain" value={String(intelligence.audiencePainLanguage.length)} />
            <RadarMetric label="risks" value={String(intelligence.riskFlags.length)} />
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-[#A1A1AA]">
            {intelligence.differentiatedAngles[0]}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {liveSignals.map((item) => (
          <article key={item.title} className="obsidian-elevated rounded-[24px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/[0.055] text-[#22D3EE]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-[#A855F7]/25 bg-[#A855F7]/10 px-3 py-1 text-xs font-medium text-[#D8B4FE]">{item.score}</span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-[#F8FAFC]">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">{item.signal}</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-[#F8FAFC]">
              {item.action}
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-[#101014]/80 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
            <FileSearch className="h-4 w-4 text-[#F8C471]" />
            Source queue
          </div>
          <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">
            Next build step: connect source capture, URL validation, claim extraction, and creator saturation checks.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[#101014]/80 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Angle rule
          </div>
          <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">
            Every accepted trend needs proof, a buyer pain, a contrarian angle, and a clear path to a CTA.
          </p>
        </div>
      </section>
    </div>
  );
}

function RadarMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[#71717A]">{label}</div>
      <div className="mt-1 text-xl font-semibold text-[#F8FAFC]">{value}</div>
    </div>
  );
}
