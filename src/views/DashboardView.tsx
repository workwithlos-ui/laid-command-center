import { useNavigate } from 'react-router';
import { ArrowRight, Copy, FileText, Layers, Newspaper, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { seedContentPacks } from '@/data/contentPacks';
import type { ContentPack } from '@/data/types';

export function DashboardView() {
  const navigate = useNavigate();
  const [contentPacks] = useLocalStorage<ContentPack[]>('laid-content-packs', seedContentPacks);
  const [copiedPacks] = useLocalStorage<string[]>('laid-copied-packs', []);

  const formatsGenerated = contentPacks.length * 5;
  const latestPack = contentPacks[0];
  const updatesCovered = new Set(contentPacks.map((pack) => pack.tool_name)).size;
  const averageImpact = Math.round(
    contentPacks.reduce((sum, pack) => sum + (pack.impact_score || 88), 0) / Math.max(contentPacks.length, 1)
  );

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-[#2a2416] bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.2),transparent_32%),linear-gradient(145deg,#131313,#070707)] p-6 shadow-2xl shadow-black/40">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
              <Sparkles className="h-3 w-3" /> AI Content Command Center
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              One click from market signal to full content pack.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a0a0a0]">
              LAID now watches for real AI tool updates, chooses the one with the strongest founder workflow angle, and turns it into long-form, X, Instagram, carousel, and short-form script assets.
            </p>
          </div>
          <Button
            className="h-11 rounded-full bg-[#c9a84c] px-5 text-sm font-semibold text-black hover:bg-[#d8ba62]"
            onClick={() => navigate('/feed')}
          >
            Generate from AI Update <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard value={contentPacks.length} label="Content Packs" sublabel="ready to review" />
        <StatCard value={updatesCovered} label="AI Updates Covered" sublabel="real sources" />
        <StatCard value={formatsGenerated} label="Formats Generated" sublabel="5 per pack" />
        <StatCard value={averageImpact} label="Avg Impact" sublabel="workflow score" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[#222222] bg-[#111111]">
          <div className="flex items-center justify-between border-b border-[#222222] px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Latest AI tools and updates selected for content</h3>
              <p className="mt-1 text-xs text-[#666666]">The highest-leverage topics in your pack library.</p>
            </div>
            <Newspaper className="h-4 w-4 text-[#c9a84c]" />
          </div>
          <div className="divide-y divide-[#222222]">
            {contentPacks.slice(0, 5).map((pack) => (
              <button
                key={pack.id}
                className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-[#151515]"
                onClick={() => navigate('/feed')}
              >
                <div className="mt-1 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/10 p-2">
                  <FileText className="h-4 w-4 text-[#c9a84c]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{pack.tool_name}</span>
                    <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#a0a0a0]">
                      {pack.style}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#a0a0a0]">{pack.summary}</p>
                  <p className="mt-2 text-[11px] text-[#666666]">Source date: {pack.source_date || 'Verified in generation'}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-[#666666]" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#222222] bg-[#111111]">
          <div className="border-b border-[#222222] px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Command Center Activity</h3>
          </div>
          <div className="space-y-3 p-4">
            <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#666666]">Current focus</p>
              <p className="mt-2 text-sm font-medium text-white">{latestPack?.theme || 'No active theme yet'}</p>
            </div>
            <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#666666]">Copy history</p>
              <p className="mt-2 text-sm font-medium text-white">{copiedPacks.length} packs copied for publishing</p>
            </div>
            <Button
              variant="outline"
              className="h-10 w-full rounded-full border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10"
              onClick={() => latestPack && navigator.clipboard.writeText(latestPack.long_post.body_markdown)}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Latest Long Post
            </Button>
            <Button
              variant="outline"
              className="h-10 w-full rounded-full border-[#222222] text-[#a0a0a0] hover:border-[#c9a84c] hover:text-[#c9a84c]"
              onClick={() => navigate('/feed')}
            >
              <Layers className="mr-2 h-4 w-4" /> Open Pack Library
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
