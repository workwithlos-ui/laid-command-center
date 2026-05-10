import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  FileText,
  Twitter,
  Instagram,
  Image,
  Video,
  ChevronRight,
} from 'lucide-react';
import { type ContentPack, type OutputFormat, formatLabels } from '@/data/types';

export interface PackCardProps {
  pack: ContentPack;
  onClick: () => void;
}

const styleBadgeConfig: Record<
  string,
  { classes: string; label: string }
> = {
  ai_news: {
    classes: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    label: 'AI News',
  },
  workflow: {
    classes: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    label: 'Workflow',
  },
  system: {
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    label: 'System',
  },
};

const formatIcons: { format: OutputFormat; Icon: React.ElementType; label: string }[] = [
  { format: 'long_post', Icon: FileText, label: formatLabels.long_post },
  { format: 'x_thread', Icon: Twitter, label: formatLabels.x_thread },
  { format: 'ig_caption', Icon: Instagram, label: formatLabels.ig_caption },
  { format: 'carousel', Icon: Image, label: formatLabels.carousel },
  { format: 'short_script', Icon: Video, label: formatLabels.short_script },
];

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    const diffMonths = Math.floor(diffDays / 30);
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  }
  if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }
  return 'Just now';
}

export function PackCard({ pack, onClick }: PackCardProps) {
  const styleConfig = styleBadgeConfig[pack.style] || {
    classes: 'bg-[#222222] text-[#a0a0a0] border-[#333333]',
    label: pack.style,
  };

  const relativeDate = useMemo(
    () => formatRelativeDate(pack.created_at),
    [pack.created_at]
  );

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group bg-[#111111] border border-[#222222] rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-[#c9a84c]/50 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/30"
    >
      {/* Top row: Tool name + style badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-white font-bold text-base leading-snug line-clamp-1 flex-1">
          {pack.tool_name}
        </h3>
        <Badge
          variant="outline"
          className={`shrink-0 text-xs font-medium ${styleConfig.classes}`}
        >
          {styleConfig.label}
        </Badge>
      </div>

      {/* Second row: Summary (truncated to 2 lines) */}
      <p className="text-[#a0a0a0] text-sm mt-2 line-clamp-2 leading-relaxed">
        {pack.summary}
      </p>

      {/* Third row: Format icons */}
      <div className="flex items-center gap-1 mt-3">
        {formatIcons.map(({ format, Icon, label }) => (
          <Tooltip key={format}>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center size-7 rounded-md transition-colors hover:bg-[#1a1a1a]">
                <Icon className="size-4 text-[#666666] group-hover:text-[#a0a0a0] transition-colors" />
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={4}
              className="bg-[#1a1a1a] text-[#a0a0a0] border border-[#222222] px-2 py-1 text-xs rounded-md"
            >
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Bottom row: Date, audience, View chevron */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-2 text-xs text-[#666666]">
          <span>Created {relativeDate}</span>
          {pack.audience && (
            <>
              <span className="text-[#333333]">&middot;</span>
              <span className="truncate max-w-[120px]">{pack.audience}</span>
            </>
          )}
        </div>
        <div className="flex items-center text-[#666666] group-hover:text-[#c9a84c] transition-colors">
          <span className="text-xs font-medium mr-1">View</span>
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}
