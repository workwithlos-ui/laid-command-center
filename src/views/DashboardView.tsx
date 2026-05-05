import { useNavigate } from 'react-router';
import { Copy, Users, GitBranch, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import contentData from '@/data/laid_content.json';
import prospectsData from '@/data/laid_prospects.json';

export function DashboardView() {
  const navigate = useNavigate();
  const [posted] = useLocalStorage<string[]>('laid-posted', []);
  const [stages] = useLocalStorage<Record<number, string>>('laid-tracker-stages', {});
  const [copiedAssets] = useLocalStorage<string[]>('laid-assets-copied', []);

  const prospectsContacted = prospectsData.filter(
    (p) => stages[p.id] && stages[p.id] !== 'Lead'
  ).length;

  const firstUnposted = contentData.find((c) => !posted.includes(c.id));

  const recentActivities = [
    ...(posted.length > 0
      ? [
          {
            text: `Posted ${contentData.find((c) => c.id === posted[posted.length - 1])?.title ?? 'content'}`,
            time: 'Recently',
          },
        ]
      : []),
    ...(copiedAssets.length > 0
      ? [
          {
            text: `Copied ${copiedAssets[copiedAssets.length - 1]} template`,
            time: 'Recently',
          },
        ]
      : []),
    ...(Object.entries(stages).length > 0
      ? [
          {
            text: `Updated ${prospectsData.find((p) => String(p.id) === Object.keys(stages)[0])?.name ?? 'prospect'} to ${Object.values(stages)[0] ?? 'Contacted'}`,
            time: 'Recently',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard value={posted.length} label="Pieces Posted" sublabel="this week" />
        <StatCard value={prospectsContacted} label="Prospects Contacted" sublabel="out of 20" />
        <StatCard value={copiedAssets.length} label="Assets Copied" sublabel="all time" />
        <StatCard value="7" label="Streak" sublabel="days" />
      </div>

      <div className="flex flex-wrap gap-2">
        {firstUnposted && (
          <Button
            className="h-9 bg-[#c9a84c] text-black hover:bg-[#c9a84c]/90 text-xs"
            onClick={() => {
              navigator.clipboard.writeText(firstUnposted.body);
            }}
          >
            <Copy className="mr-1 h-3 w-3" />
            Copy Today's Post
          </Button>
        )}
        <Button
          variant="outline"
          className="h-9 border-[#222222] text-[#a0a0a0] hover:border-[#c9a84c] hover:text-[#c9a84c] text-xs"
          onClick={() => navigate('/tracker')}
        >
          <Users className="mr-1 h-3 w-3" />
          Open Tracker
        </Button>
        <Button
          variant="outline"
          className="h-9 border-[#222222] text-[#a0a0a0] hover:border-[#c9a84c] hover:text-[#c9a84c] text-xs"
          onClick={() => navigate('/swarm')}
        >
          <GitBranch className="mr-1 h-3 w-3" />
          View Swarm
        </Button>
      </div>

      <div className="rounded-lg border border-[#222222] bg-[#111111]">
        <div className="border-b border-[#222222] px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="divide-y divide-[#222222]">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <CheckCircle className="h-4 w-4 text-[#c9a84c]" />
                <span className="text-sm text-[#a0a0a0]">{activity.text}</span>
                <span className="ml-auto text-[10px] text-[#666666]">{activity.time}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm text-[#666666]">
              Nothing yet. Post something.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
