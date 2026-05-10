import { useMemo, useState } from 'react';
import { RotateCcw, Sparkles, ThumbsDown, ThumbsUp, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GenerateModal } from '@/components/GenerateModal';
import { PackCard } from '@/components/PackCard';
import { PackDetailModal } from '@/components/PackDetailModal';
import { Toast } from '@/components/Toast';
import { useContentPacks } from '@/hooks/useContentPacks';
import { generateContentPack } from '@/lib/contentGeneration';
import type { GenerationProgress, GenerationRequest, PackRating } from '@/data/types';
import type { StageLog } from '@/lib/pipeline';

const suggestions = [
  'AI agents that replace manual lead research',
  'New OpenAI feature founders can use this week',
  'A no-code workflow for turning sales calls into content',
  'An operator SOP for finding $500K-$10M prospects',
];

export function GenerateView() {
  const { packs, addPack, updatePack, deletePack, togglePosted, resetToSamples } = useContentPacks();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(packs[0]?.id ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [stageLogs, setStageLogs] = useState<StageLog[]>([]);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [usedRealPipeline, setUsedRealPipeline] = useState(false);
  const [toast, setToast] = useState('');

  const selectedPack = useMemo(
    () => packs.find((pack) => pack.id === selectedPackId) || packs[0] || null,
    [packs, selectedPackId]
  );

  const showToast = (message: string) => {
    setToast(message);
  };

  const handleGenerate = async (request: GenerationRequest) => {
    setIsGenerating(true);
    setProgress({ stage: 'strategizing', message: 'Starting the six-agent content team...' });
    setStageLogs([]);
    setTokensUsed(0);
    setUsedRealPipeline(false);

    try {
      const pack = await generateContentPack(request, (nextProgress) => setProgress(nextProgress));
      addPack(pack);
      setSelectedPackId(pack.id);
      setDetailOpen(true);
      setUsedRealPipeline(Boolean(pack.agent_log?.length));
      setTokensUsed((pack.agent_log || []).length * 1200);
      showToast('Content pack generated.');
      setModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed.';
      setProgress({ stage: 'error', message });
      showToast(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRate = (packId: string, rating: PackRating) => {
    updatePack(packId, { rating });
    showToast(rating === 'up' ? 'Saved as a good pattern.' : rating === 'down' ? 'Saved as a weak pattern.' : 'Rating saved.');
  };

  const generatedCount = packs.filter((pack) => !pack.id.startsWith('sample')).length;
  const postedCount = packs.filter((pack) => pack.posted).length;
  const averageScore = packs.length
    ? Math.round(packs.reduce((sum, pack) => sum + (pack.critic_score || pack.quality_score || 0), 0) / packs.length)
    : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#c9a84c]">Six-Agent Pipeline</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Generate Content Packs</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a0a0a0]">
              Run the upgraded Kimi pipeline: Content Strategist, Research/News Finder, Relevance Filter, Long-Post Writer, Repurposer, and Editor Quality Gate.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-9 border-[#333333] bg-transparent text-xs text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-white"
              onClick={resetToSamples}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset Samples
            </Button>
            <Button
              className="h-9 bg-[#c9a84c] text-xs font-semibold text-black hover:bg-[#d8b85d]"
              onClick={() => setModalOpen(true)}
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" /> New Pack
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
            <div className="text-2xl font-semibold text-white">{packs.length}</div>
            <div className="mt-1 text-xs text-[#666666]">Total packs</div>
          </div>
          <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
            <div className="text-2xl font-semibold text-white">{generatedCount}</div>
            <div className="mt-1 text-xs text-[#666666]">Generated in this workspace</div>
          </div>
          <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
            <div className="text-2xl font-semibold text-white">{postedCount}</div>
            <div className="mt-1 text-xs text-[#666666]">Marked posted · avg score {averageScore || '—'}</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Wand2 className="h-4 w-4 text-[#c9a84c]" /> Fast angle suggestions
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setModalOpen(true);
                navigator.clipboard?.writeText(suggestion).catch(() => undefined);
                showToast('Suggestion copied. Paste it into Custom Prompt.');
              }}
              className="rounded-full border border-[#222222] bg-[#0a0a0a] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packs.map((pack) => (
          <div key={pack.id} className="space-y-2">
            <PackCard
              pack={pack}
              onClick={() => {
                setSelectedPackId(pack.id);
                setDetailOpen(true);
              }}
            />
            <div className="flex items-center justify-between rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2">
              <div className="flex items-center gap-1 text-[11px] text-[#666666]">
                <span>Rate</span>
                <button
                  onClick={() => handleRate(pack.id, pack.rating === 'up' ? null : 'up')}
                  className={`rounded px-2 py-1 ${pack.rating === 'up' ? 'bg-green-500/15 text-green-400' : 'text-[#666666] hover:text-green-400'}`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleRate(pack.id, pack.rating === 'down' ? null : 'down')}
                  className={`rounded px-2 py-1 ${pack.rating === 'down' ? 'bg-red-500/15 text-red-400' : 'text-[#666666] hover:text-red-400'}`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <button onClick={() => togglePosted(pack.id)} className="text-[11px] text-[#c9a84c] hover:underline">
                {pack.posted ? 'Unmark posted' : 'Mark posted'}
              </button>
            </div>
          </div>
        ))}
      </section>

      <GenerateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        progress={progress}
        stageLogs={stageLogs}
        usedRealPipeline={usedRealPipeline}
        tokensUsed={tokensUsed}
      />

      <PackDetailModal
        pack={selectedPack}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onTogglePosted={togglePosted}
        onDelete={(id) => {
          deletePack(id);
          setDetailOpen(false);
          showToast('Content pack deleted.');
        }}
      />

      <Toast message={toast} visible={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
}
