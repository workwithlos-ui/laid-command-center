/**
 * src/views/AudienceView.tsx
 * Reddit Audience Intelligence Dashboard — ported from index.html/app.js/styles.css
 * Pulls from supabase.audience_insights (filtered by current user_id).
 * Falls back to realistic mock data when Supabase is not configured.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Search,
  RefreshCw,
  ExternalLink,
  Radio,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  X,
  ChevronDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getInsights,
  getThemeStats,
  getSubredditStats,
  type AudienceInsight,
  type ThemeStat,
  type SubredditStat,
} from '@/lib/audienceQueries';
import { isSupabaseConfigured } from '@/lib/supabase';

// ─── Chart palette ─────────────────────────────────────────
const PALETTE = [
  '#818cf8', '#a78bfa', '#c084fc', '#e879f9',
  '#f472b6', '#fb7185', '#fb923c', '#fbbf24',
];

// ─── Source badge colors ──────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  reddit: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  dm: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  comment: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  manual: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

function fmtNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

// ─── Connect Reddit Scraper Modal ─────────────────────────
function ConnectScraperModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-orange-400" />
            Connect Reddit Scraper
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-sm mt-1">
            Automatically pull audience signals from Reddit into your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Apify option */}
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-sm">⚡</div>
              <div>
                <p className="text-sm font-medium text-zinc-200">Apify Reddit Scraper</p>
                <p className="text-[11px] text-zinc-500">Recommended — no code required</p>
              </div>
            </div>
            <ol className="space-y-1.5 mt-3">
              {[
                'Go to apify.com and create a free account',
                'Search for "Reddit Scraper" in the actor store',
                'Configure subreddits, keywords, and post frequency',
                'Add a webhook that POSTs results to your LAID API endpoint',
                'Paste your Apify API key in Settings → Integrations',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                  <span className="text-[#c9a84c] shrink-0 font-mono">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* RSS option */}
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center text-sm">📡</div>
              <div>
                <p className="text-sm font-medium text-zinc-200">Reddit RSS Feed</p>
                <p className="text-[11px] text-zinc-500">Manual setup — free, no API key needed</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mb-2">
              Every subreddit has an RSS feed. Use a tool like{' '}
              <span className="text-zinc-300">Zapier</span>,{' '}
              <span className="text-zinc-300">Make</span>, or{' '}
              <span className="text-zinc-300">n8n</span> to monitor it and push results to Supabase.
            </p>
            <code className="block text-[11px] bg-black/40 rounded px-3 py-2 text-emerald-400 font-mono">
              https://www.reddit.com/r/[subreddit]/.rss
            </code>
          </div>

          <p className="text-[11px] text-zinc-600 text-center">
            Manual entries always work — use the import feature in Settings to paste insights directly.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 mt-2"
          onClick={onClose}
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Insight card (table row) ─────────────────────────────
function InsightRow({ insight }: { insight: AudienceInsight }) {
  const [expanded, setExpanded] = useState(false);
  const srcColor = SOURCE_COLORS[insight.source] || SOURCE_COLORS.manual;

  return (
    <div
      className="rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4 cursor-pointer"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start gap-3">
        {/* Tags */}
        <div className="flex flex-col gap-1.5 shrink-0 mt-0.5">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${srcColor}`}>
            {insight.source}
          </span>
          {insight.subreddit && (
            <span className="text-[10px] text-zinc-500">r/{insight.subreddit}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {insight.theme && (
            <p className="text-[11px] font-medium text-[#c9a84c] mb-1">{insight.theme}</p>
          )}
          {insight.pain_point && (
            <p className="text-xs text-zinc-400 mb-1 line-clamp-1">{insight.pain_point}</p>
          )}
          {insight.quote && (
            <p className={`text-xs text-zinc-300 italic leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
              "{insight.quote}"
            </p>
          )}
          {!expanded && insight.quote && insight.quote.length > 150 && (
            <p className="text-[10px] text-zinc-600 mt-1">Click to expand…</p>
          )}
        </div>

        {/* Score + link */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {insight.score > 0 && (
            <span className="text-xs font-mono text-zinc-500">▲ {fmtNum(insight.score)}</span>
          )}
          {insight.source_url && (
            <a
              href={insight.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main AudienceView ─────────────────────────────────────
export function AudienceView() {
  const [insights, setInsights] = useState<AudienceInsight[]>([]);
  const [themes, setThemes] = useState<ThemeStat[]>([]);
  const [subreddits, setSubreddits] = useState<SubredditStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isDemoMode] = useState(!isSupabaseConfigured());

  // Filter state
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterTheme, setFilterTheme] = useState('all');
  const [filterSubreddit, setFilterSubreddit] = useState('all');
  const [displayCount, setDisplayCount] = useState(25);

  const loadData = async () => {
    setLoading(true);
    try {
      const [insightsData, themesData, subredditsData] = await Promise.all([
        getInsights(),
        getThemeStats(),
        getSubredditStats(),
      ]);
      setInsights(insightsData);
      setThemes(themesData);
      setSubreddits(subredditsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Derived stats
  const topTheme = themes[0]?.theme ?? '—';
  const topSubreddit = subreddits[0]?.subreddit ?? '—';

  // Filter logic
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return insights.filter((ins) => {
      if (filterSource !== 'all' && ins.source !== filterSource) return false;
      if (filterTheme !== 'all' && ins.theme !== filterTheme) return false;
      if (filterSubreddit !== 'all' && ins.subreddit !== filterSubreddit) return false;
      if (q) {
        const hay = `${ins.quote || ''} ${ins.pain_point || ''} ${ins.theme || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [insights, filterSource, filterTheme, filterSubreddit, search]);

  const visible = filtered.slice(0, displayCount);
  const hasMore = filtered.length > displayCount;

  // Unique values for filter dropdowns
  const uniqueSources = [...new Set(insights.map((i) => i.source).filter(Boolean))].sort();
  const uniqueThemes = [...new Set(insights.map((i) => i.theme).filter(Boolean))].sort() as string[];
  const uniqueSubreddits = [...new Set(insights.map((i) => i.subreddit).filter(Boolean))].sort() as string[];

  // Chart data (top 8)
  const themeChartData = themes.slice(0, 8).map((t, i) => ({
    name: t.theme,
    count: t.count,
    fill: PALETTE[i % PALETTE.length],
  }));

  const subChartData = subreddits.slice(0, 8).map((s, i) => ({
    name: `r/${s.subreddit}`,
    value: s.count,
    fill: PALETTE[i % PALETTE.length],
  }));

  // ─── Empty state ────────────────────────────────────────
  if (!loading && insights.length === 0) {
    return (
      <>
        <ConnectScraperModal open={showConnectModal} onClose={() => setShowConnectModal(false)} />
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Audience Intelligence</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Reddit signals, pain points, and content opportunities from your niche.
            </p>
          </div>
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-16 text-center">
            <Radio className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-zinc-300 mb-2">No audience signals yet</h3>
            <p className="text-sm text-zinc-600 max-w-sm mx-auto mb-6">
              Connect a Reddit scraper to automatically pull pain points, questions, and frustrations from your target subreddits.
            </p>
            <Button
              className="bg-[#c9a84c] text-black hover:bg-[#c9a84c]/90"
              onClick={() => setShowConnectModal(true)}
            >
              Connect Reddit Scraper
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ConnectScraperModal open={showConnectModal} onClose={() => setShowConnectModal(false)} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              Audience Intelligence
              {isDemoMode && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
                  Demo Data
                </span>
              )}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {insights.length} signals across {uniqueSubreddits.length} subreddits
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-white/10 bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 text-xs"
              onClick={() => setShowConnectModal(true)}
            >
              <Radio className="w-3.5 h-3.5 mr-1.5" />
              Connect Scraper
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-white/10 bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 text-xs"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Top stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-xs text-zinc-500 mb-1">Total Insights</p>
            <p className="text-2xl font-bold text-zinc-100">{insights.length}</p>
            <p className="text-[11px] text-zinc-600 mt-1">{uniqueSources.length} sources</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-xs text-zinc-500 mb-1">Top Theme</p>
            <p className="text-base font-bold text-[#c9a84c] leading-tight">{topTheme}</p>
            <p className="text-[11px] text-zinc-600 mt-1">
              {themes[0]?.count ?? 0} insights
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-xs text-zinc-500 mb-1">Top Subreddit</p>
            <p className="text-base font-bold text-zinc-200">
              {topSubreddit !== '—' ? `r/${topSubreddit}` : '—'}
            </p>
            <p className="text-[11px] text-zinc-600 mt-1">
              {subreddits[0]?.count ?? 0} insights
            </p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Themes bar chart */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#c9a84c]" />
              <h3 className="text-sm font-semibold text-zinc-300">Themes</h3>
            </div>
            {themeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={themeChartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis
                    type="number"
                    tick={{ fill: '#52525b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={140}
                    tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + '…' : v)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#d4d4d8',
                    }}
                    formatter={(value: number) => [`${value} insights`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {themeChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-xs text-zinc-600">
                No theme data yet
              </div>
            )}
          </div>

          {/* Subreddits donut chart */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-[#c9a84c]" />
              <h3 className="text-sm font-semibold text-zinc-300">Subreddits</h3>
            </div>
            {subChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={subChartData}
                    cx="45%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {subChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#d4d4d8',
                    }}
                    formatter={(value: number, name: string) => [`${value} insights`, name]}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span style={{ color: '#71717a', fontSize: 11 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-xs text-zinc-600">
                No subreddit data yet
              </div>
            )}
          </div>
        </div>

        {/* Filters + search */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <Input
              className="h-9 pl-9 bg-white/[0.04] border-white/[0.08] text-xs text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-[#c9a84c]/40"
              placeholder="Search quotes, pain points, themes…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setDisplayCount(25);
              }}
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
                onClick={() => setSearch('')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Select value={filterSource} onValueChange={(v) => { setFilterSource(v); setDisplayCount(25); }}>
            <SelectTrigger className="w-[130px] h-9 bg-white/[0.04] border-white/[0.08] text-xs text-zinc-300">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/10">
              <SelectItem value="all" className="text-xs text-zinc-300 focus:bg-white/5">All Sources</SelectItem>
              {uniqueSources.map((s) => (
                <SelectItem key={s} value={s} className="text-xs text-zinc-300 focus:bg-white/5">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterTheme} onValueChange={(v) => { setFilterTheme(v); setDisplayCount(25); }}>
            <SelectTrigger className="w-[180px] h-9 bg-white/[0.04] border-white/[0.08] text-xs text-zinc-300">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/10">
              <SelectItem value="all" className="text-xs text-zinc-300 focus:bg-white/5">All Themes</SelectItem>
              {uniqueThemes.map((t) => (
                <SelectItem key={t} value={t} className="text-xs text-zinc-300 focus:bg-white/5">
                  {t.length > 24 ? t.slice(0, 24) + '…' : t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSubreddit} onValueChange={(v) => { setFilterSubreddit(v); setDisplayCount(25); }}>
            <SelectTrigger className="w-[160px] h-9 bg-white/[0.04] border-white/[0.08] text-xs text-zinc-300">
              <SelectValue placeholder="Subreddit" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/10">
              <SelectItem value="all" className="text-xs text-zinc-300 focus:bg-white/5">All Subreddits</SelectItem>
              {uniqueSubreddits.map((s) => (
                <SelectItem key={s} value={s} className="text-xs text-zinc-300 focus:bg-white/5">
                  r/{s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Active filter count */}
          {(search || filterSource !== 'all' || filterTheme !== 'all' || filterSubreddit !== 'all') && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
              <button
                className="text-[11px] text-zinc-600 hover:text-zinc-300 underline"
                onClick={() => {
                  setSearch('');
                  setFilterSource('all');
                  setFilterTheme('all');
                  setFilterSubreddit('all');
                  setDisplayCount(25);
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Insights list */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-lg border border-white/[0.06] bg-white/[0.02] animate-pulse"
              />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="space-y-2">
            {visible.map((insight) => (
              <InsightRow key={insight.id} insight={insight} />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 text-xs"
                  onClick={() => setDisplayCount((c) => c + 25)}
                >
                  Load more ({filtered.length - displayCount} remaining)
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-10 text-center">
            <AlertCircle className="w-6 h-6 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-600">No insights match your filters.</p>
            <button
              className="text-xs text-[#c9a84c] mt-2 hover:underline"
              onClick={() => {
                setSearch('');
                setFilterSource('all');
                setFilterTheme('all');
                setFilterSubreddit('all');
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
