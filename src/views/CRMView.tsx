import { useEffect, useState } from 'react';
import {
  Search,
  ChevronDown,
  Plus,
  ExternalLink,
  MoreHorizontal,
  Loader2,
  Users,
  DollarSign,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/* ── Types ── */
type Stage = 'new' | 'engaged' | 'qualified' | 'call_booked' | 'proposal' | 'closed_won' | 'closed_lost';

interface Prospect {
  id: string;
  name: string;
  handle: string | null;
  platform: string | null;
  email: string | null;
  source: string | null;
  stage: Stage;
  notes: string | null;
  last_contact: string | null;
  next_action: string | null;
  next_action_date: string | null;
  deal_value: number | null;
  created_at: string;
}

/* ── Demo data ── */
const DEMO_PROSPECTS: Prospect[] = [
  { id: '1',  name: 'Jordan Mills',     handle: '@jordanmills_',  platform: 'twitter', email: 'jordan@mills.co',     source: 'Reddit',     stage: 'call_booked',  notes: 'Solo consultant, 3 employees. Wants content system.', last_contact: '2026-05-08', next_action: 'Discovery call', next_action_date: '2026-05-11', deal_value: 1997, created_at: '2026-05-01T10:00:00Z' },
  { id: '2',  name: 'Sarah Chen',       handle: '@sarahcodes',    platform: 'linkedin',email: 'sarah@chentech.io',   source: 'LinkedIn',   stage: 'proposal',     notes: 'SaaS founder, 12 employees. Strong referral.',        last_contact: '2026-05-09', next_action: 'Send proposal', next_action_date: '2026-05-10', deal_value: 5991, created_at: '2026-04-28T14:00:00Z' },
  { id: '3',  name: 'Marcus Webb',      handle: '@marcuswebb',    platform: 'twitter', email: null,                  source: 'Twitter DM', stage: 'qualified',    notes: 'Agency owner. Pain: posting consistently.',           last_contact: '2026-05-07', next_action: 'Follow up', next_action_date: '2026-05-12', deal_value: 1997, created_at: '2026-05-03T09:00:00Z' },
  { id: '4',  name: 'Priya Sharma',     handle: '@priyasharma',   platform: 'linkedin',email: 'p.sharma@biz.com',    source: 'Reddit',     stage: 'engaged',      notes: 'Freelance consultant. Lurker turned commenter.',       last_contact: '2026-05-06', next_action: 'Send case study', next_action_date: '2026-05-13', deal_value: 1997, created_at: '2026-05-04T16:00:00Z' },
  { id: '5',  name: 'Alex Kowalski',    handle: '@alexkow',       platform: 'twitter', email: 'alex@kowalski.io',    source: 'Reddit',     stage: 'new',          notes: 'Pain: On-camera anxiety. Has money.',                 last_contact: null,          next_action: 'Initial outreach', next_action_date: '2026-05-10', deal_value: null, created_at: '2026-05-05T11:00:00Z' },
  { id: '6',  name: 'Destiny Okafor',   handle: '@destinyok',     platform: 'instagram',email: 'destiny@d.co',       source: 'Instagram',  stage: 'closed_won',   notes: 'Founding member #34. Already paid.',                  last_contact: '2026-05-02', next_action: 'Onboarding call', next_action_date: '2026-05-14', deal_value: 1997, created_at: '2026-04-20T08:00:00Z' },
  { id: '7',  name: 'Rafael Torres',    handle: null,             platform: 'email',   email: 'rtorres@consulting.com',source:'Cold email', stage: 'new',          notes: 'Inbound via cold email reply.',                       last_contact: null,          next_action: 'Qualify', next_action_date: null, deal_value: null, created_at: '2026-05-08T12:00:00Z' },
  { id: '8',  name: 'Lauren Park',      handle: '@laurenpark_',   platform: 'linkedin',email: 'lauren@lp.ventures',  source: 'LinkedIn',   stage: 'engaged',      notes: 'VC analyst. Content = dealflow. Smart ICP.',          last_contact: '2026-05-05', next_action: 'Book call', next_action_date: '2026-05-15', deal_value: 5991, created_at: '2026-05-02T15:00:00Z' },
  { id: '9',  name: 'Chris Nguyen',     handle: '@chrisndev',     platform: 'twitter', email: null,                  source: 'Twitter',    stage: 'closed_lost',  notes: 'Budget constraint. Revisit Q3.',                      last_contact: '2026-04-30', next_action: 'Reconnect Q3',   next_action_date: '2026-07-01', deal_value: 1997, created_at: '2026-04-15T10:00:00Z' },
  { id: '10', name: 'Emma Fitzgerald',  handle: '@emmafitz',      platform: 'linkedin',email: 'emma@fitz.studio',    source: 'Reddit',     stage: 'call_booked',  notes: 'Creative agency owner. Very warm lead.',               last_contact: '2026-05-08', next_action: 'Sales call',     next_action_date: '2026-05-12', deal_value: 1997, created_at: '2026-05-06T09:00:00Z' },
];

/* ── Config ── */
const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: 'new',         label: 'New',         color: '#52525b' },
  { key: 'engaged',     label: 'Engaged',     color: '#3b82f6' },
  { key: 'qualified',   label: 'Qualified',   color: '#f59e0b' },
  { key: 'call_booked', label: 'Call Booked', color: '#d4ff00' },
  { key: 'proposal',    label: 'Proposal',    color: '#a78bfa' },
  { key: 'closed_won',  label: 'Won',         color: '#22c55e' },
  { key: 'closed_lost', label: 'Lost',        color: '#ef4444' },
];

const stageMap = Object.fromEntries(STAGES.map((s) => [s.key, s]));

function stageBadgeStyle(stage: Stage) {
  const s = stageMap[stage];
  return {
    background: `${s.color}18`,
    border: `1px solid ${s.color}33`,
    color: s.color,
  };
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtValue(v: number | null) {
  if (!v) return '—';
  return `$${v.toLocaleString()}`;
}

type ViewMode = 'table' | 'kanban';

export function CRMView() {
  const [prospects, setProspects] = useState<Prospect[]>(DEMO_PROSPECTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    const query = supabase
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    Promise.resolve(query).then(({ data }) => {
      if (data && data.length > 0) setProspects(data as Prospect[]);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = prospects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) || (p.handle ?? '').toLowerCase().includes(q) || (p.source ?? '').toLowerCase().includes(q);
    const matchStage = stageFilter === 'all' || p.stage === stageFilter;
    return matchSearch && matchStage;
  });

  // Pipeline metrics
  const totalPipeline = prospects
    .filter((p) => !['closed_won', 'closed_lost'].includes(p.stage))
    .reduce((sum, p) => sum + (p.deal_value ?? 0), 0);
  const wonValue = prospects
    .filter((p) => p.stage === 'closed_won')
    .reduce((sum, p) => sum + (p.deal_value ?? 0), 0);

  const handleStageChange = (id: string, stage: Stage) => {
    setProspects((prev) => prev.map((p) => p.id === id ? { ...p, stage } : p));
    if (!isSupabaseConfigured()) return;
    supabase.from('prospects').update({ stage } as never).eq('id', id);
  };

  return (
    <div className="fade-in space-y-4">
      {/* Pipeline metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total prospects', value: prospects.length, icon: Users, prefix: '', suffix: '' },
          { label: 'Pipeline value', value: totalPipeline, icon: DollarSign, prefix: '$', suffix: '' },
          { label: 'Revenue won', value: wonValue, icon: DollarSign, prefix: '$', suffix: '' },
          { label: 'Calls booked', value: prospects.filter((p) => p.stage === 'call_booked').length, icon: Calendar, prefix: '', suffix: ' this month' },
        ].map(({ label, value, icon: Icon, prefix, suffix }) => (
          <div
            key={label}
            className="rounded-[6px] p-3"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[11px] text-zinc-600 uppercase tracking-wider">{label}</span>
            </div>
            <div className="num text-[20px] font-semibold text-white">
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div
          className="flex items-center gap-2 flex-1 min-w-[180px] rounded-[4px] px-3 h-8"
          style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Search className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prospects..."
            className="bg-transparent flex-1 text-[13px] text-white outline-none placeholder:text-zinc-600"
          />
        </div>

        {/* Stage filter */}
        <div className="relative">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as Stage | 'all')}
            className="appearance-none rounded-[4px] px-3 pr-7 h-8 text-[12px] text-zinc-400 cursor-pointer"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
          >
            <option value="all">All stages</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
        </div>

        {/* View mode */}
        <div
          className="flex rounded-[4px] overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {(['table', 'kanban'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-3 h-8 text-[12px] capitalize transition-colors"
              style={{
                background: viewMode === mode ? 'rgba(212,255,0,0.1)' : '#111111',
                color: viewMode === mode ? '#d4ff00' : '#71717a',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Add prospect */}
        <button className="btn-accent ml-auto">
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* ── Table view ── */}
      {viewMode === 'table' && (
        <div className="surface overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="w-[160px]">Name</th>
                <th className="w-[100px]">Platform</th>
                <th className="w-[120px]">Source</th>
                <th className="w-[130px]">Stage</th>
                <th className="w-[100px]">Deal</th>
                <th className="w-[100px]">Last Contact</th>
                <th className="w-[160px]">Next Action</th>
                <th className="w-[80px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-600 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-zinc-600">No prospects found</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-medium text-white">{p.name}</div>
                      {p.handle && <div className="text-[11px] text-zinc-600 mt-0.5">{p.handle}</div>}
                    </td>
                    <td>
                      <span className="badge badge-zinc text-[10px] capitalize">{p.platform ?? '—'}</span>
                    </td>
                    <td className="text-zinc-400">{p.source ?? '—'}</td>
                    <td>
                      <div className="relative">
                        <select
                          value={p.stage}
                          onChange={(e) => handleStageChange(p.id, e.target.value as Stage)}
                          className="appearance-none rounded-[4px] px-2 pr-6 py-1 text-[12px] font-medium cursor-pointer w-full"
                          style={{ ...stageBadgeStyle(p.stage), outline: 'none', border: 'none' }}
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60 pointer-events-none" />
                      </div>
                    </td>
                    <td className="num text-zinc-400">{fmtValue(p.deal_value)}</td>
                    <td className="text-zinc-500">{fmtDate(p.last_contact)}</td>
                    <td>
                      {p.next_action ? (
                        <div>
                          <div className="text-[12px] text-zinc-300">{p.next_action}</div>
                          {p.next_action_date && (
                            <div className="text-[11px] text-zinc-600 mt-0.5">{fmtDate(p.next_action_date)}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-700">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        {p.handle && (
                          <button
                            title="Open profile"
                            className="p-1 rounded-[3px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        <button className="p-1 rounded-[3px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors">
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Kanban view ── */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {STAGES.map((stageConfig) => {
              const stageProspects = prospects.filter((p) => p.stage === stageConfig.key);
              return (
                <div key={stageConfig.key} className="kanban-col">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-[4px]"
                    style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: stageConfig.color }} />
                      <span className="text-[12px] font-medium text-zinc-400">{stageConfig.label}</span>
                    </div>
                    <span className="num text-[11px] text-zinc-600">{stageProspects.length}</span>
                  </div>

                  {/* Cards */}
                  {stageProspects.map((p) => (
                    <div key={p.id} className="kanban-card">
                      <div className="font-medium text-[13px] text-white">{p.name}</div>
                      {p.handle && <div className="text-[11px] text-zinc-600 mt-0.5">{p.handle}</div>}
                      <div className="flex items-center gap-2 mt-2">
                        {p.source && <span className="badge badge-zinc text-[10px]">{p.source}</span>}
                        {p.deal_value && <span className="num text-[11px] text-[#d4ff00]">{fmtValue(p.deal_value)}</span>}
                      </div>
                      {p.next_action && (
                        <div className="flex items-center gap-1 mt-2 text-[11px] text-zinc-600">
                          <ArrowRight className="w-2.5 h-2.5" />
                          {p.next_action}
                        </div>
                      )}
                    </div>
                  ))}

                  {stageProspects.length === 0 && (
                    <div
                      className="rounded-[4px] py-4 text-center text-[12px] text-zinc-700"
                      style={{ border: '1px dashed rgba(255,255,255,0.06)' }}
                    >
                      Empty
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
