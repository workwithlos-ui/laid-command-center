import { useCallback, useState, type ElementType, type ReactNode } from 'react';
import { CheckCircle, Copy, ExternalLink, FileText, Image, Instagram, Linkedin, Trash2, Twitter, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ContentPack, ContentStyle, OutputFormat } from '@/data/types';
import { renderMarkdown } from '@/lib/mdrender';

export interface PackDetailModalProps {
  pack: ContentPack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTogglePosted: (id: string) => void;
  onDelete: (id: string) => void;
}

type DetailTab = OutputFormat | 'linkedin';

const styleBadgeConfig: Record<ContentStyle, { classes: string; label: string }> = {
  ai_news: { classes: 'border-[#A855F7]/35 bg-[#A855F7]/12 text-[#D8B4FE]', label: 'AI News' },
  workflow: { classes: 'border-[#22D3EE]/35 bg-[#22D3EE]/12 text-[#67E8F9]', label: 'Workflow' },
  system: { classes: 'border-[#F8C471]/35 bg-[#F8C471]/12 text-[#F8C471]', label: 'System' },
};

const tabConfig: { format: DetailTab; label: string; Icon: ElementType }[] = [
  { format: 'long_post', label: 'Long Post', Icon: FileText },
  { format: 'x_thread', label: 'X Thread', Icon: Twitter },
  { format: 'ig_caption', label: 'IG Caption', Icon: Instagram },
  { format: 'carousel', label: 'Carousel', Icon: Image },
  { format: 'short_script', label: 'Script', Icon: Video },
  { format: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
];

const tabLabels: Record<DetailTab, string> = {
  long_post: 'Long Post',
  x_thread: 'X Thread',
  ig_caption: 'IG Caption',
  carousel: 'Carousel',
  short_script: 'Script',
  linkedin: 'LinkedIn',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getContentForFormat(pack: ContentPack, format: DetailTab): string {
  switch (format) {
    case 'long_post':
      return `${pack.long_post.title}\n\n${pack.long_post.body_markdown}`;
    case 'x_thread':
      return `${pack.x_thread.hook}\n\n${pack.x_thread.tweets.map((tweet, index) => `${index + 1}/ ${tweet}`).join('\n\n')}`;
    case 'ig_caption':
      return `${pack.ig_caption.hook}\n\n${pack.ig_caption.body}\n\n${pack.ig_caption.cta}`;
    case 'carousel':
      return pack.carousel.slides.map((slide, index) => `Slide ${index + 1}: ${slide.title}\n${slide.bullets.map((bullet) => `- ${bullet}`).join('\n')}`).join('\n\n');
    case 'short_script':
      return `${pack.short_script.title}\n\n${pack.short_script.beats.map((beat, index) => `[${(index + 1) * 8}s] ${beat}`).join('\n')}`;
    case 'linkedin':
      return `${pack.long_post.title}\n\n${pack.x_thread.hook}\n\n${pack.long_post.body_markdown}\n\nCTA: Comment “SPRINT” if you want the workflow.`;
    default:
      return '';
  }
}

export function PackDetailModal({ pack, open, onOpenChange, onTogglePosted, onDelete }: PackDetailModalProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('long_post');

  const handleCopy = useCallback(async (format: DetailTab) => {
    if (!pack) return;
    await navigator.clipboard.writeText(getContentForFormat(pack, format));
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 1600);
  }, [pack]);

  const handleCopyAll = useCallback(async () => {
    if (!pack) return;
    const text = tabConfig.map(({ format }) => `=== ${tabLabels[format]} ===\n${getContentForFormat(pack, format)}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopiedFormat('all');
    setTimeout(() => setCopiedFormat(null), 1600);
  }, [pack]);

  if (!pack) return null;

  const styleConfig = styleBadgeConfig[pack.style] || { classes: 'border-white/10 bg-white/[0.045] text-[#A1A1AA]', label: pack.style };
  const score = pack.critic_score || pack.quality_score || 86;

  const CopyButton = ({ format }: { format: DetailTab }) => (
    <Button variant="ghost" size="sm" onClick={() => handleCopy(format)} className="h-8 rounded-xl px-3 text-xs text-[#71717A] hover:bg-white/[0.06] hover:text-[#22D3EE]">
      {copiedFormat === format ? <><CheckCircle className="mr-1 size-4 text-emerald-300" /> Copied</> : <><Copy className="mr-1 size-4" /> Copy</>}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden border-white/10 bg-[#101014]/95 p-0 text-[#F8FAFC] shadow-[0_32px_120px_rgba(0,0,0,0.62)] backdrop-blur-2xl" showCloseButton>
        <DialogHeader className="border-b border-white/10 p-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${styleConfig.classes}`}>{styleConfig.label}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-[11px] text-[#22D3EE]">Quality {score}</span>
                <span className="text-xs text-[#71717A]">{formatDate(pack.created_at)}</span>
                {pack.source_url && (
                  <a href={pack.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#F8C471] hover:underline">
                    <ExternalLink className="size-3" /> Source
                  </a>
                )}
              </div>
              <DialogTitle className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#F8FAFC]">{pack.tool_name}</DialogTitle>
              <DialogDescription className="mt-3 text-sm leading-6 text-[#A1A1AA]">{pack.summary}</DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopyAll} className="h-9 shrink-0 rounded-xl bg-white/[0.045] px-3 text-xs text-[#A1A1AA] hover:bg-white/[0.075] hover:text-[#F8FAFC]">
              {copiedFormat === 'all' ? <><CheckCircle className="mr-1 size-4 text-emerald-300" /> All Copied</> : <><Copy className="mr-1 size-4" /> Copy All</>}
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-5">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DetailTab)} className="w-full">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#050508]/70 p-1">
              {tabConfig.map(({ format, label, Icon }) => (
                <TabsTrigger key={format} value={format} className="gap-1.5 rounded-xl border border-transparent px-3 py-2 text-xs text-[#A1A1AA] data-[state=active]:border-[#A855F7]/30 data-[state=active]:bg-white/[0.075] data-[state=active]:text-[#F8FAFC]">
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="long_post" className="mt-4 outline-none">
              <ContentPanel title={pack.long_post.title} action={<CopyButton format="long_post" />}>
                <div className="content-body text-sm leading-7 text-[#A1A1AA]" dangerouslySetInnerHTML={{ __html: renderMarkdown(pack.long_post.body_markdown) }} />
              </ContentPanel>
            </TabsContent>

            <TabsContent value="x_thread" className="mt-4 outline-none">
              <ContentPanel title={pack.x_thread.hook} action={<CopyButton format="x_thread" />} accent>
                <div className="space-y-3">
                  {pack.x_thread.tweets.map((tweet, index) => (
                    <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-[#A1A1AA]">
                      <span className="mr-2 font-semibold text-[#22D3EE]">{index + 1}/{pack.x_thread.tweets.length}</span>{tweet}
                    </div>
                  ))}
                </div>
              </ContentPanel>
            </TabsContent>

            <TabsContent value="ig_caption" className="mt-4 outline-none">
              <ContentPanel title={pack.ig_caption.hook} action={<CopyButton format="ig_caption" />} accent>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#A1A1AA]">{pack.ig_caption.body}</p>
                <p className="mt-5 rounded-2xl border border-[#A855F7]/25 bg-[#A855F7]/10 p-4 text-sm font-medium text-[#D8B4FE]">{pack.ig_caption.cta}</p>
              </ContentPanel>
            </TabsContent>

            <TabsContent value="carousel" className="mt-4 outline-none">
              <ContentPanel title="Carousel outline" action={<CopyButton format="carousel" />}>
                <div className="grid gap-3 md:grid-cols-2">
                  {pack.carousel.slides.map((slide, index) => (
                    <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-[#22D3EE]">Slide {index + 1}</div>
                      <h4 className="mt-2 text-sm font-semibold text-[#F8FAFC]">{slide.title}</h4>
                      <ul className="mt-3 space-y-2 text-sm leading-5 text-[#A1A1AA]">
                        {slide.bullets.map((bullet) => <li key={bullet}>• {bullet}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </ContentPanel>
            </TabsContent>

            <TabsContent value="short_script" className="mt-4 outline-none">
              <ContentPanel title={pack.short_script.title} action={<CopyButton format="short_script" />}>
                <div className="space-y-3">
                  {pack.short_script.beats.map((beat, index) => (
                    <div key={index} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <span className="shrink-0 text-xs font-semibold text-[#F8C471]">{(index + 1) * 8}s</span>
                      <p className="text-sm leading-6 text-[#A1A1AA]">{beat}</p>
                    </div>
                  ))}
                </div>
              </ContentPanel>
            </TabsContent>

            <TabsContent value="linkedin" className="mt-4 outline-none">
              <ContentPanel title="LinkedIn native post" action={<CopyButton format="linkedin" />} accent>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#A1A1AA]">{getContentForFormat(pack, 'linkedin')}</p>
              </ContentPanel>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => onDelete(pack.id)} className="h-9 rounded-xl text-xs text-rose-300 hover:bg-rose-500/10 hover:text-rose-200">
            <Trash2 className="mr-1 size-4" /> Delete
          </Button>
          <Button variant="outline" size="sm" onClick={() => onTogglePosted(pack.id)} className="h-9 rounded-xl border-white/10 bg-white/[0.045] text-xs text-[#A1A1AA] hover:bg-white/[0.075] hover:text-[#F8FAFC]">
            {pack.posted ? 'Mark Unposted' : 'Mark Posted'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContentPanel({ title, action, children, accent = false }: { title: string; action: ReactNode; children: ReactNode; accent?: boolean }) {
  return (
    <div className="max-h-[54vh] overflow-y-auto rounded-[22px] border border-white/10 bg-[#050508]/72 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h4 className={`text-lg font-semibold leading-7 ${accent ? 'premium-text-gradient' : 'text-[#F8FAFC]'}`}>{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}
