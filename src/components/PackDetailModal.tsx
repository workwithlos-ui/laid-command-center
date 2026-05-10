import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Copy,
  CheckCircle,
  ExternalLink,
  Trash2,
  FileText,
  Twitter,
  Instagram,
  Image,
  Video,
} from 'lucide-react';
import {
  type ContentPack,
  type ContentStyle,
  type OutputFormat,
  formatLabels,
} from '@/data/types';
import { renderMarkdown } from '@/lib/mdrender';

export interface PackDetailModalProps {
  pack: ContentPack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTogglePosted: (id: string) => void;
  onDelete: (id: string) => void;
}

const styleBadgeConfig: Record<ContentStyle, { classes: string; label: string }> = {
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

const tabConfig: { format: OutputFormat; label: string; Icon: React.ElementType }[] = [
  { format: 'long_post', label: 'Long Post', Icon: FileText },
  { format: 'x_thread', label: 'X Thread', Icon: Twitter },
  { format: 'ig_caption', label: 'IG Caption', Icon: Instagram },
  { format: 'carousel', label: 'Carousel', Icon: Image },
  { format: 'short_script', label: 'Short Script', Icon: Video },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getContentForFormat(pack: ContentPack, format: OutputFormat): string {
  switch (format) {
    case 'long_post': {
      const lp = pack.long_post;
      return `${lp.title}\n\n${lp.body_markdown}`;
    }
    case 'x_thread': {
      const xt = pack.x_thread;
      return `${xt.hook}\n\n${xt.tweets.map((t, i) => `${i + 1}/ ${t}`).join('\n\n')}`;
    }
    case 'ig_caption': {
      const ig = pack.ig_caption;
      return `${ig.hook}\n\n${ig.body}\n\n${ig.cta}`;
    }
    case 'carousel': {
      const car = pack.carousel;
      return car.slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.bullets.map(b => `- ${b}`).join('\n')}`).join('\n\n');
    }
    case 'short_script': {
      const ss = pack.short_script;
      return `${ss.title}\n\n${ss.beats.map((b, i) => `[${(i + 1) * 8}s] ${b}`).join('\n')}`;
    }
    default:
      return '';
  }
}

export function PackDetailModal({
  pack,
  open,
  onOpenChange,
  onTogglePosted,
  onDelete,
}: PackDetailModalProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OutputFormat>('long_post');

  const handleCopy = useCallback(
    async (format: OutputFormat) => {
      if (!pack) return;
      const text = getContentForFormat(pack, format);
      try {
        await navigator.clipboard.writeText(text);
        setCopiedFormat(format);
        setTimeout(() => setCopiedFormat(null), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    },
    [pack]
  );

  const handleCopyAll = useCallback(async () => {
    if (!pack) return;
    const lines: string[] = [];
    for (const { format } of tabConfig) {
      lines.push(`=== ${formatLabels[format]} ===`);
      lines.push(getContentForFormat(pack, format));
      lines.push('');
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedFormat('all');
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error('Failed to copy all:', err);
    }
  }, [pack]);

  if (!pack) return null;

  const styleConfig = styleBadgeConfig[pack.style] || {
    classes: 'bg-[#222222] text-[#a0a0a0] border-[#333333]',
    label: pack.style,
  };

  const CopyButton = ({ format }: { format: OutputFormat }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleCopy(format)}
      className="text-[#666666] hover:text-[#c9a84c] hover:bg-[#1a1a1a] h-8 px-3"
    >
      {copiedFormat === format ? (
        <>
          <CheckCircle className="size-4 text-green-500" />
          <span className="text-green-500">Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-4" />
          Copy
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#111111] border-[#222222] text-white max-w-4xl max-h-[90vh] p-0 overflow-hidden"
        showCloseButton
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-white text-xl font-semibold leading-snug">
                {pack.tool_name}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${styleConfig.classes}`}
                >
                  {styleConfig.label}
                </Badge>
                {pack.source_url && (
                  <a
                    href={pack.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-[#c9a84c] hover:underline transition-colors"
                  >
                    <ExternalLink className="size-3" />
                    Source
                  </a>
                )}
                <span className="text-xs text-[#666666]">
                  {formatDate(pack.created_at)}
                </span>
                {pack.posted && (
                  <Badge className="bg-green-500/15 text-green-400 border-green-500/25 text-xs">
                    Posted
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAll}
              className="text-[#666666] hover:text-[#c9a84c] hover:bg-[#1a1a1a] h-8 px-3 shrink-0"
            >
              {copiedFormat === 'all' ? (
                <>
                  <CheckCircle className="size-4 text-green-500" />
                  <span className="text-green-500">All Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy All
                </>
              )}
            </Button>
          </div>

          {/* Summary */}
          <DialogDescription className="text-[#a0a0a0] italic text-sm mt-3 leading-relaxed">
            &ldquo;{pack.summary}&rdquo;
          </DialogDescription>
        </DialogHeader>

        {/* Format Tabs */}
        <div className="px-6 mt-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as OutputFormat)}
            className="w-full"
          >
            <TabsList className="bg-[#0a0a0a] border border-[#222222] w-full justify-start overflow-x-auto">
              {tabConfig.map(({ format, label, Icon }) => (
                <TabsTrigger
                  key={format}
                  value={format}
                  className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#c9a84c] data-[state=active]:border-[#c9a84c]/30 text-[#a0a0a0] border border-transparent text-xs px-3 py-1.5 gap-1.5"
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Long Post Tab */}
            <TabsContent value="long_post" className="mt-3 outline-none">
              <div className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-5 max-h-[50vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="text-white font-semibold text-lg">
                    {pack.long_post.title}
                  </h4>
                  <CopyButton format="long_post" />
                </div>
                <div
                  className="text-[#a0a0a0] text-sm leading-relaxed prose prose-invert prose-sm max-w-none
                    [&_strong]:text-white [&_em]:italic [&_code]:bg-[#1a1a1a] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
                    [&_pre]:bg-[#1a1a1a] [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:overflow-x-auto
                    [&_h4]:text-white [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2
                    [&_hr]:border-[#222222] [&_hr]:my-4
                    [&_li]:text-[#a0a0a0] [&_li]:text-sm"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(pack.long_post.body_markdown),
                  }}
                />
              </div>
            </TabsContent>

            {/* X Thread Tab */}
            <TabsContent value="x_thread" className="mt-3 outline-none">
              <div className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-5 max-h-[50vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="text-[#c9a84c] font-semibold text-sm italic leading-relaxed">
                    &ldquo;{pack.x_thread.hook}&rdquo;
                  </div>
                  <CopyButton format="x_thread" />
                </div>
                <div className="flex flex-col gap-4">
                  {pack.x_thread.tweets.map((tweet, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-md bg-[#111111] border border-[#1a1a1a]"
                    >
                      <span className="text-[#c9a84c] font-bold text-xs shrink-0 mt-0.5">
                        {i + 1}/{pack.x_thread.tweets.length}
                      </span>
                      <p className="text-[#a0a0a0] text-sm leading-relaxed">
                        {tweet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* IG Caption Tab */}
            <TabsContent value="ig_caption" className="mt-3 outline-none">
              <div className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-5 max-h-[50vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className="text-xs font-medium text-[#c9a84c] uppercase tracking-wide">
                    IG Caption
                  </span>
                  <CopyButton format="ig_caption" />
                </div>
                {/* Hook */}
                <div className="mb-4">
                  <span className="text-xs font-medium text-[#666666] uppercase tracking-wide">
                    Hook
                  </span>
                  <p className="text-white text-sm font-medium mt-1 leading-relaxed">
                    {pack.ig_caption.hook}
                  </p>
                </div>
                {/* Body */}
                <div className="mb-4">
                  <span className="text-xs font-medium text-[#666666] uppercase tracking-wide">
                    Body
                  </span>
                  <p className="text-[#a0a0a0] text-sm mt-1 leading-relaxed whitespace-pre-wrap">
                    {pack.ig_caption.body}
                  </p>
                </div>
                {/* CTA */}
                <div>
                  <span className="text-xs font-medium text-[#666666] uppercase tracking-wide">
                    CTA
                  </span>
                  <p className="text-[#c9a84c] text-sm font-medium mt-1 leading-relaxed">
                    {pack.ig_caption.cta}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Carousel Tab */}
            <TabsContent value="carousel" className="mt-3 outline-none">
              <div className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-5 max-h-[50vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className="text-xs font-medium text-[#c9a84c] uppercase tracking-wide">
                    Carousel Slides ({pack.carousel.slides.length})
                  </span>
                  <CopyButton format="carousel" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pack.carousel.slides.map((slide, i) => (
                    <div
                      key={i}
                      className="bg-[#111111] border border-[#1a1a1a] rounded-md p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-[#c9a84c] text-black text-xs font-bold rounded-full size-5 flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <h5 className="text-white font-medium text-sm leading-snug">
                          {slide.title}
                        </h5>
                      </div>
                      <ul className="space-y-1.5 ml-7">
                        {slide.bullets.map((bullet, j) => (
                          <li
                            key={j}
                            className="text-[#a0a0a0] text-xs leading-relaxed flex items-start gap-1.5"
                          >
                            <span className="text-[#666666] mt-0.5 shrink-0">
                              &bull;
                            </span>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Short Script Tab */}
            <TabsContent value="short_script" className="mt-3 outline-none">
              <div className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-5 max-h-[50vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h4 className="text-white font-semibold text-base">
                    {pack.short_script.title}
                  </h4>
                  <CopyButton format="short_script" />
                </div>
                <div className="flex flex-col gap-2">
                  {pack.short_script.beats.map((beat, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-2.5 rounded-md bg-[#111111] border border-[#1a1a1a]"
                    >
                      <span className="text-xs font-mono text-[#c9a84c] shrink-0 min-w-[36px] text-right pt-0.5">
                        ~{(i + 1) * 8}s
                      </span>
                      <span className="text-[#666666] text-xs pt-0.5">|</span>
                      <p className="text-[#a0a0a0] text-sm leading-relaxed">
                        {beat}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between gap-3 p-6 pt-4 border-t border-[#1a1a1a] mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTogglePosted(pack.id)}
            className={`h-9 px-4 text-sm font-medium border-[#222222] transition-colors ${
              pack.posted
                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300 border-green-500/25'
                : 'bg-[#0a0a0a] text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            {pack.posted ? (
              <>
                <CheckCircle className="size-4" />
                Mark Unposted
              </>
            ) : (
              <>
                <CheckCircle className="size-4" />
                Mark Posted
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(pack.id)}
            className="h-9 px-4 text-sm font-medium bg-[#0a0a0a] text-red-400 border-red-500/25 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
