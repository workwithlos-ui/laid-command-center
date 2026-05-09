/**
 * src/components/ScriptScoreCard.tsx
 * Displays the 7-factor breakdown as a horizontal bar chart with each factor's
 * score 0-10, plus improvement suggestions.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  scoreScript,
  FACTOR_LABELS,
  FACTOR_DESCRIPTIONS,
  type ScriptInput,
  type FactorScores,
  type ScoringResult,
} from '@/lib/sevenFactors';

// ─── Color mapping for scores ─────────────────────────────
function getScoreColor(score: number): string {
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-[#c9a84c]';
  if (score >= 4) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 6) return 'text-[#c9a84c]';
  if (score >= 4) return 'text-amber-400';
  return 'text-red-400';
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-400';
  if (grade.startsWith('B')) return 'text-[#c9a84c]';
  if (grade.startsWith('C')) return 'text-amber-400';
  return 'text-red-400';
}

// ─── Factor bar ───────────────────────────────────────────
interface FactorBarProps {
  factorKey: keyof FactorScores;
  score: number;
}

function FactorBar({ factorKey, score }: FactorBarProps) {
  const [showDesc, setShowDesc] = useState(false);
  const pct = (score / 10) * 100;
  const color = getScoreColor(score);
  const textColor = getScoreTextColor(score);

  return (
    <div className="group">
      <button
        className="w-full text-left"
        onClick={() => setShowDesc((v) => !v)}
      >
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-xs text-zinc-400 w-44 shrink-0 truncate">
            {FACTOR_LABELS[factorKey]}
          </span>
          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${color}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-xs font-mono tabular-nums w-6 text-right ${textColor}`}>
            {score}
          </span>
        </div>
      </button>
      {showDesc && (
        <p className="text-[11px] text-zinc-600 ml-[11.5rem] mb-2">
          {FACTOR_DESCRIPTIONS[factorKey]}
        </p>
      )}
    </div>
  );
}

// ─── Inline form for scoring ──────────────────────────────
interface ScoringFormProps {
  onScore: (result: ScoringResult, input: ScriptInput) => void;
}

function ScoringForm({ onScore }: ScoringFormProps) {
  const [form, setForm] = useState<ScriptInput>({
    hook: '',
    topic: '',
    format: '',
    length: '',
    visual_idea: '',
    sound_idea: '',
    cta: '',
  });

  const fields: Array<{ key: keyof ScriptInput; label: string; placeholder: string }> = [
    { key: 'topic', label: 'Topic (subniche)', placeholder: 'e.g. n8n automations for coaches' },
    { key: 'hook', label: 'Hook', placeholder: 'e.g. "If I had 30 days to land my first AI client, here\'s what I\'d do"' },
    { key: 'format', label: 'Format', placeholder: 'e.g. whiteboard, voiceover, reaction, clone' },
    { key: 'length', label: 'Length', placeholder: 'e.g. 60s, 45s, 90s' },
    { key: 'visual_idea', label: 'Visual Hook', placeholder: 'What does the viewer SEE in the first 3 seconds?' },
    { key: 'sound_idea', label: 'Sound / Audio', placeholder: 'e.g. trending audio, cinematic voiceover, lo-fi' },
    { key: 'cta', label: 'CTA', placeholder: 'e.g. "Comment SYSTEM and I\'ll DM you the full workflow"' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = scoreScript(form);
    onScore(result, form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {fields.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-xs text-zinc-500 mb-1">{label}</label>
          <input
            type="text"
            className="w-full h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/40"
            placeholder={placeholder}
            value={form[key]}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        </div>
      ))}
      <button
        type="submit"
        className="w-full h-9 rounded-lg bg-[#c9a84c] text-black text-xs font-medium hover:bg-[#c9a84c]/90 transition-colors"
      >
        Score this script
      </button>
    </form>
  );
}

// ─── Main ScriptScoreCard ─────────────────────────────────
interface ScriptScoreCardProps {
  /** Pre-computed scoring result (optional — if not provided, renders inline form) */
  result?: ScoringResult;
  /** The script input that was scored (used for labels) */
  input?: ScriptInput;
  /** Whether to show the scoring form inline */
  showForm?: boolean;
}

export function ScriptScoreCard({ result: externalResult, input, showForm = true }: ScriptScoreCardProps) {
  const [result, setResult] = useState<ScoringResult | null>(externalResult || null);
  const [_scoredInput, setScoredInput] = useState<ScriptInput | null>(input || null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleScore = (res: ScoringResult, inp: ScriptInput) => {
    setResult(res);
    setScoredInput(inp);
    setShowSuggestions(true);
  };

  const FACTOR_ORDER: (keyof FactorScores)[] = [
    'hook', 'topic', 'format', 'length', 'visual', 'sound', 'cta',
  ];

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#c9a84c]" />
          <h3 className="text-sm font-semibold text-zinc-200">7-Factor Score</h3>
        </div>
        {result && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-2xl font-bold ${getGradeColor(result.grade)}`}>
                {result.grade}
              </div>
              <div className="text-[10px] text-zinc-600">{result.total}/70</div>
            </div>
          </div>
        )}
      </div>

      {/* Score breakdown */}
      {result ? (
        <div className="space-y-1">
          {FACTOR_ORDER.map((key) => (
            <FactorBar key={key} factorKey={key} score={result.scores[key]} />
          ))}

          {/* Total bar */}
          <div className="pt-2 border-t border-white/[0.06] mt-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-300 w-44">Total Score</span>
              <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getScoreColor(result.total / 7)}`}
                  style={{ width: `${(result.total / 70) * 100}%` }}
                />
              </div>
              <span className={`text-sm font-bold tabular-nums ${getGradeColor(result.grade)}`}>
                {result.total}
              </span>
            </div>
          </div>
        </div>
      ) : showForm ? null : (
        <div className="text-center py-6">
          <p className="text-xs text-zinc-600">No score yet. Fill in the form to score your script.</p>
        </div>
      )}

      {/* Suggestions */}
      {result && result.suggestions.length > 0 && (
        <div className="border-t border-white/[0.06] pt-4">
          <button
            className="flex items-center gap-2 w-full text-left mb-3"
            onClick={() => setShowSuggestions((v) => !v)}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs font-medium text-zinc-400">
              {result.suggestions.length} improvement{result.suggestions.length !== 1 ? 's' : ''}
            </span>
            <span className="ml-auto text-zinc-600">
              {showSuggestions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>
          {showSuggestions && (
            <ul className="space-y-2">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-500 leading-relaxed">
                  <span className="text-amber-500/70 mt-0.5 shrink-0">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result && result.suggestions.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 border-t border-white/[0.06] pt-4">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>All 7 factors are strong. This script is ready to film.</span>
        </div>
      )}

      {/* Inline scoring form */}
      {showForm && (
        <div className="border-t border-white/[0.06] pt-4">
          <p className="text-xs text-zinc-600 mb-3">
            {result ? 'Score a different script:' : 'Score your script:'}
          </p>
          <ScoringForm onScore={handleScore} />
        </div>
      )}
    </div>
  );
}

// ─── Compact display (no form, just bars) ─────────────────
export function ScriptScoreCompact({ result }: { result: ScoringResult }) {
  const FACTOR_ORDER: (keyof FactorScores)[] = [
    'hook', 'topic', 'format', 'length', 'visual', 'sound', 'cta',
  ];

  return (
    <div className="space-y-1.5">
      {FACTOR_ORDER.map((key) => {
        const score = result.scores[key];
        const pct = (score / 10) * 100;
        const color = getScoreColor(score);
        const textColor = getScoreTextColor(score);
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 w-20 shrink-0 truncate">{key}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-[10px] tabular-nums ${textColor}`}>{score}</span>
          </div>
        );
      })}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
        <span className="text-[10px] text-zinc-500">Total</span>
        <span className={`text-sm font-bold ${getGradeColor(result.grade)}`}>
          {result.grade} ({result.total}/70)
        </span>
      </div>
    </div>
  );
}

// Re-export Badge for convenience (used by parent components)
export { Badge };
