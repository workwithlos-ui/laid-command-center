import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Video,
  FileText,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/* ── Demo data ── */
const DEMO_STATS = {
  videosThisWeek: 12,
  videosChange: 33,
  contentShipped: 47,
  contentChange: -8,
  prospectsInPipeline: 23,
  prospectsChange: 15,
  mrrUsd: 8940,
  mrrChange: 22,
  foundingSeatsRemaining: 13,
};

const DEMO_ACTIVITY = [
  { id: '1', type: 'video',   label: 'Avatar video generated — "Why most UGC fails"', time: '2m ago',   status: 'complete' },
  { id: '2', type: 'content', label: 'LinkedIn post queued — Hook #14 variant',          time: '18m ago',  status: 'scheduled' },
  { id: '3', type: 'prospect',label: 'Jordan M. moved to Call Booked stage',             time: '1h ago',   status: 'qualified' },
  { id: '4', type: 'video',   label: 'Avatar video generated — "The content cascade"',  time: '3h ago',   status: 'complete' },
  { id: '5', type: 'content', label: 'X thread posted — 847 impressions',                time: '5h ago',   status: 'posted' },
  { id: '6', type: 'content', label: 'Email sequence draft saved',                       time: 'Yesterday', status: 'draft' },
  { id: '7', type: 'prospect',label: 'Alex K. entered pipeline from Reddit',             time: 'Yesterday', status: 'new' },
];

const DEMO_HOOKS = [
  { id: '1', template: 'How I made $X in Y days without [common method]', score: 94, uses: 127, category: 'income' },
  { id: '2', template: 'The [niche] secret nobody is talking about',       score: 89, uses: 98,  category: 'secret' },
  { id: '3', template: 'I tried [thing] for 30 days. Here\'s what happened', score: 86, uses: 74, category: 'experiment' },
];

/* ── Stat Card ── */
function StatCard({
  label,
  value,
  change,
  prefix = '',
  suffix = '',
  icon: Icon,
}: {
  label: string;
  value: number | string;
  change?: number;
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
}) {
  const isUp = change !== undefined && change > 0;
  const isDown = change !== undefined && change < 0;

  return (
    <div
      className="p-4 rounded-[6px] flex flex-col gap-3"
      style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        <div
          className="flex items-center justify-center w-6 h-6 rounded-[4px]"
          style={{ background: 'rgba(212,255,0,0.08)' }}
        >
          <Icon className="w-3 h-3 text-[#d4ff00]" />
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="num text-[26px] font-semibold text-white leading-none">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </span>
        {change !== undefined && (
          <div className={`stat-pill ${isUp ? 'up' : isDown ? 'down' : 'neutral'} mb-0.5`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      <div className="text-[12px] text-zinc-600">vs. last week</div>
    </div>
  );
}

/* ── Activity row ── */
const activityTypeIcon = {
  video:   Video,
  content: FileText,
  prospect: Users,
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    complete:  'badge-green',
    scheduled: 'badge-blue',
    qualified: 'badge-lime',
    posted:    'badge-zinc',
    draft:     'badge-zinc',
    new:       'badge-orange',
  };
  return map[status] ?? 'badge-zinc';
};

/* ── Main View ── */
export function DashboardView() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(DEMO_STATS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    // Fetch real stats from Supabase
    Promise.all([
      supabase.from('videos').select('id', { count: 'exact', head: true }),
      supabase.from('content_assets').select('id', { count: 'exact', head: true }),
      supabase.from('prospects').select('id', { count: 'exact', head: true }),
      supabase.from('founding_seats').select('seat_number', { count: 'exact', head: true }),
    ]).then(([videos, content, prospects, seats]) => {
      setStats((prev) => ({
        ...prev,
        videosThisWeek: videos.count ?? prev.videosThisWeek,
        contentShipped: content.count ?? prev.contentShipped,
        prospectsInPipeline: prospects.count ?? prev.prospectsInPipeline,
        foundingSeatsRemaining: 50 - (seats.count ?? 37),
      }));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 fade-in">
      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Videos Generated"
          value={loading ? '—' : stats.videosThisWeek}
          change={stats.videosChange}
          suffix=" / wk"
          icon={Video}
        />
        <StatCard
          label="Content Shipped"
          value={loading ? '—' : stats.contentShipped}
          change={stats.contentChange}
          icon={FileText}
        />
        <StatCard
          label="Pipeline"
          value={loading ? '—' : stats.prospectsInPipeline}
          change={stats.prospectsChange}
          suffix=" prospects"
          icon={Users}
        />
        <StatCard
          label="MRR"
          value={loading ? '—' : stats.mrrUsd}
          change={stats.mrrChange}
          prefix="$"
          icon={TrendingUp}
        />
      </div>

      {/* ── Quick actions ── */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/studio')} className="btn-accent">
          <Zap className="w-3.5 h-3.5" />
          New Video
        </button>
        <button onClick={() => navigate('/crm')} className="btn-ghost">
          <Users className="w-3.5 h-3.5" />
          Open CRM
        </button>
        <button onClick={() => navigate('/library')} className="btn-ghost">
          <FileText className="w-3.5 h-3.5" />
          Library
        </button>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">

        {/* Activity feed */}
        <div className="surface overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Activity</span>
            <button className="text-[11px] text-zinc-600 hover:text-zinc-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {DEMO_ACTIVITY.map((item) => {
              const Icon = activityTypeIcon[item.type as keyof typeof activityTypeIcon] ?? CheckCircle2;
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                  <Icon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <span className="text-[13px] text-zinc-300 flex-1 min-w-0 truncate">{item.label}</span>
                  <span className={`badge ${statusBadge(item.status)} shrink-0`}>{item.status}</span>
                  <span className="text-[11px] text-zinc-600 shrink-0 flex items-center gap-1 ml-1">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3">
          {/* Founding seats */}
          <div
            className="rounded-[6px] p-4"
            style={{ background: 'rgba(212,255,0,0.04)', border: '1px solid rgba(212,255,0,0.12)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-[#d4ff00]">Founding Tier</span>
              <span className="badge badge-lime text-[10px]">LIVE</span>
            </div>
            <div className="num text-[28px] font-bold text-white mb-1">
              {stats.foundingSeatsRemaining}
              <span className="text-[16px] text-zinc-500 font-normal"> remaining</span>
            </div>
            <div className="text-[12px] text-zinc-500 mb-3">out of 50 lifetime seats at $1,997</div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${((50 - stats.foundingSeatsRemaining) / 50) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-zinc-600">{50 - stats.foundingSeatsRemaining} claimed</span>
              <span className="text-[11px] text-zinc-600">50 total</span>
            </div>
          </div>

          {/* Top hooks */}
          <div className="surface overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Top Hooks</span>
              <button className="text-[11px] text-zinc-600 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                See all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {DEMO_HOOKS.map((hook) => (
                <div key={hook.id} className="px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                  <div className="text-[12px] text-zinc-300 mb-1 leading-snug line-clamp-2">{hook.template}</div>
                  <div className="flex items-center gap-2">
                    <span className="num text-[11px] text-[#d4ff00] font-medium">{hook.score}</span>
                    <span className="text-[11px] text-zinc-600">score</span>
                    <span className="text-zinc-700">·</span>
                    <span className="num text-[11px] text-zinc-500">{hook.uses}x used</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
