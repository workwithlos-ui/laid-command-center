import { ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Prospect } from '@/data/types';

interface ProspectRowProps {
  prospect: Prospect;
  stage: string;
  onStageChange: (id: number, stage: string) => void;
}

export function ProspectRow({ prospect, stage, onStageChange }: ProspectRowProps) {
  const icebreakerShort =
    prospect.icebreaker.length > 60
      ? prospect.icebreaker.slice(0, 60) + '...'
      : prospect.icebreaker;

  return (
    <tr className="border-b border-[#222222] transition-colors hover:bg-[#1a1a1a]">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-white">{prospect.name}</div>
        <div className="text-xs text-[#666666]">{prospect.company}</div>
      </td>
      <td className="px-4 py-3 text-sm text-[#a0a0a0]">{prospect.industry}</td>
      <td className="px-4 py-3 text-sm text-[#a0a0a0]">{prospect.revenue}</td>
      <td className="px-4 py-3">
        <Select value={stage} onValueChange={(v) => onStageChange(prospect.id, v)}>
          <SelectTrigger className="h-8 w-32 border-[#222222] bg-[#111111] text-xs text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[#222222] bg-[#111111]">
            <SelectItem value="Lead" className="text-xs text-[#a0a0a0] hover:text-white">Lead</SelectItem>
            <SelectItem value="Contacted" className="text-xs text-[#3b82f6] hover:text-white">Contacted</SelectItem>
            <SelectItem value="Responded" className="text-xs text-[#f97316] hover:text-white">Responded</SelectItem>
            <SelectItem value="Meeting" className="text-xs text-[#c9a84c] hover:text-white">Meeting</SelectItem>
            <SelectItem value="Closed" className="text-xs text-[#22c55e] hover:text-white">Closed</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3">
        <div className="group relative max-w-[200px]">
          <span className="block truncate text-xs text-[#a0a0a0]">{icebreakerShort}</span>
          <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden w-72 rounded border border-[#222222] bg-[#1a1a1a] p-3 text-xs text-[#a0a0a0] shadow-lg group-hover:block z-10">
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
          LinkedIn
        </a>
      </td>
    </tr>
  );
}
