/**
 * src/components/HookSelector.tsx
 * Shows 5 hook cards with template + filled-in version, score, and "Use this hook" button.
 * Used in StudioView (or any view that needs hook selection).
 */

import { useState, useCallback } from 'react';
import { Sparkles, RefreshCw, Copy, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { selectHooks, type FilledHook } from '@/lib/hookSelector';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'educational', label: 'Educational' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'myth_busting', label: 'Myth Busting' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'authority', label: 'Authority' },
  { value: 'day_in_the_life', label: 'Day in the Life' },
  { value: 'random_engagement', label: 'Random / Engagement' },
];

const CATEGORY_COLORS: Record<string, string> = {
  educational: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  comparison: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  myth_busting: 'bg-red-500/15 text-red-400 border-red-500/30',
  storytelling: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  authority: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  day_in_the_life: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  random_engagement: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
};

interface HookCardProps {
  hook: FilledHook;
  onUse: (hook: FilledHook) => void;
}

function HookCard({ hook, onUse }: HookCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hook.filled);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const catColor = CATEGORY_COLORS[hook.category] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  const catLabel = CATEGORIES.find((c) => c.value === hook.category)?.label ?? hook.category;

  return (
    <div className="group relative rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.14] transition-all duration-200 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${catColor}`}>
            {catLabel}
          </span>
          {hook.is_outlier && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-[#c9a84c]/15 text-[#c9a84c] border-[#c9a84c]/30">
              <Zap className="w-2.5 h-2.5" />
              Outlier
            </span>
          )}
        </div>
        {/* Score bar */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#c9a84c]/60"
              style={{ width: `${(hook.score / 10) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 tabular-nums">{hook.score.toFixed(1)}</span>
        </div>
      </div>

      {/* Template */}
      <p className="text-xs text-zinc-500 mb-2 line-clamp-2 font-mono leading-relaxed">
        {hook.template}
      </p>

      {/* Filled version */}
      <p className="text-sm text-zinc-200 leading-relaxed mb-4">
        {hook.filled}
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-8 flex-1 bg-[#c9a84c] text-black hover:bg-[#c9a84c]/90 text-xs font-medium"
          onClick={() => onUse(hook)}
        >
          Use this hook
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 border-white/10 bg-transparent hover:bg-white/5 text-zinc-400"
          onClick={handleCopy}
          title="Copy filled hook"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface HookSelectorProps {
  /** Default topic to pre-populate the search */
  defaultTopic?: string;
  /** Called when user clicks "Use this hook" */
  onSelectHook?: (hook: FilledHook) => void;
  /** Number of hooks to show at once */
  count?: number;
}

export function HookSelector({ defaultTopic = '', onSelectHook, count = 5 }: HookSelectorProps) {
  const [topic, setTopic] = useState(defaultTopic);
  const [category, setCategory] = useState('all');
  const [hooks, setHooks] = useState<FilledHook[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadHooks = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const results = await selectHooks({
        topic: topic.trim(),
        category: category === 'all' ? undefined : category,
        count,
        prioritizeOutliers: true,
      });
      setHooks(results);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [topic, category, count]);

  const handleUse = (hook: FilledHook) => {
    onSelectHook?.(hook);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-2">
        <Input
          className="flex-1 h-9 bg-white/[0.04] border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-[#c9a84c]/40"
          placeholder="Enter your topic or niche (e.g. n8n automations for coaches)…"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadHooks()}
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px] h-9 bg-white/[0.04] border-white/[0.08] text-xs text-zinc-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-white/10">
            {CATEGORIES.map((c) => (
              <SelectItem
                key={c.value}
                value={c.value}
                className="text-xs text-zinc-300 focus:bg-white/5 focus:text-white"
              >
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-9 bg-[#c9a84c] text-black hover:bg-[#c9a84c]/90 text-xs font-medium px-4"
          onClick={loadHooks}
          disabled={loading || !topic.trim()}
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span className="ml-1.5">{hasLoaded ? 'Refresh' : 'Generate'}</span>
        </Button>
      </div>

      {/* Hook cards */}
      {hasLoaded && hooks.length > 0 ? (
        <div className="grid gap-3">
          {hooks.map((hook) => (
            <HookCard key={hook.id} hook={hook} onUse={handleUse} />
          ))}
        </div>
      ) : !hasLoaded ? (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-10 text-center">
          <Sparkles className="w-8 h-8 text-[#c9a84c]/50 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">
            Enter your topic above and click <strong className="text-zinc-400">Generate</strong> to get{' '}
            {count} hook suggestions from the library.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
          <p className="text-sm text-zinc-500">No hooks found. Try a different topic or category.</p>
        </div>
      )}
    </div>
  );
}
