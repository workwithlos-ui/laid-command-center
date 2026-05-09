import { useEffect, useState } from 'react';
import {
  Video,
  FileText,
  Play,
  Download,
  Copy,
  ExternalLink,
  Search,
  Filter,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/* ── Types ── */
type AssetType = 'video' | 'blog' | 'x_thread' | 'linkedin_post' | 'email' | 'carousel' | 'short_script' | 'ad_copy' | 'hook_pack';
type AssetStatus = 'draft' | 'approved' | 'scheduled' | 'posted' | 'archived' | 'complete' | 'generating' | 'failed';

interface LibraryItem {
  id: string;
  type: AssetType;
  title: string;
  created_at: string;
  status: AssetStatus;
  duration?: number;
  platform?: string;
  views?: number;
  preview_url?: string;
}

/* ── Demo data ── */
const DEMO_ITEMS: LibraryItem[] = [
  { id: '1',  type: 'video',         title: 'Why most UGC fails (and what works)',              created_at: '2026-05-09T14:22:00Z', status: 'complete',   duration: 47,  views: 2841 },
  { id: '2',  type: 'linkedin_post', title: 'The content cascade framework for founders',       created_at: '2026-05-09T11:10:00Z', status: 'posted',     platform: 'LinkedIn' },
  { id: '3',  type: 'x_thread',      title: '7 AI tools that replaced my $3k/mo team',         created_at: '2026-05-09T09:00:00Z', status: 'posted',     platform: 'X', views: 12400 },
  { id: '4',  type: 'video',         title: 'How to generate 30 days of content in 4 hours',   created_at: '2026-05-08T18:45:00Z', status: 'complete',   duration: 62,  views: 5103 },
  { id: '5',  type: 'blog',          title: 'The Solo Founder Content Playbook (2026)',         created_at: '2026-05-08T15:30:00Z', status: 'draft' },
  { id: '6',  type: 'email',         title: 'Subject: Here\'s the system I use every week',    created_at: '2026-05-08T12:00:00Z', status: 'scheduled' },
  { id: '7',  type: 'short_script',  title: 'Hook reel — "Stop doing this in your ads"',       created_at: '2026-05-07T20:15:00Z', status: 'approved' },
  { id: '8',  type: 'video',         title: 'AI avatar demo — polished exec style',             created_at: '2026-05-07T16:00:00Z', status: 'generating' },
  { id: '9',  type: 'ad_copy',       title: 'VSL script — LAID founding tier offer',           created_at: '2026-05-07T10:30:00Z', status: 'approved' },
  { id: '10', type: 'carousel',      title: '5 hooks that got 10k impressions (swipe)',         created_at: '2026-05-06T14:00:00Z', status: 'posted',     platform: 'LinkedIn' },
  { id: '11', type: 'video',         title: 'Testimonial avatar — client success story',        created_at: '2026-05-06T09:00:00Z', status: 'complete',   duration: 33,  views: 891 },
  { id: '12', type: 'hook_pack',     title: 'Hook pack #7 — agency owner pain points',         created_at: '2026-05-05T17:00:00Z', status: 'draft' },
  { id: '13', type: 'x_thread',      title: 'How I automated 80% of my content creation',      created_at: '2026-05-05T11:00:00Z', status: 'failed' },
];

const TYPE_FILTER_OPTIONS = ['all', 'video', 'linkedin_post', 'x_thread', 'email', 'blog', 'carousel', 'short_script', 'ad_copy', 'hook_pack'] as const;
const STATUS_FILTER_OPTIONS = ['all', 'complete', 'posted', 'scheduled', 'draft', 'approved', 'generating', 'failed'] as const;

/* ── Helpers ── */
const typeLabel: Record<AssetType, string> = {
  video: 'Video', blog: 'Blog', x_thread: 'Thread', linkedin_post: 'LinkedIn',
  email: 'Email', carousel: 'Carousel', short_script: 'Short', ad_copy: 'Ad Copy', hook_pack: 'Hooks',
};

const typeBadgeClass: Record<AssetType, string> = {
  video: 'badge-lime', blog: 'badge-zinc', x_thread: 'badge-zinc',
  linkedin_post: 'badge-blue', email: 'badge-orange', carousel: 'badge-zinc',
  short_script: 'badge-orange', ad_copy: 'badge-red', hook_pack: 'badge-zinc',
};

const statusIcon = (s: AssetStatus) => {
  switch (s) {
    case 'complete':  case 'posted': return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    case 'generating': return <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />;
    case 'failed':    return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
    case 'scheduled': return <Clock className="w-3.5 h-3.5 text-blue-400" />;
    default:          return <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />;
  }
};

const statusBadgeClass: Record<AssetStatus, string> = {
  complete: 'badge-green', posted: 'badge-green', draft: 'badge-zinc',
  approved: 'badge-blue', scheduled: 'badge-blue', generating: 'badge-zinc',
  archived: 'badge-zinc', failed: 'badge-red',
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtNum(n?: number) {
  if (!n) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/* ── Main View ── */
export function LibraryView() {
  const [items, setItems] = useState<LibraryItem[]>(DEMO_ITEMS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);

    Promise.all([
      supabase.from('videos').select('id, topic, status, duration_seconds, created_at, thumbnail_url').order('created_at', { ascending: false }).limit(50),
      supabase.from('content_assets').select('id, asset_type, title, status, created_at').order('created_at', { ascending: false }).limit(50),
    ]).then(([videos, content]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const videoItems: LibraryItem[] = ((videos.data ?? []) as any[]).map((v) => ({
        id: v.id,
        type: 'video' as AssetType,
        title: v.topic,
        status: v.status as AssetStatus,
        duration: v.duration_seconds,
        created_at: v.created_at,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentItems: LibraryItem[] = ((content.data ?? []) as any[]).map((c) => ({
        id: c.id,
        type: c.asset_type as AssetType,
        title: c.title ?? c.asset_type,
        status: c.status as AssetStatus,
        created_at: c.created_at,
      }));
      if (videoItems.length + contentItems.length > 0) {
        setItems([...videoItems, ...contentItems].sort((a, b) => b.created_at.localeCompare(a.created_at)));
      }
    }).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || item.type === typeFilter;
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const handleCopy = (id: string) => {
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="fade-in space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div
          className="flex items-center gap-2 flex-1 min-w-[200px] rounded-[4px] px-3 h-8"
          style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Search className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="bg-transparent flex-1 text-[13px] text-white outline-none placeholder:text-zinc-600"
          />
        </div>

        {/* Type filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none rounded-[4px] px-3 pr-7 h-8 text-[12px] text-zinc-400 cursor-pointer"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
          >
            {TYPE_FILTER_OPTIONS.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All types' : typeLabel[t as AssetType] ?? t}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-[4px] px-3 pr-7 h-8 text-[12px] text-zinc-400 cursor-pointer"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
          >
            {STATUS_FILTER_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">{s === 'all' ? 'All statuses' : s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1 text-[12px] text-zinc-600 ml-auto">
          <Filter className="w-3 h-3" />
          <span className="num">{filtered.length}</span> items
        </div>
      </div>

      {/* Table */}
      <div className="surface overflow-hidden">
        {/* Table header */}
        <div
          className="grid text-[11px] font-medium uppercase tracking-wider text-zinc-600 px-4"
          style={{
            gridTemplateColumns: '1fr 90px 100px 80px 90px 80px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            height: 34,
            alignItems: 'center',
          }}
        >
          <span>Title</span>
          <span>Type</span>
          <span>Status</span>
          <span className="num">Views</span>
          <span>Created</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-600">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-[13px]">Loading library...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <div className="text-[13px] text-zinc-500">No assets found</div>
              <div className="text-[12px] text-zinc-700 mt-1">Adjust filters or create something in Studio</div>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="grid px-4 items-center hover:bg-white/[0.02] transition-colors"
                style={{
                  gridTemplateColumns: '1fr 90px 100px 80px 90px 80px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  height: 40,
                }}
              >
                {/* Title */}
                <div className="flex items-center gap-2 min-w-0 pr-3">
                  <div className="shrink-0">
                    {item.type === 'video'
                      ? <Video className="w-3.5 h-3.5 text-zinc-600" />
                      : <FileText className="w-3.5 h-3.5 text-zinc-600" />
                    }
                  </div>
                  <span className="text-[13px] text-zinc-200 truncate">{item.title}</span>
                  {item.duration && (
                    <span className="num text-[11px] text-zinc-600 shrink-0">{item.duration}s</span>
                  )}
                </div>

                {/* Type */}
                <span className={`badge ${typeBadgeClass[item.type]} text-[10px]`}>
                  {typeLabel[item.type]}
                </span>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  {statusIcon(item.status)}
                  <span className={`badge ${statusBadgeClass[item.status]} text-[10px] capitalize`}>
                    {item.status}
                  </span>
                </div>

                {/* Views */}
                <span className="num text-[12px] text-zinc-500">{fmtNum(item.views)}</span>

                {/* Date */}
                <span className="text-[11px] text-zinc-600">{fmtDate(item.created_at)}</span>

                {/* Actions */}
                <div className="flex items-center gap-1 justify-end">
                  {item.type === 'video' && (
                    <button
                      title="Preview"
                      className="p-1 rounded-[3px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(item.id)}
                    title="Copy"
                    className="p-1 rounded-[3px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
                  >
                    {copied === item.id ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  {item.type === 'video' && (
                    <button
                      title="Download"
                      className="p-1 rounded-[3px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    title="Open"
                    className="p-1 rounded-[3px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer count */}
      {!loading && (
        <div className="text-[11px] text-zinc-700 text-right">
          Showing <span className="num">{filtered.length}</span> of <span className="num">{items.length}</span> assets
        </div>
      )}
    </div>
  );
}
