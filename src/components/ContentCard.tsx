import { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ContentPiece } from '@/data/types';
import { renderMarkdown } from '@/lib/mdrender';

interface ContentCardProps {
  content: ContentPiece;
  isPosted: boolean;
  onTogglePosted: (id: string) => void;
  onCopy: (text: string) => void;
}

export function ContentCard({ content, isPosted, onTogglePosted, onCopy }: ContentCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatLabel = (format: string) => {
    switch (format) {
      case 'short': return 'Short';
      case 'linkedin': return 'LinkedIn';
      case 'x': return 'X';
      case 'email': return 'Email';
      case 'blog': return 'Blog';
      case 'carousel': return 'Carousel';
      default: return format;
    }
  };

  const formatBadgeColor = (format: string) => {
    switch (format) {
      case 'short': return 'bg-[#c9a84c] text-black';
      case 'linkedin': return 'bg-[#0077b5] text-white';
      case 'x': return 'bg-white text-black';
      case 'email': return 'bg-[#ea4335] text-white';
      case 'blog': return 'bg-[#34a853] text-white';
      case 'carousel': return 'bg-[#8a7340] text-white';
      default: return 'bg-[#666666] text-white';
    }
  };

  const renderedBody = renderMarkdown(content.body);

  return (
    <div
      className={`rounded-lg border bg-[#111111] p-4 transition-all duration-200 ${
        isPosted ? 'border-[#22c55e]' : 'border-[#222222]'
      } card-hover`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${formatBadgeColor(content.format)}`}>
            {formatLabel(content.format)}
          </span>
          <span className="rounded border border-[#c9a84c] px-2 py-0.5 font-mono text-[10px] font-medium text-[#c9a84c]">
            {content.dm_keyword}
          </span>
          {isPosted && (
            <span className="rounded bg-[#22c55e]/10 px-2 py-0.5 text-[10px] font-medium text-[#22c55e]">
              Posted
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-white">{content.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs italic text-[#a0a0a0]">{content.hook}</p>

      <div className={`mt-3 overflow-hidden text-xs text-[#a0a0a0] transition-all duration-300 ${expanded ? 'max-h-none' : 'max-h-[120px]'}`}>
        <div
          className="content-body text-[12px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderedBody }}
        />
      </div>
      {content.body.length > 250 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-[11px] font-medium text-[#c9a84c] hover:text-[#e0c56c] transition-colors"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-[#c9a84c] bg-transparent text-[#c9a84c] hover:bg-[#c9a84c]/10 text-xs"
          onClick={() => onCopy(content.body)}
        >
          <Copy className="mr-1 h-3 w-3" />
          Copy
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 text-xs ${
            isPosted
              ? 'border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10'
              : 'border-[#222222] text-[#a0a0a0] hover:border-[#c9a84c] hover:text-[#c9a84c]'
          }`}
          onClick={() => onTogglePosted(content.id)}
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          {isPosted ? 'Posted' : 'Mark Posted'}
        </Button>
      </div>
    </div>
  );
}
