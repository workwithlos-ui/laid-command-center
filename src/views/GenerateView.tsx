import { useMemo, useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { renderMarkdown } from '@/lib/mdrender';
import {
  type AgentMemory,
  type ContentEngineSettings,
  type ContentStyle,
  type GeneratedContentPack,
  type PackRating,
  type SourceMode,
  generateContentPack,
  updateMemoryFromPack,
} from '@/lib/contentTeamEngine';

const styleOptions: Array<{ key: ContentStyle; label: string; description: string }> = [
  { key: 'ai_news', label: 'AI News', description: 'Reactive update with real sources.' },
  { key: 'workflow', label: 'Workflow', description: 'Step-by-step operator playbook.' },
  { key: 'system', label: 'System', description: 'Reusable AI operating system.' },
];

const sourceOptions: Array<{ key: SourceMode; label: string }> = [
  { key: 'ai_news', label: 'AI News' },
  { key: 'github_trending', label: 'GitHub Trending' },
  { key: 'both', label: 'Both' },
];

const tabs: Array<{ key: keyof GeneratedContentPack['content']; label: string }> = [
  { key: 'youtubeScript', label: 'YouTube' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'shortClips', label: 'Short Clips' },
  { key: 'xThread', label: 'X Thread' },
  { key: 'instagramCaption', label: 'IG' },
  { key: 'carousel', label: 'Carousel' },
  { key: 'email', label: 'Email' },
  { key: 'blog', label: 'Blog' },
];

const defaultSettings: ContentEngineSettings = {
  openaiApiKey: '',
  audience: '$500K-$10M founders/operators',
  defaultStyle: 'ai_news',
  voiceTraining: '',
  brandName: 'LAID',
  handle: '@loshustle',
  cta: "DM me the keyword and I'll send it.",
};

export function GenerateView() {
  const [settings] = useLocalStorage<ContentEngineSettings>('laid-settings', defaultSettings);
  const [packs, setPacks] = useLocalStorage<GeneratedContentPack[]>('laid-generated-packs', []);
  const [memory, setMemory] = useLocalStorage<AgentMemory>('agentMemory', { corrections: [], bestPatterns: [] });
  const [theme, setTheme] = useState('AI tools for founders');
  const [style, setStyle] = useState<ContentStyle>(settings.defaultStyle || 'ai_news');
  const [sourceMode, setSourceMode] = useState<SourceMode>('both');
  const [activePackId, setActivePackId] = useState<string | null>(packs[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<keyof GeneratedContentPack['content']>('youtubeScript');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const activePack = useMemo(() => packs.find((p) => p.id === activePackId) || packs[0], [packs, activePackId]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied. Now go post it.');
  };

  const handleGenerate = async () => {
    setError('');
    if (!settings.openaiApiKey?.trim()) {
      setError('Add your OpenAI API key in Settings before generating new content. Existing seeded content still works without a key.');
      return;
    }
    try {
      setLoading(true);
      setStatus('Content Strategist is mapping the angle...');
      const statusTimers = [
        setTimeout(() => setStatus('Research Agent is building the source brief...'), 1600),
        setTimeout(() => setStatus('Scriptwriter is writing the YouTube asset...'), 3600),
        setTimeout(() => setStatus('Repurposer is creating platform formats...'), 5600),
        setTimeout(() => setStatus('Editor is running the six quality gates...'), 7600),
      ];
      const pack = await generateContentPack({ theme, style, sourceMode, settings, memory, previousPacks: packs });
      statusTimers.forEach(clearTimeout);
      setStatus('Done. Pack added to the feed.');
      setPacks((prev) => [pack, ...prev]);
      setMemory(updateMemoryFromPack(memory, pack));
      setActivePackId(pack.id);
      setActiveTab('youtubeScript');
      showToast('Generated content pack.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const ratePack = (packId: string, rating: PackRating) => {
    setPacks((prev) => prev.map((pack) => (pack.id === packId ? { ...pack, rating } : pack)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Generate Content Pack</h2>
          <p className="mt-1 text-xs text-[#666666]">Run the embedded six-agent content team against a real AI update or workflow angle.</p>
        </div>
        <Button className="h-9 bg-[#c9a84c] text-xs font-semibold text-black hover:bg-[#d8b85d]" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
          Generate Pack
        </Button>
      </div>

      <div className="rounded-lg border border-[#222222] bg-[#111111] p-5">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Theme</label>
            <Input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="AI tools for founders"
              className="h-10 border-[#222222] bg-[#0a0a0a] text-sm text-white placeholder:text-[#666666]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Source</label>
            <div className="flex flex-wrap gap-2">
              {sourceOptions.map((option) => (
                <button
                  key={option.key}
                  className={`rounded-md border px-3 py-2 text-xs transition-colors ${sourceMode === option.key ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]' : 'border-[#222222] bg-[#0a0a0a] text-[#666666] hover:text-[#a0a0a0]'}`}
                  onClick={() => setSourceMode(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {styleOptions.map((option) => (
            <button
              key={option.key}
              className={`rounded-lg border p-4 text-left transition-colors ${style === option.key ? 'border-[#c9a84c] bg-[#c9a84c]/10' : 'border-[#222222] bg-[#0a0a0a] hover:border-[#333333]'}`}
              onClick={() => setStyle(option.key)}
            >
              <div className="text-sm font-semibold text-white">{option.label}</div>
              <div className="mt-1 text-xs text-[#666666]">{option.description}</div>
            </button>
          ))}
        </div>

        {(status || error) && (
          <div className={`mt-4 rounded-md border px-3 py-2 text-xs ${error ? 'border-[#ef4444]/50 bg-[#ef4444]/10 text-[#ef4444]' : 'border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#c9a84c]'}`}>
            {error || status}
          </div>
        )}
      </div>

      {packs.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#666666]">Generated Packs</p>
            {packs.slice(0, 8).map((pack) => (
              <button
                key={pack.id}
                onClick={() => { setActivePackId(pack.id); setActiveTab('youtubeScript'); }}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${activePack?.id === pack.id ? 'border-[#c9a84c] bg-[#c9a84c]/10' : 'border-[#222222] bg-[#111111] hover:border-[#333333]'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">{pack.title}</h3>
                  <span className="rounded bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#c9a84c]">{pack.criticScore}/40</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-[#666666]">{pack.summary}</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                  <span>{pack.style.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{new Date(pack.date).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>

          {activePack && (
            <div className="rounded-lg border border-[#222222] bg-[#111111]">
              <div className="border-b border-[#222222] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">{activePack.title}</h3>
                    <p className="mt-1 text-xs text-[#666666]">{activePack.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#666666]">
                      <span className="rounded border border-[#c9a84c]/50 px-2 py-0.5 text-[#c9a84c]">{activePack.hookType}</span>
                      <span>{activePack.desireMapping}</span>
                      {activePack.sourceUrl && activePack.sourceUrl !== 'User-provided content' && (
                        <a className="inline-flex items-center gap-1 text-[#c9a84c] hover:underline" href={activePack.sourceUrl} target="_blank" rel="noreferrer">
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" className="h-8 border-[#c9a84c] text-xs text-[#c9a84c] hover:bg-[#c9a84c]/10" onClick={() => handleCopy(activePack.content[activeTab])}>
                    <Copy className="mr-1 h-3 w-3" /> Copy
                  </Button>
                </div>
              </div>

              <div className="border-b border-[#222222] px-5 py-3">
                <div className="flex flex-wrap gap-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`rounded px-2 py-1 text-[10px] font-semibold uppercase transition-colors ${activeTab === tab.key ? 'bg-[#c9a84c] text-black' : 'bg-[#1a1a1a] text-[#666666] hover:text-[#a0a0a0]'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <div className="content-body max-h-[520px] overflow-y-auto rounded-md border border-[#222222] bg-[#0a0a0a] p-4 text-[12px] leading-relaxed text-[#a0a0a0]" dangerouslySetInnerHTML={{ __html: renderMarkdown(activePack.content[activeTab] || 'No content generated for this format.') }} />

                <details className="mt-4 rounded-md border border-[#222222] bg-[#0a0a0a] p-3">
                  <summary className="cursor-pointer text-xs font-medium text-[#a0a0a0]">Agent Log</summary>
                  <div className="mt-3 space-y-2">
                    {activePack.agentLog.map((entry, index) => (
                      <div key={`${entry.agent}-${index}`} className="flex items-start justify-between gap-3 border-t border-[#1a1a1a] pt-2 text-xs">
                        <div>
                          <div className="font-medium text-white">{entry.agent}</div>
                          <div className="mt-1 text-[#666666]">{entry.summary}</div>
                        </div>
                        {entry.score ? <span className="text-[#c9a84c]">{entry.score}/40</span> : <CheckCircle className="h-3 w-3 text-[#22c55e]" />}
                      </div>
                    ))}
                  </div>
                </details>

                <div className="mt-4 flex items-center gap-2 text-xs text-[#666666]">
                  <span>Rate this pack</span>
                  {(['up', 'neutral', 'down'] as PackRating[]).map((rating) => (
                    <button key={rating || 'none'} onClick={() => ratePack(activePack.id, rating)} className={`rounded border px-2 py-1 ${activePack.rating === rating ? 'border-[#c9a84c] text-[#c9a84c]' : 'border-[#222222] text-[#666666]'}`}>
                      {rating === 'up' ? 'Good' : rating === 'neutral' ? 'Okay' : 'Weak'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 lg:bottom-8">
          <div className="rounded-lg border border-[#c9a84c] bg-[#111111] px-4 py-3 text-sm font-medium text-white shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
