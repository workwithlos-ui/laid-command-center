import { useCallback, useState, type ElementType, type FormEvent, type ReactNode } from 'react';
import { CheckCircle, ClipboardList, Copy, Edit3, ExternalLink, FileText, Image, Instagram, Linkedin, Save, ShieldCheck, Star, Trash2, TrendingUp, Twitter, Video, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ContentPack, ContentStyle, OutputFormat, PackPerformance, PackRating } from '@/data/types';
import { renderMarkdown } from '@/lib/mdrender';
import { recordLearnedRule, recordMemoryEvent } from '@/lib/warRoomMemory';

export interface PackDetailModalProps {
  pack: ContentPack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTogglePosted: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdatePack: (pack: ContentPack) => void;
}

type DetailTab = OutputFormat | 'brief' | 'source_check' | 'client_handoff' | 'performance';

const styleBadgeConfig: Record<ContentStyle, { classes: string; label: string }> = {
  ai_news: { classes: 'border-[#A855F7]/35 bg-[#A855F7]/12 text-[#D8B4FE]', label: 'AI News' },
  workflow: { classes: 'border-[#22D3EE]/35 bg-[#22D3EE]/12 text-[#67E8F9]', label: 'Workflow' },
  system: { classes: 'border-[#F8C471]/35 bg-[#F8C471]/12 text-[#F8C471]', label: 'System' },
};

const tabConfig: { format: DetailTab; label: string; Icon: ElementType }[] = [
  { format: 'long_post', label: 'Long Post', Icon: FileText },
  { format: 'linkedin_post', label: 'LinkedIn', Icon: Linkedin },
  { format: 'x_thread', label: 'X Thread', Icon: Twitter },
  { format: 'ig_caption', label: 'IG Caption', Icon: Instagram },
  { format: 'carousel', label: 'Carousel', Icon: Image },
  { format: 'short_script', label: 'Script', Icon: Video },
  { format: 'email', label: 'Email', Icon: FileText },
  { format: 'blog', label: 'Blog', Icon: FileText },
  { format: 'lead_magnet', label: 'Lead Magnet', Icon: ClipboardList },
  { format: 'brief', label: 'Brief', Icon: ClipboardList },
  { format: 'source_check', label: 'Source Check', Icon: ShieldCheck },
  { format: 'client_handoff', label: 'Client Handoff', Icon: ClipboardList },
  { format: 'performance', label: 'Performance', Icon: TrendingUp },
];

const tabLabels: Record<DetailTab, string> = {
  long_post: 'Long Post',
  linkedin_post: 'LinkedIn',
  x_thread: 'X Thread',
  ig_caption: 'IG Caption',
  carousel: 'Carousel',
  short_script: 'Script',
  email: 'Email',
  blog: 'Blog',
  lead_magnet: 'Lead Magnet',
  brief: 'Brief',
  source_check: 'Source Check',
  client_handoff: 'Client Handoff',
  performance: 'Performance',
};

function buildClientHandoff(pack: ContentPack): string {
  const client = pack.client_name || 'Client';
  const score = pack.critic_score || pack.quality_score || 86;
  const cta = pack.approved_brief?.cta || pack.ig_caption.cta || pack.linkedin_post?.cta || 'Reply if you want this built.';
  const proof = pack.source_intelligence?.proofSnippets?.slice(0, 3) || [];
  const claims = pack.source_intelligence?.exactClaims?.slice(0, 3) || [];

  return [
    `CLIENT: ${client}`,
    `PACK: ${pack.tool_name}`,
    `QUALITY SCORE: ${score}`,
    '',
    'WHAT WE BUILT',
    `- Core long post: ${pack.long_post.title}`,
    `- LinkedIn post: ${pack.linkedin_post ? 'ready' : 'fallback ready'}`,
    `- X thread: ${pack.x_thread.tweets.length} tweets`,
    `- Instagram caption: ready`,
    `- Carousel: ${pack.carousel.slides.length} slides`,
    `- Short script: ${pack.short_script.beats.length} beats`,
    `- Email, blog, and lead magnet: ${pack.email && pack.blog && pack.lead_magnet ? 'ready' : 'partially ready'}`,
    '',
    'SOURCE PROOF',
    ...(proof.length ? proof.map((item) => `- ${item}`) : ['- Add more source material before sending to a strict client.']),
    '',
    'CLAIM CHECK',
    ...(claims.length ? claims.map((item) => `- [${item.status}] ${item.claim}`) : ['- No claim map saved.']),
    '',
    'CLIENT POSTING PLAN',
    '- Post the LinkedIn version first.',
    '- Turn the X thread into a second distribution asset.',
    '- Use the carousel for Instagram or LinkedIn document posts.',
    '- Send the email version to warm leads or past prospects.',
    '- Use the lead magnet as the DM fulfillment asset.',
    '',
    'DM OPENER',
    `Saw a clear content angle for ${client}: ${pack.long_post.title}. I built the full content sprint around it, including source checks, LinkedIn, X, IG, email, blog, and a lead magnet. Want me to send the pack?`,
    '',
    'CTA',
    cta,
  ].join('\n');
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getContentForFormat(pack: ContentPack, format: DetailTab): string {
  switch (format) {
    case 'long_post':
      return `${pack.long_post.title}\n\n${pack.long_post.body_markdown}`;
    case 'linkedin_post':
      return pack.linkedin_post ? `${pack.linkedin_post.hook}\n\n${pack.linkedin_post.body}\n\n${pack.linkedin_post.cta}` : `${pack.long_post.title}\n\n${pack.x_thread.hook}\n\n${pack.long_post.body_markdown}`;
    case 'x_thread':
      return `${pack.x_thread.hook}\n\n${pack.x_thread.tweets.map((tweet, index) => `${index + 1}/ ${tweet}`).join('\n\n')}`;
    case 'ig_caption':
      return `${pack.ig_caption.hook}\n\n${pack.ig_caption.body}\n\n${pack.ig_caption.cta}`;
    case 'carousel':
      return pack.carousel.slides.map((slide, index) => `Slide ${index + 1}: ${slide.title}\n${slide.bullets.map((bullet) => `- ${bullet}`).join('\n')}`).join('\n\n');
    case 'short_script':
      return `${pack.short_script.title}\n\n${pack.short_script.beats.map((beat, index) => `[${(index + 1) * 8}s] ${beat}`).join('\n')}`;
    case 'email':
      return pack.email ? `Subject: ${pack.email.subject}\nPreview: ${pack.email.preview}\n\n${pack.email.body}\n\n${pack.email.cta}` : 'No email saved for this pack.';
    case 'blog':
      return pack.blog ? `${pack.blog.title}\n\n${pack.blog.body_markdown}` : 'No blog saved for this pack.';
    case 'lead_magnet':
      return pack.lead_magnet ? `${pack.lead_magnet.title}\n\n${pack.lead_magnet.outline.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\n${pack.lead_magnet.cta}` : 'No lead magnet saved for this pack.';
    case 'brief':
      return pack.approved_brief
        ? [
            `Angle: ${pack.approved_brief.angle}`,
            `Audience: ${pack.approved_brief.targetAudience}`,
            `Hook Promise: ${pack.approved_brief.hookPromise}`,
            `Why Now: ${pack.approved_brief.whyNow}`,
            `CTA: ${pack.approved_brief.cta}`,
            `Structure:\n${pack.approved_brief.contentStructure.map((item, index) => `${index + 1}. ${item}`).join('\n')}`,
          ].join('\n\n')
        : 'No approved brief saved for this pack.';
    case 'source_check':
      return pack.source_intelligence
        ? pack.source_intelligence.exactClaims.map((claim, index) => `${index + 1}. [${claim.status}] ${claim.claim}\nSource: ${claim.sourceReference}`).join('\n\n')
        : 'No source intelligence saved for this pack.';
    case 'client_handoff':
      return buildClientHandoff(pack);
    case 'performance':
      return pack.performance
        ? [
            `Views: ${pack.performance.views || 0}`,
            `Likes: ${pack.performance.likes || 0}`,
            `Comments: ${pack.performance.comments || 0}`,
            `Saves: ${pack.performance.saves || 0}`,
            `Shares: ${pack.performance.shares || 0}`,
            `DMs: ${pack.performance.dms || 0}`,
            `Booked calls: ${pack.performance.bookedCalls || 0}`,
            `Revenue: ${pack.performance.revenue || 0}`,
            pack.performance.notes ? `Notes: ${pack.performance.notes}` : '',
          ].filter(Boolean).join('\n')
        : 'No performance saved for this pack.';
    default:
      return '';
  }
}

function splitTitleAndBody(fallbackTitle: string, text: string) {
  const clean = text.trim();
  const lines = clean.split('\n');
  const title = lines[0]?.trim() || fallbackTitle;
  const body = lines.slice(1).join('\n').trim() || clean;
  return { title, body };
}

function splitHookBodyCta(text: string, fallback: { hook: string; body: string; cta: string }) {
  const parts = text.trim().split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  return {
    hook: parts[0] || fallback.hook,
    body: parts.length > 2 ? parts.slice(1, -1).join('\n\n') : parts[1] || fallback.body,
    cta: parts.length > 2 ? parts[parts.length - 1] : fallback.cta,
  };
}

function applyEditedContent(pack: ContentPack, format: DetailTab, text: string): ContentPack {
  const clean = text.trim();

  switch (format) {
    case 'long_post': {
      const { title, body } = splitTitleAndBody(pack.long_post.title, clean);
      return { ...pack, long_post: { ...pack.long_post, title, body_markdown: body } };
    }
    case 'linkedin_post': {
      const fallback = pack.linkedin_post || { hook: pack.long_post.title, body: pack.long_post.body_markdown, cta: 'DM me if you want the playbook.' };
      return { ...pack, linkedin_post: splitHookBodyCta(clean, fallback) };
    }
    case 'x_thread': {
      const parts = clean.split(/\n{2,}/).map((part) => part.replace(/^\d+\/\s*/, '').trim()).filter(Boolean);
      return { ...pack, x_thread: { ...pack.x_thread, hook: parts[0] || pack.x_thread.hook, tweets: parts.slice(1).length ? parts.slice(1) : pack.x_thread.tweets } };
    }
    case 'ig_caption':
      return { ...pack, ig_caption: splitHookBodyCta(clean, pack.ig_caption) };
    case 'email': {
      const lines = clean.split('\n');
      const subject = lines[0]?.replace(/^Subject:\s*/i, '').trim() || pack.email?.subject || pack.long_post.title;
      const previewLine = lines[1]?.replace(/^Preview:\s*/i, '').trim();
      return {
        ...pack,
        email: {
          subject,
          preview: previewLine || pack.email?.preview || pack.summary,
          body: lines.slice(2).join('\n').trim() || pack.email?.body || clean,
          cta: pack.email?.cta || 'Reply if you want this built.',
        },
      };
    }
    case 'blog': {
      const { title, body } = splitTitleAndBody(pack.blog?.title || pack.long_post.title, clean);
      return { ...pack, blog: { title, body_markdown: body } };
    }
    default:
      return pack;
  }
}

function numberFromForm(data: FormData, key: keyof PackPerformance): number | undefined {
  const raw = String(data.get(key) || '').trim();
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export function PackDetailModal({ pack, open, onOpenChange, onTogglePosted, onDelete, onUpdatePack }: PackDetailModalProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('long_post');
  const [editingFormat, setEditingFormat] = useState<DetailTab | null>(null);
  const [draftContent, setDraftContent] = useState('');

  const handleCopy = useCallback(async (format: DetailTab) => {
    if (!pack) return;
    await navigator.clipboard.writeText(getContentForFormat(pack, format));
    recordMemoryEvent('format_copied', { packId: pack.id, label: format });
    recordLearnedRule(`User copied ${format} from ${pack.tool_name}. Preserve useful patterns from this output type.`, 'format_copy');
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 1600);
  }, [pack]);

  const handleCopyAll = useCallback(async () => {
    if (!pack) return;
    const text = tabConfig.map(({ format }) => `=== ${tabLabels[format]} ===\n${getContentForFormat(pack, format)}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    recordMemoryEvent('pack_copied', { packId: pack.id, label: 'all formats' });
    recordLearnedRule(`User copied all formats from ${pack.tool_name}. Treat this pack structure as a positive signal.`, 'copy_all');
    setCopiedFormat('all');
    setTimeout(() => setCopiedFormat(null), 1600);
  }, [pack]);

  const editableTabs: DetailTab[] = ['long_post', 'linkedin_post', 'x_thread', 'ig_caption', 'email', 'blog'];

  const handleStartEdit = (format: DetailTab) => {
    if (!pack) return;
    setEditingFormat(format);
    setDraftContent(getContentForFormat(pack, format));
  };

  const handleCancelEdit = () => {
    setEditingFormat(null);
    setDraftContent('');
  };

  const handleSaveEdit = () => {
    if (!pack || !editingFormat) return;
    const updatedPack = applyEditedContent(pack, editingFormat, draftContent);
    onUpdatePack(updatedPack);
    recordMemoryEvent('output_edited', { packId: pack.id, label: editingFormat, detail: `Edited ${draftContent.trim().length} characters.` });
    recordLearnedRule(`User edited ${editingFormat} in ${pack.tool_name}. Future drafts should study this pack's edited version before finalizing.`, 'output_edit');
    setEditingFormat(null);
    setDraftContent('');
  };

  const handleRate = (rating: PackRating) => {
    if (!pack) return;
    onUpdatePack({ ...pack, rating });
    recordMemoryEvent('pack_rated', { packId: pack.id, label: rating || 'cleared' });
    recordLearnedRule(`User rated ${pack.tool_name} as ${rating || 'cleared'}. Use this as a quality signal for similar angles.`, 'pack_rating');
  };

  const handleSavePerformance = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pack) return;
    const data = new FormData(event.currentTarget);
    const performance: PackPerformance = {
      views: numberFromForm(data, 'views'),
      likes: numberFromForm(data, 'likes'),
      comments: numberFromForm(data, 'comments'),
      saves: numberFromForm(data, 'saves'),
      shares: numberFromForm(data, 'shares'),
      dms: numberFromForm(data, 'dms'),
      bookedCalls: numberFromForm(data, 'bookedCalls'),
      revenue: numberFromForm(data, 'revenue'),
      notes: String(data.get('notes') || '').trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    onUpdatePack({ ...pack, performance });
    recordMemoryEvent('performance_saved', {
      packId: pack.id,
      label: pack.tool_name,
      detail: `${performance.views || 0} views, ${performance.dms || 0} DMs, ${performance.bookedCalls || 0} calls, $${performance.revenue || 0} revenue.`,
    });
    if ((performance.dms || 0) + (performance.bookedCalls || 0) + (performance.revenue || 0) > 0) {
      recordLearnedRule(`Winning performance signal from ${pack.tool_name}: ${performance.notes || 'generated pipeline response.'}`, 'performance');
    }
  };

  if (!pack) return null;

  const styleConfig = styleBadgeConfig[pack.style] || { classes: 'border-white/10 bg-white/[0.045] text-[#A1A1AA]', label: pack.style };
  const score = pack.critic_score || pack.quality_score || 86;

  const renderActions = (format: DetailTab) => (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      {editingFormat === format ? (
        <>
          <Button variant="ghost" size="sm" onClick={handleSaveEdit} className="h-8 rounded-xl px-3 text-xs text-emerald-300 hover:bg-emerald-400/10 hover:text-emerald-200">
            <Save className="mr-1 size-4" /> Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-8 rounded-xl px-3 text-xs text-[#A1A1AA] hover:bg-white/[0.06] hover:text-[#F8FAFC]">
            <X className="mr-1 size-4" /> Cancel
          </Button>
        </>
      ) : (
        <>
          {editableTabs.includes(format) && (
            <Button variant="ghost" size="sm" onClick={() => handleStartEdit(format)} className="h-8 rounded-xl px-3 text-xs text-[#71717A] hover:bg-white/[0.06] hover:text-[#F8C471]">
              <Edit3 className="mr-1 size-4" /> Edit
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleCopy(format)} className="h-8 rounded-xl px-3 text-xs text-[#71717A] hover:bg-white/[0.06] hover:text-[#22D3EE]">
            {copiedFormat === format ? <><CheckCircle className="mr-1 size-4 text-emerald-300" /> Copied</> : <><Copy className="mr-1 size-4" /> Copy</>}
          </Button>
        </>
      )}
    </div>
  );

  const renderEditable = (format: DetailTab, children: ReactNode) => (
    editingFormat === format ? (
      <textarea
        value={draftContent}
        onChange={(event) => setDraftContent(event.target.value)}
        rows={18}
        className="min-h-[420px] w-full resize-y rounded-2xl border border-[#A855F7]/30 bg-[#09090D] p-4 text-sm leading-7 text-[#F8FAFC] outline-none focus:border-[#22D3EE]/50 focus:ring-4 focus:ring-[#22D3EE]/10"
      />
    ) : children
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-[90vw] max-w-[90vw] overflow-hidden border-white/10 bg-[#101014]/95 p-0 text-[#F8FAFC] shadow-[0_32px_120px_rgba(0,0,0,0.62)] backdrop-blur-2xl" showCloseButton>
        <DialogHeader className="border-b border-white/10 p-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${styleConfig.classes}`}>{styleConfig.label}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-[11px] text-[#22D3EE]">Quality {score}</span>
                {pack.rating && <span className="rounded-full border border-[#F8C471]/25 bg-[#F8C471]/10 px-3 py-1 text-[11px] text-[#F8C471]">Rated {pack.rating}</span>}
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
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopyAll} className="h-9 rounded-xl bg-white/[0.045] px-3 text-xs text-[#A1A1AA] hover:bg-white/[0.075] hover:text-[#F8FAFC]">
                {copiedFormat === 'all' ? <><CheckCircle className="mr-1 size-4 text-emerald-300" /> All Copied</> : <><Copy className="mr-1 size-4" /> Copy All</>}
              </Button>
              <div className="flex rounded-xl border border-white/10 bg-white/[0.035] p-1">
                {(['up', 'neutral', 'down'] as PackRating[]).map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRate(pack.rating === rating ? null : rating)}
                    className={`flex h-7 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] transition ${pack.rating === rating ? 'bg-[#F8C471]/15 text-[#F8C471]' : 'text-[#71717A] hover:bg-white/[0.06] hover:text-[#F8FAFC]'}`}
                    title={`Rate ${rating}`}
                  >
                    <Star className="size-3.5" />
                  </button>
                ))}
              </div>
            </div>
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
              <ContentPanel title={pack.long_post.title} action={renderActions('long_post')}>
                {renderEditable('long_post', <div className="content-body text-sm leading-7 text-[#A1A1AA]" dangerouslySetInnerHTML={{ __html: renderMarkdown(pack.long_post.body_markdown) }} />)}
              </ContentPanel>
            </TabsContent>

            <TabsContent value="linkedin_post" className="mt-4 outline-none">
              <ContentPanel title={pack.linkedin_post?.hook || 'LinkedIn native post'} action={renderActions('linkedin_post')} accent>
                {renderEditable('linkedin_post', <p className="whitespace-pre-wrap text-sm leading-7 text-[#A1A1AA]">{getContentForFormat(pack, 'linkedin_post')}</p>)}
              </ContentPanel>
            </TabsContent>

            <TabsContent value="x_thread" className="mt-4 outline-none">
              <ContentPanel title={pack.x_thread.hook} action={renderActions('x_thread')} accent>
                {renderEditable('x_thread', <div className="space-y-3">
                  {pack.x_thread.tweets.map((tweet, index) => (
                    <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-[#A1A1AA]">
                      <span className="mr-2 font-semibold text-[#22D3EE]">{index + 1}/{pack.x_thread.tweets.length}</span>{tweet}
                    </div>
                  ))}
                </div>)}
              </ContentPanel>
            </TabsContent>

            <TabsContent value="ig_caption" className="mt-4 outline-none">
              <ContentPanel title={pack.ig_caption.hook} action={renderActions('ig_caption')} accent>
                {renderEditable('ig_caption', <>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-[#A1A1AA]">{pack.ig_caption.body}</p>
                  <p className="mt-5 rounded-2xl border border-[#A855F7]/25 bg-[#A855F7]/10 p-4 text-sm font-medium text-[#D8B4FE]">{pack.ig_caption.cta}</p>
                </>)}
              </ContentPanel>
            </TabsContent>

            <TabsContent value="carousel" className="mt-4 outline-none">
              <ContentPanel title="Carousel outline" action={renderActions('carousel')}>
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
              <ContentPanel title={pack.short_script.title} action={renderActions('short_script')}>
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

            <TabsContent value="email" className="mt-4 outline-none">
              <ContentPanel title={pack.email?.subject || 'Email'} action={renderActions('email')}>
                {renderEditable('email', <p className="whitespace-pre-wrap text-sm leading-7 text-[#A1A1AA]">{getContentForFormat(pack, 'email')}</p>)}
              </ContentPanel>
            </TabsContent>

            <TabsContent value="blog" className="mt-4 outline-none">
              <ContentPanel title={pack.blog?.title || 'Blog'} action={renderActions('blog')}>
                {renderEditable('blog', <div className="content-body text-sm leading-7 text-[#A1A1AA]" dangerouslySetInnerHTML={{ __html: renderMarkdown(pack.blog?.body_markdown || '') }} />)}
              </ContentPanel>
            </TabsContent>

            <TabsContent value="lead_magnet" className="mt-4 outline-none">
              <ContentPanel title={pack.lead_magnet?.title || 'Lead magnet'} action={renderActions('lead_magnet')} accent>
                {pack.lead_magnet ? (
                  <div className="space-y-3">
                    {pack.lead_magnet.outline.map((item, index) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-[#A1A1AA]">
                        <span className="mr-2 font-semibold text-[#22D3EE]">{index + 1}.</span>{item}
                      </div>
                    ))}
                    <p className="rounded-2xl border border-[#A855F7]/25 bg-[#A855F7]/10 p-4 text-sm font-medium text-[#D8B4FE]">{pack.lead_magnet.cta}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[#A1A1AA]">No lead magnet saved for this pack.</p>
                )}
              </ContentPanel>
            </TabsContent>

            <TabsContent value="brief" className="mt-4 outline-none">
              <ContentPanel title="Approved content brief" action={renderActions('brief')}>
                {pack.approved_brief ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoBlock label="Angle" value={pack.approved_brief.angle} />
                    <InfoBlock label="Audience" value={pack.approved_brief.targetAudience} />
                    <InfoBlock label="Hook promise" value={pack.approved_brief.hookPromise} />
                    <InfoBlock label="CTA" value={pack.approved_brief.cta} />
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:col-span-2">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#71717A]">Structure</div>
                      <ol className="mt-3 space-y-2 text-sm leading-6 text-[#A1A1AA]">
                        {pack.approved_brief.contentStructure.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}
                      </ol>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#A1A1AA]">No approved brief saved for this pack.</p>
                )}
              </ContentPanel>
            </TabsContent>

            <TabsContent value="source_check" className="mt-4 outline-none">
              <ContentPanel title="Claim-level source check" action={renderActions('source_check')} accent>
                {pack.source_intelligence ? (
                  <div className="space-y-3">
                    {pack.source_intelligence.exactClaims.length ? pack.source_intelligence.exactClaims.map((claim, index) => (
                      <div key={`${claim.sourceReference}-${index}`} className={`rounded-2xl border p-4 ${claim.status === 'verified' ? 'border-emerald-400/20 bg-emerald-400/10' : claim.status === 'weak' ? 'border-[#F8C471]/20 bg-[#F8C471]/10' : 'border-rose-400/20 bg-rose-400/10'}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#71717A]">Claim {index + 1}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${claim.status === 'verified' ? 'bg-emerald-400/15 text-emerald-300' : claim.status === 'weak' ? 'bg-[#F8C471]/15 text-[#F8C471]' : 'bg-rose-400/15 text-rose-300'}`}>{claim.status}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#F8FAFC]">{claim.claim}</p>
                        <p className="mt-2 text-xs text-[#71717A]">{claim.sourceReference}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-[#F8C471]">No extracted claims were saved. Add more source material next time.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#A1A1AA]">No source intelligence saved for this pack.</p>
                )}
              </ContentPanel>
            </TabsContent>

            <TabsContent value="client_handoff" className="mt-4 outline-none">
              <ContentPanel title={`${pack.client_name || 'Client'} handoff`} action={renderActions('client_handoff')} accent>
                <pre className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-[#A1A1AA]">{buildClientHandoff(pack)}</pre>
              </ContentPanel>
            </TabsContent>

            <TabsContent value="performance" className="mt-4 outline-none">
              <ContentPanel title="Performance feedback loop" action={renderActions('performance')} accent>
                <form onSubmit={handleSavePerformance} className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {(['views', 'likes', 'comments', 'saves', 'shares', 'dms', 'bookedCalls', 'revenue'] as Array<keyof PackPerformance>).map((field) => (
                      <label key={field} className="block">
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[#71717A]">{field.replace(/([A-Z])/g, ' $1')}</span>
                        <input
                          name={field}
                          type="number"
                          min="0"
                          defaultValue={pack.performance?.[field] as number | undefined}
                          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-[#F8FAFC] outline-none focus:border-[#22D3EE]/45 focus:ring-4 focus:ring-[#22D3EE]/10"
                        />
                      </label>
                    ))}
                  </div>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[#71717A]">Notes</span>
                    <textarea
                      name="notes"
                      defaultValue={pack.performance?.notes || ''}
                      rows={5}
                      placeholder="What happened after posting? Add replies, objections, offers, buyer language, or why it flopped."
                      className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-[#F8FAFC] outline-none placeholder:text-[#71717A] focus:border-[#22D3EE]/45 focus:ring-4 focus:ring-[#22D3EE]/10"
                    />
                  </label>
                  <Button type="submit" className="h-10 rounded-xl bg-gradient-to-r from-[#A855F7] to-[#22D3EE] px-4 text-sm font-semibold text-white hover:opacity-95">
                    <Save className="mr-2 size-4" /> Save Performance
                  </Button>
                </form>
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#71717A]">{label}</div>
      <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{value}</p>
    </div>
  );
}

function ContentPanel({ title, action, children, accent = false }: { title: string; action: ReactNode; children: ReactNode; accent?: boolean }) {
  return (
    <div className="max-h-[58vh] overflow-y-auto rounded-[22px] border border-white/10 bg-[#050508]/72 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h4 className={`text-lg font-semibold leading-7 ${accent ? 'premium-text-gradient' : 'text-[#F8FAFC]'}`}>{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}
