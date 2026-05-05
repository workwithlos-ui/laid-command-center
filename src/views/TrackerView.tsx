import { ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import prospectsData from '@/data/laid_prospects.json';
import type { Prospect } from '@/data/types';

export function TrackerView() {
  const [stages, setStages] = useLocalStorage<Record<number, string>>('laid-tracker-stages', {});

  const getStage = (p: Prospect) => stages[p.id] ?? p.stage;

  const handleStageChange = (id: number, stage: string) => {
    setStages((prev) => ({ ...prev, [id]: stage }));
  };

  const stageColors: Record<string, string> = {
    Lead: 'text-[#a0a0a0]',
    Contacted: 'text-[#3b82f6]',
    Responded: 'text-[#f97316]',
    Meeting: 'text-[#c9a84c]',
    Closed: 'text-[#22c55e]',
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-[#666666]">
        {prospectsData.length} prospects tracked
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-[#222222] lg:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#222222] bg-[#111111]">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#666666]">
                Name
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#666666]">
                Company
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#666666]">
                Industry
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#666666]">
                Revenue
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#666666]">
                Stage
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#666666]">
                Icebreaker
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#666666]">
                LinkedIn
              </th>
            </tr>
          </thead>
          <tbody>
            {prospectsData.map((prospect) => {
              const stage = getStage(prospect);
              const icebreakerShort =
                prospect.icebreaker.length > 60
                  ? prospect.icebreaker.slice(0, 60) + '...'
                  : prospect.icebreaker;

              return (
                <tr
                  key={prospect.id}
                  className="border-b border-[#222222] transition-colors hover:bg-[#1a1a1a]"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">{prospect.name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#a0a0a0]">{prospect.company}</td>
                  <td className="px-4 py-3 text-sm text-[#a0a0a0]">{prospect.industry}</td>
                  <td className="px-4 py-3 text-xs text-[#a0a0a0]">{prospect.revenue}</td>
                  <td className="px-4 py-3">
                    <Select value={stage} onValueChange={(v) => handleStageChange(prospect.id, v)}>
                      <SelectTrigger className="h-8 w-32 border-[#222222] bg-[#111111] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-[#222222] bg-[#111111]">
                        {['Lead', 'Contacted', 'Responded', 'Meeting', 'Closed'].map((s) => (
                          <SelectItem key={s} value={s} className={`text-xs ${stageColors[s]}`}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="group relative max-w-[180px]">
                      <span className="block truncate text-xs text-[#a0a0a0]">{icebreakerShort}</span>
                      <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-72 rounded border border-[#222222] bg-[#1a1a1a] p-3 text-xs text-[#a0a0a0] shadow-lg group-hover:block">
                        {prospect.icebreaker}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={prospect.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-[#3b82f6] px-3 py-1 text-xs text-[#3b82f6] hover:bg-[#3b82f6]/10"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {prospectsData.map((prospect) => {
          const stage = getStage(prospect);
          return (
            <div
              key={prospect.id}
              className="rounded-lg border border-[#222222] bg-[#111111] p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{prospect.name}</div>
                  <div className="text-xs text-[#666666]">{prospect.company}</div>
                </div>
                <a
                  href={prospect.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-[#3b82f6] px-2 py-1 text-[10px] text-[#3b82f6]"
                >
                  <ExternalLink className="h-3 w-3" />
                  LinkedIn
                </a>
              </div>
              <div className="mt-2 text-xs text-[#a0a0a0]">
                {prospect.industry} · {prospect.revenue}
              </div>
              <div className="mt-3">
                <Select value={stage} onValueChange={(v) => handleStageChange(prospect.id, v)}>
                  <SelectTrigger className="h-8 w-full border-[#222222] bg-[#111111] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#222222] bg-[#111111]">
                    {['Lead', 'Contacted', 'Responded', 'Meeting', 'Closed'].map((s) => (
                      <SelectItem key={s} value={s} className={`text-xs ${stageColors[s]}`}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-2 text-xs text-[#a0a0a0]">{prospect.icebreaker}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
