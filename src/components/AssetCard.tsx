import { useState } from 'react';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Asset } from '@/data/types';
import { renderMarkdown } from '@/lib/mdrender';

interface AssetCardProps {
  asset: Asset;
  onCopy: (text: string) => void;
}

export function AssetCard({ asset, onCopy }: AssetCardProps) {
  const [showExact, setShowExact] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showExpected, setShowExpected] = useState(false);
  const [showTrouble, setShowTrouble] = useState(false);

  const renderedExact = renderMarkdown(asset.exact_content);
  const renderedHowTo = renderMarkdown(asset.how_to);
  const renderedExpected = renderMarkdown(asset.expected_result);
  const renderedTrouble = renderMarkdown(asset.troubleshooting);

  return (
    <div className="rounded-lg border border-[#222222] bg-[#111111] p-5 card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center rounded border border-[#c9a84c] px-3 py-1 font-mono text-xs font-bold text-[#c9a84c]">
            {asset.keyword}
          </span>
          <h3 className="text-base font-semibold text-white">{asset.title}</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-[#c9a84c] bg-[#c9a84c] text-black hover:bg-[#c9a84c]/90 text-xs shrink-0"
          onClick={() => onCopy(asset.exact_content)}
        >
          <Copy className="mr-1 h-3 w-3" />
          Copy
        </Button>
      </div>

      <div className="mt-3 text-sm text-[#a0a0a0] asset-description">
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(asset.what_is) }} />
      </div>

      <div className="mt-4 space-y-2">
        <CollapsibleSection
          title="Exact Content"
          open={showExact}
          onToggle={() => setShowExact(!showExact)}
        >
          <div className="overflow-x-auto rounded border-l-2 border-l-[#c9a84c] bg-[#0d0d0d] p-3">
            <div
              className="asset-code text-[11px] leading-relaxed text-[#a0a0a0] font-mono"
              dangerouslySetInnerHTML={{ __html: renderedExact }}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="How to Use"
          open={showHowTo}
          onToggle={() => setShowHowTo(!showHowTo)}
        >
          <div className="text-sm text-[#a0a0a0]" dangerouslySetInnerHTML={{ __html: renderedHowTo }} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Expected Result"
          open={showExpected}
          onToggle={() => setShowExpected(!showExpected)}
        >
          <div className="text-sm text-[#a0a0a0]" dangerouslySetInnerHTML={{ __html: renderedExpected }} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Troubleshooting"
          open={showTrouble}
          onToggle={() => setShowTrouble(!showTrouble)}
        >
          <div className="text-sm text-[#a0a0a0]" dangerouslySetInnerHTML={{ __html: renderedTrouble }} />
        </CollapsibleSection>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[#222222]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-2 text-left text-xs font-medium text-[#a0a0a0] hover:text-white"
      >
        {title}
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}
