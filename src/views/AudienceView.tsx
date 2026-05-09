import { useEffect, useState } from 'react';
import {
  Search,
  ChevronDown,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  Filter,
  Flame,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/* ── Types ── */
interface AudienceInsight {
  id: string;
  source: string;
  subreddit: string | null;
  theme: string | null;
  pain_point: string | null;
  quote: string | null;
  score: number;
  source_url: string | null;
  created_at: string;
  used_in_content_id: string | null;
}

/* ── Demo data ── */
const DEMO_INSIGHTS: AudienceInsight[] = [
  {
    id: '1',  source: 'reddit', subreddit: 'r/Entrepreneur',   theme: 'content overwhelm',
    pain_point: 'Posting consistently is impossible when you\'re running a business solo',
    quote: 'I know I need to post content but I can\'t find time between client work and everything else. It\'s the last thing I do.',
    score: 97, source_url: 'https://reddit.com', created_at: '2026-05-09T08:00:00Z', used_in_content_id: null,
  },
  {
    id: '2',  source: 'reddit', subreddit: 'r/smallbusiness',  theme: 'video creation friction',
    pain_point: 'On-camera anxiety prevents most founders from doing video',
    quote: 'I\'d love to do video but I freeze up every time I try to record. My face doesn\'t match the brand I want.',
    score: 94, source_url: 'https://reddit.com', created_at: '2026-05-09T07:00:00Z', used_in_content_id: '3',
  },
  {
    id: '3',  source: 'reddit', subreddit: 'r/agency',         theme: 'ROI of content',
    pain_point: 'Hard to justify content investment when results aren\'t trackable',
    quote: 'I spend 20+ hours a month on content and can\'t tell if it\'s generating any leads.',
    score: 91, source_url: 'https://reddit.com', created_at: '2026-05-08T14:00:00Z', used_in_content_id: null,
  },
  {
    id: '4',  source: 'reddit', subreddit: 'r/socialmediamarketing', theme: 'algorithm anxiety',
    pain_point: 'Constant algorithm changes make consistency feel futile',
    quote: 'Just when I figure out what works, the algorithm flips. Starting over every 3 months is exhausting.',
    score: 88, source_url: 'https://reddit.com', created_at: '2026-05-08T10:00:00Z', used_in_content_id: null,
  },
  {
    id: '5',  source: 'reddit', subreddit: 'r/Entrepreneur',   theme: 'hiring for content',
    pain_point: 'Hiring a content team is too expensive for early-stage founders',
    quote: 'A decent content team costs $3-5k/month minimum. I\'d need clients to get clients — it\'s a catch-22.',
    score: 86, source_url: 'https://reddit.com', created_at: '2026-05-07T16:00:00Z', used_in_content_id: '7',
  },
  {
    id: '6',  source: 'reddit', subreddit: 'r/consulting',     theme: 'personal brand resistance',
    pain_point: 'Consultants feel personal branding is "not professional"',
    quote: 'My clients come from referrals. I always thought LinkedIn posting was for people who don\'t have real clients.',
    score: 83, source_url: 'https://reddit.com', created_at: '2026-05-07T12:00:00Z', used_in_content_id: null,
  },
  {
    id: '7',  source: 'reddit', subreddit: 'r/freelance',      theme: 'feast or famine cycle',
    pain_point: 'Content gets paused during busy periods, killing pipeline',
    quote: 'When I\'m busy with clients I stop posting. Then the work dries up and I scramble to rebuild.',
    score: 81, source_url: 'https://reddit.com', created_at: '2026-05-06T09:00:00Z', used_in_content_id: null,
  },
  {
    id: '8',  source: 'reddit', subreddit: 'r/startups',       theme: 'AI content quality',
    pain_point: 'AI-generated content feels generic and untrustworthy',
    quote: 'Every AI post sounds the same. I tried ChatGPT for LinkedIn and immediately stopped when I read it back.',
    score: 79, source_url: 'https://reddit.com', created_at: '2026-05-05T14:00:00Z', used_in_content_id: null,
  },
];

const THEME_OPTIONS = ['all', 'content overwhelm', 'video creation friction', 'ROI of content', 'algorithm anxiety', 'hiring for content', 'personal brand resistance', 'feast or famine cycle', 'AI content quality'];
const SUBREDDIT_OPTIONS = ['all', 'r/Entrepreneur', 'r/smallbusiness', 'r/agency', 'r/socialmediamarketing', 'r/consulting', 'r/freelance', 'r/startups'];

function scoreColor(score: number) {
  if (score >= 90) return '#d4ff00';
  if (score >= 80) return '#60a5fa';
  return '#71717a';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AudienceView() {
  const [insights, setInsights] = useState<AudienceInsight[]>(DEMO_INSIGHTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [themeFilter, setThemeFilter] = useState('all');
  const [subredditFilter, setSubredditFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    void (async () => {
      try {
        const { data } = await supabase
          .from('audience_insights')
          .select('*')
          .order('score', { ascending: false })
          .limit(100);
        if (data && data.length > 0) setInsights(data as AudienceInsight[]);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = insights.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      i.pain_point?.toLowerCase().includes(q) ||
      i.theme?.toLowerCase().includes(q) ||
      i.quote?.toLowerCase().includes(q) ||
      i.subreddit?.toLowerCase().includes(q);
    const matchTheme = themeFilter === 'all' || i.theme === themeFilter;
    const matchSub = subredditFilter === 'all' || i.subreddit === subredditFilter;
    return matchSearch && matchTheme && matchSub;
  });

  return (
    <div className="fade-in space-y-4">
      {/* Header stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Insights collected', value: insights.length, icon: MessageSquare },
          { label: 'Subreddits tracked', value: new Set(insights.map((i) => i.subreddit)).size, icon: TrendingUp },
          { label: 'Used in content', value: insights.filter((i) => i.used_in_content_id).length, icon: ArrowUpRight },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-[6px] p-3 flex items-center gap-3"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 rounded-[4px] shrink-0"
              style={{ background: 'rgba(212,255,0,0.08)' }}
            >
              <Icon className="w-3.5 h-3.5 text-[#d4ff00]" />
            </div>
            <div>
              <div className="num text-[18px] font-semibold text-white leading-none">{value}</div>
              <div className="text-[11px] text-zinc-600 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-2 flex-1 min-w-[200px] rounded-[4px] px-3 h-8"
          style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Search className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pain points, quotes, themes..."
            className="bg-transparent flex-1 text-[13px] text-white outline-none placeholder:text-zinc-600"
          />
        </div>

        <div className="relative">
          <select
            value={themeFilter}
            onChange={(e) => setThemeFilter(e.target.value)}
            className="appearance-none rounded-[4px] px-3 pr-7 h-8 text-[12px] text-zinc-400 cursor-pointer"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
          >
            {THEME_OPTIONS.map((t) => (
              <option key={t} value={t} className="capitalize">{t === 'all' ? 'All themes' : t}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={subredditFilter}
            onChange={(e) => setSubredditFilter(e.target.value)}
            className="appearance-none rounded-[4px] px-3 pr-7 h-8 text-[12px] text-zinc-400 cursor-pointer"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
          >
            {SUBREDDIT_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All subreddits' : s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1 text-[12px] text-zinc-600 ml-auto">
          <Filter className="w-3 h-3" />
          <span className="num">{filtered.length}</span> results
        </div>
      </div>

      {/* Table */}
      <div className="surface overflow-hidden">
        {/* Header */}
        <div
          className="grid text-[11px] font-medium uppercase tracking-wider text-zinc-600 px-4"
          style={{
            gridTemplateColumns: '28px 100px 120px 1fr 70px 80px 90px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            height: 34,
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span className="num text-center">#</span>
          <span>Theme</span>
          <span>Subreddit</span>
          <span>Pain Point</span>
          <span className="num text-center">Score</span>
          <span>Used</span>
          <span>Date</span>
        </div>

        {/* Body */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-zinc-600">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-[13px]">Loading insights...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <div className="text-[13px] text-zinc-500">No insights found</div>
            </div>
          ) : (
            filtered.map((insight, idx) => (
              <div key={insight.id}>
                {/* Main row */}
                <button
                  onClick={() => setExpanded(expanded === insight.id ? null : insight.id)}
                  className="w-full grid px-4 items-center hover:bg-white/[0.02] transition-colors text-left"
                  style={{
                    gridTemplateColumns: '28px 100px 120px 1fr 70px 80px 90px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    minHeight: 40,
                    paddingTop: 8,
                    paddingBottom: 8,
                    gap: 12,
                  }}
                >
                  {/* Rank */}
                  <span className="num text-[11px] text-zinc-700 text-center">{idx + 1}</span>

                  {/* Theme */}
                  <span className="text-[12px] text-zinc-400 truncate capitalize">{insight.theme ?? '—'}</span>

                  {/* Subreddit */}
                  <span className="badge badge-zinc text-[10px] truncate">{insight.subreddit ?? '—'}</span>

                  {/* Pain point */}
                  <span className="text-[13px] text-zinc-300 leading-snug line-clamp-2 pr-4">
                    {insight.pain_point ?? '—'}
                  </span>

                  {/* Score */}
                  <div className="flex items-center justify-center gap-1">
                    {insight.score >= 90 && <Flame className="w-3 h-3 text-[#d4ff00] shrink-0" />}
                    <span
                      className="num text-[13px] font-semibold"
                      style={{ color: scoreColor(insight.score) }}
                    >
                      {insight.score}
                    </span>
                  </div>

                  {/* Used */}
                  {insight.used_in_content_id ? (
                    <span className="badge badge-lime text-[10px]">Used</span>
                  ) : (
                    <span className="badge badge-zinc text-[10px]">Unused</span>
                  )}

                  {/* Date */}
                  <span className="text-[11px] text-zinc-600">{fmtDate(insight.created_at)}</span>
                </button>

                {/* Expanded quote */}
                {expanded === insight.id && insight.quote && (
                  <div
                    className="px-4 py-3 mx-4 my-1 rounded-[4px] text-[12px] text-zinc-400 italic leading-relaxed"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-zinc-600 not-italic text-[11px] uppercase tracking-wider mr-2">Quote</span>
                    &ldquo;{insight.quote}&rdquo;
                    <div className="flex items-center gap-2 mt-2 not-italic">
                      {insight.source_url && (
                        <a
                          href={insight.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Source
                        </a>
                      )}
                      <button className="flex items-center gap-1 text-[11px] text-[#d4ff00] hover:text-[#e0ff33] transition-colors ml-auto">
                        <ArrowUpRight className="w-3 h-3" />
                        Use in content
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
