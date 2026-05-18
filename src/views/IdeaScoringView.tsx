import { useMemo, useState } from 'react';
import { CheckCircle2, Flame, Lightbulb, Target, XCircle } from 'lucide-react';

const scoredIdeas = [
  {
    idea: 'Turn a founder voice note into a 7-day content pack',
    score: 92,
    wins: ['Original input', 'Strong demo value', 'Easy before/after proof'],
    risks: ['Needs clean source capture'],
  },
  {
    idea: 'AI search visibility audit for service companies',
    score: 88,
    wins: ['Clear buyer pain', 'High-ticket consulting wedge', 'Report can be productized'],
    risks: ['Needs credible citation checks'],
  },
  {
    idea: 'Generic AI news roundup',
    score: 41,
    wins: ['Easy to produce'],
    risks: ['Saturated', 'Weak CTA', 'Low original proof'],
  },
];

function scoreIdea(idea: string) {
  const hasProof = /\$?\d|%|client|customer|case study|tested|built|revenue|saved|lead/i.test(idea);
  const hasPain = /problem|manual|slow|expensive|missed|inconsistent|bottleneck|struggle|hate|need/i.test(idea);
  const hasBuyer = /company|founder|agency|client|operator|business|team|sales|lead/i.test(idea);
  const hasOutcome = /book|lead|revenue|save|time|content|system|audit|workflow|pipeline/i.test(idea);
  const score = Math.min(96, 42 + (hasProof ? 18 : 0) + (hasPain ? 14 : 0) + (hasBuyer ? 12 : 0) + (hasOutcome ? 10 : 0) + Math.min(10, Math.floor(idea.length / 24)));
  return {
    idea,
    score,
    wins: [
      ...(hasProof ? ['Has proof signal'] : []),
      ...(hasPain ? ['Clear pain'] : []),
      ...(hasBuyer ? ['Buyer named'] : []),
      ...(hasOutcome ? ['Outcome tied'] : []),
    ],
    risks: [
      ...(!hasProof ? ['Needs proof'] : []),
      ...(!hasPain ? ['Pain is soft'] : []),
      ...(!hasOutcome ? ['Outcome unclear'] : []),
    ],
  };
}

export function IdeaScoringView() {
  const [ideasText, setIdeasText] = useState('');
  const liveIdeas = useMemo(() => {
    const rows = ideasText.split('\n').map((row) => row.trim()).filter(Boolean);
    return rows.length ? rows.map(scoreIdea).sort((a, b) => b.score - a.score) : scoredIdeas;
  }, [ideasText]);

  return (
    <div className="space-y-6">
      <section className="obsidian-card obsidian-glow rounded-[28px] p-6 md:p-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Idea Scoring</p>
        <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.03em] text-[#F8FAFC] md:text-5xl">
          Score the idea before agents waste a draft.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#A1A1AA]">
          Rank angles by novelty, proof, buyer pain, lead potential, and platform fit before the writing pipeline starts.
        </p>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#101014]/80 p-5">
        <label className="text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">Ideas to score</label>
        <textarea
          value={ideasText}
          onChange={(event) => setIdeasText(event.target.value)}
          rows={6}
          placeholder="Paste one idea per line. Add proof, buyer, pain, and outcome to raise the score."
          className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-[#F8FAFC] outline-none placeholder:text-[#71717A] focus:border-[#22D3EE]/50"
        />
      </section>

      <section className="grid gap-4">
        {liveIdeas.map((item) => (
          <article key={item.idea} className="obsidian-elevated rounded-[24px] p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A855F7]/24 to-[#22D3EE]/18 text-[#D8B4FE]">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#F8FAFC]">{item.idea}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.wins.map((win) => (
                      <span key={win} className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        {win}
                      </span>
                    ))}
                    {item.risks.map((risk) => (
                      <span key={risk} className="inline-flex items-center gap-1 rounded-full border border-[#F8C471]/20 bg-[#F8C471]/10 px-3 py-1 text-xs text-[#F8C471]">
                        <XCircle className="h-3 w-3" />
                        {risk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                {item.score >= 85 ? <Flame className="h-5 w-5 text-[#F8C471]" /> : <Target className="h-5 w-5 text-[#71717A]" />}
                <div>
                  <div className="text-2xl font-semibold text-[#F8FAFC]">{item.score}</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#71717A]">idea score</div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
