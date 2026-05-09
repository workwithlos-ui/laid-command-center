import { Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { ContentPack } from '@/data/types';

const tabs = [
  { key: 'long', label: 'Long Post' },
  { key: 'x', label: 'X Thread' },
  { key: 'ig', label: 'IG Caption' },
  { key: 'carousel', label: 'Carousel' },
  { key: 'script', label: 'Short Script' },
];

export function contentPackToText(pack: ContentPack, section: string) {
  if (section === 'long') return `${pack.long_post.title}\n\n${pack.long_post.body_markdown}`;
  if (section === 'x') return [pack.x_thread.hook, ...pack.x_thread.tweets].join('\n\n');
  if (section === 'ig') return `${pack.ig_caption.hook}\n\n${pack.ig_caption.body}\n\n${pack.ig_caption.cta}`;
  if (section === 'carousel') {
    return pack.carousel.slides
      .map((slide, index) => `${index + 1}. ${slide.title}\n${slide.bullets.map((bullet) => `• ${bullet}`).join('\n')}`)
      .join('\n\n');
  }
  return `${pack.short_script.title}\n\n${pack.short_script.beats.map((beat) => `• ${beat}`).join('\n')}`;
}

export function updatePackSection(pack: ContentPack, section: string, value: string): ContentPack {
  if (section === 'long') {
    const [title = pack.long_post.title, ...bodyParts] = value.split('\n');
    return { ...pack, long_post: { title: title.trim() || pack.long_post.title, body_markdown: bodyParts.join('\n').trim() } };
  }
  if (section === 'x') {
    const parts = value.split('\n\n').map((item) => item.trim()).filter(Boolean);
    return { ...pack, x_thread: { hook: parts[0] || pack.x_thread.hook, tweets: parts.slice(1) } };
  }
  if (section === 'ig') {
    const parts = value.split('\n\n').map((item) => item.trim()).filter(Boolean);
    return {
      ...pack,
      ig_caption: {
        hook: parts[0] || pack.ig_caption.hook,
        body: parts.slice(1, -1).join('\n\n') || pack.ig_caption.body,
        cta: parts[parts.length - 1] || pack.ig_caption.cta,
      },
    };
  }
  if (section === 'carousel') {
    const slides = value
      .split('\n\n')
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block, index) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const title = (lines[0] || `Slide ${index + 1}`).replace(/^\d+\.\s*/, '');
        const bullets = lines.slice(1).map((line) => line.replace(/^•\s*/, '').trim()).filter(Boolean);
        return { title, bullets: bullets.length ? bullets : ['Add the key point', 'Add the proof or example'] };
      });
    return { ...pack, carousel: { slides: slides.length ? slides : pack.carousel.slides } };
  }
  if (section === 'script') {
    const lines = value.split('\n').map((item) => item.replace(/^•\s*/, '').trim()).filter(Boolean);
    return { ...pack, short_script: { title: lines[0] || pack.short_script.title, beats: lines.slice(1) } };
  }
  return pack;
}

type ContentPackDetailDialogProps = {
  pack: ContentPack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (pack: ContentPack) => void;
  onCopy?: (pack: ContentPack, section: string) => void;
};

export function ContentPackDetailDialog({ pack, open, onOpenChange, onUpdate, onCopy }: ContentPackDetailDialogProps) {
  if (!pack) return null;

  const handleCopy = (section: string) => {
    navigator.clipboard.writeText(contentPackToText(pack, section));
    onCopy?.(pack, section);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] max-w-5xl overflow-hidden border-[#2a2416] bg-[#0d0d0d] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-tight">{pack.long_post.title}</DialogTitle>
          <DialogDescription className="text-[#a0a0a0]">
            {pack.tool_name} · {pack.source_date || 'Verified source'} ·{' '}
            <a href={pack.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#c9a84c]">
              Source <ExternalLink className="h-3 w-3" />
            </a>
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="long" className="min-h-0">
          <TabsList className="grid w-full grid-cols-5 rounded-2xl border border-[#222222] bg-[#111111] p-1">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="rounded-xl text-xs data-[state=active]:bg-[#c9a84c] data-[state=active]:text-black">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-[#666666]">{tab.label}</p>
                <Button size="sm" className="rounded-full bg-[#c9a84c] text-black hover:bg-[#d8ba62]" onClick={() => handleCopy(tab.key)}>
                  <Copy className="mr-2 h-3 w-3" /> Copy
                </Button>
              </div>
              <Textarea
                value={contentPackToText(pack, tab.key)}
                onChange={(event) => onUpdate?.(updatePackSection(pack, tab.key, event.target.value))}
                className="h-[52dvh] resize-none rounded-2xl border-[#222222] bg-[#080808] font-mono text-sm leading-6 text-[#ededed]"
              />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
