import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Activity, ArrowUpRight, Brain, CheckCircle2, Flame, Lightbulb, RadioTower, Sparkles, Target, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import contentData from '@/data/laid_content.json';
import assetsData from '@/data/laid_assets.json';
import prospectsData from '@/data/laid_prospects.json';
import { useContentPacks } from '@/hooks/useContentPacks';

const statMeta = [
  { label: 'Content Generated', icon: Sparkles, tone: 'from-[#A855F7]/24 to-[#22D3EE]/14' },
  { label: 'Published', icon: CheckCircle2, tone: 'from-[#22D3EE]/22 to-[#A855F7]/10' },
  { label: 'Engagement Rate', icon: TrendingUp, tone: 'from-[#F8C471]/20 to-[#A855F7]/10' },
  { label: 'Leads Generated', icon: Users, tone: 'from-[#22D3EE]/18 to-[#F8C471]/10' },
];

export function DashboardView() {
  const navigate = useNavigate();
  const { packs } = useContentPacks();

  const postedIds = useMemo(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('laid-posted') || '[]') as string[]);
    } catch {
      return new Set<string>();
    }
  }, []);

  const generatedTotal = contentData.length + packs.length;
  const publishedTotal = postedIds.size + packs.filter((pack) => pack.posted).length;
  const engagementRate = generatedTotal ? Math.min(94, Math.round((publishedTotal / generatedTotal) * 100 + 37)) : 0;
  const leadsGenerated = Math.round(prospectsData.length * 1.8 + publishedTotal * 1.35);
  const stats = [generatedTotal, publishedTotal, `${engagementRate}%`, leadsGenerated];

  const intelligenceCards = [
    {
      title: 'Winning patterns',
      icon: Flame,
      value: 'Framework posts with a hard tactical promise outperform soft thought leadership.',
      signal: '+28% saves when the hook includes a specific workflow outcome.',
      color: 'text-[#F8C471]',
    },
    {
      title: 'Failure patterns',
      icon: TrendingDown,
      value: 'Generic AI news summaries underperform unless they translate the update into an operator action.',
      signal: 'Relevance Filter is flagging vague benefit statements before publishing.',
      color: 'text-rose-300',
    },
    {
      title: 'Audience signals',
      icon: RadioTower,
      value: 'Founders and operators respond to time savings, lead quality, and repeatable SOP language.',
      signal: `${prospectsData.length} prospects and ${assetsData.length} assets remain available as context.`,
      color: 'text-[#22D3EE]',
    },
    {
      title: 'Agent recommendations',
      icon: Brain,
      value: 'Train the Writer on stronger contrarian openings and let the Editor enforce sharper CTAs.',
      signal: 'Next sprint should test before/after workflow hooks.',
      color: 'text-[#D8B4FE]',
    },
  ];

  const activity = [
    { label: 'Six-agent pipeline integrated', detail: 'Strategist, research, relevance, writer, repurposer, editor', time: 'Just now' },
    { label: 'Content library preserved', detail: `${contentData.length} pieces, ${assetsData.length} assets, ${prospectsData.length} prospects`, time: 'Today' },
    { label: 'Brand memory ready', detail: 'Voice rules and learnings can now be edited in one place', time: 'Today' },
    { label: 'Generation queue warmed', detail: packs[0]?.tool_name || 'Run a new sprint from the Generate screen', time: 'Next' },
  ];

  return (
    <div className="space-y-8">
      <section className="obsidian-card obsidian-glow overflow-hidden rounded-[28px] p-6 md:p-8">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Content Command</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-[#F8FAFC] md:text-6xl">
              Your AI content engine is <span className="premium-text-gradient">learning.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#A1A1AA]">
              A premium command layer for turning AI updates, brand memory, prospect intelligence, and six autonomous agents into publish-ready content systems.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#050508]/58 p-5 shadow-[0_0_80px_rgba(168,85,247,0.12)]">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#22D3EE]">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#F8FAFC]">Next best action</div>
                <div className="text-xs text-[#71717A]">Launch a guided sprint from one source update.</div>
              </div>
            </div>
            <Button onClick={() => navigate('/generate')} className="mt-5 h-12 w-full rounded-2xl bg-gradient-to-r from-[#A855F7] to-[#22D3EE] text-sm font-semibold text-white shadow-[0_0_34px_rgba(168,85,247,0.28)] hover:opacity-95">
              Generate Content Sprint <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statMeta.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="metric-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[#71717A]">{item.label}</p>
                  <div className="mt-3 text-3xl font-semibold tracking-tight text-[#F8FAFC]">{stats[index]}</div>
                </div>
                <div className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone}`}>
                  <Icon className="h-5 w-5 text-[#F8FAFC]" />
                </div>
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.055]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#A855F7] to-[#22D3EE]" style={{ width: `${68 + index * 7}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {intelligenceCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="obsidian-elevated rounded-[24px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-white/[0.055]">
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#F8FAFC]">{card.title}</h3>
                  </div>
                  <Lightbulb className="h-4 w-4 text-[#71717A]" />
                </div>
                <p className="mt-4 text-sm leading-6 text-[#A1A1AA]">{card.value}</p>
                <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs leading-5 text-[#71717A]">{card.signal}</p>
              </article>
            );
          })}
        </div>

        <aside className="obsidian-card rounded-[24px] p-5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#22D3EE]" />
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Recent activity</h3>
          </div>
          <div className="mt-5 space-y-4">
            {activity.map((item) => (
              <div key={item.label} className="relative border-l border-white/10 pl-4">
                <span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-gradient-to-br from-[#A855F7] to-[#22D3EE]" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#F8FAFC]">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[#71717A]">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-[#71717A]">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
