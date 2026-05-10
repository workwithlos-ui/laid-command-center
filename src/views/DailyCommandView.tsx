import { useMemo, useState, useCallback } from 'react';
import { Copy, CheckCircle, Zap, TrendingUp, Flame, BarChart3, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import contentData from '@/data/laid_content.json';
import { renderMarkdown } from '@/lib/mdrender';

const formatLabels: Record<string, string> = {
  short: 'Short',
  linkedin: 'LinkedIn',
  x: 'X',
  email: 'Email',
  blog: 'Blog',
  carousel: 'Carousel',
};

const formatColors: Record<string, string> = {
  short: 'bg-[#c9a84c] text-black',
  linkedin: 'bg-[#0077b5] text-white',
  x: 'bg-white text-black',
  email: 'bg-[#ea4335] text-white',
  blog: 'bg-[#34a853] text-white',
  carousel: 'bg-[#8a7340] text-white',
};

interface TopicGroup {
  keyword: string;
  title: string;
  hook: string;
  pieces: typeof contentData;
  postedCount: number;
}

export function DailyCommandView() {
  const [posted, setPosted] = useLocalStorage<string[]>('laid-posted', []);
  const [activeFormat, setActiveFormat] = useState<Record<string, string>>({});
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [yesterdayDMs, setYesterdayDMs] = useLocalStorage<number>('laid-daily-dms', 0);
  const [yesterdayCalls, setYesterdayCalls] = useLocalStorage<number>('laid-daily-calls', 0);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const topics = useMemo(() => {
    const groups: Record<string, typeof contentData> = {};
    contentData.forEach((item) => {
      if (!groups[item.dm_keyword]) groups[item.dm_keyword] = [];
      groups[item.dm_keyword].push(item);
    });
    return Object.entries(groups).map(([keyword, pieces]) => ({
      keyword,
      title: pieces[0]?.title || keyword,
      hook: pieces[0]?.hook || '',
      pieces,
      postedCount: pieces.filter((p) => posted.includes(p.id)).length,
    }));
  }, [posted]);

  const featuredTopics = useMemo(() => {
    return [...topics].sort((a, b) => a.postedCount - b.postedCount).slice(0, 3);
  }, [topics]);

  const weeklyPostedCount = useMemo(() => {
    // All posted items count as "this week" for now since we don't track dates
    return posted.length;
  }, [posted]);

  const streakDays = useMemo(() => {
    return posted.length > 0 ? Math.min(7, Math.max(1, Math.floor(posted.length / 3))) : 0;
  }, [posted]);

  const getActivePiece = useCallback(
    (topic: TopicGroup) => {
      const format = activeFormat[topic.keyword] || 'short';
      return topic.pieces.find((p) => p.format === format) || topic.pieces[0];
    },
    [activeFormat]
  );

  const togglePosted = (id: string) => {
    setPosted((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ visible: true, message: 'Copied to clipboard' });
    setTimeout(() => setToast({ visible: false, message: '' }), 2000);
  };

  const toggleExpanded = (keyword: string) => {
    setExpandedTopic((prev) => (prev === keyword ? null : keyword));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c9a84c]/30 bg-[#c9a84c]/10">
          <Zap className="h-5 w-5 text-[#c9a84c]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Today's Mission</h1>
          <p className="text-xs text-[#666666]">{dateStr}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#222222] bg-[#111111] p-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-3.5 w-3.5 text-[#c9a84c]" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#666666]">Posted This Week</span>
          </div>
          <p className="mt-1 text-xl font-bold text-white">{weeklyPostedCount}</p>
        </div>
        <div className="rounded-lg border border-[#222222] bg-[#111111] p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-[#c9a84c]" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#666666]">Best Keyword</span>
          </div>
          <p className="mt-1 text-xl font-bold text-[#c9a84c]">GPT55</p>
        </div>
        <div className="rounded-lg border border-[#222222] bg-[#111111] p-3">
          <div className="flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-[#c9a84c]" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#666666]">Streak</span>
          </div>
          <p className="mt-1 text-xl font-bold text-white">
            {streakDays} <span className="text-xs font-normal text-[#666666]">days</span>
          </p>
        </div>
      </div>

      {/* Featured Topics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#c9a84c]" />
          <h2 className="text-sm font-semibold text-white">Top 3 Priorities — Least Used Topics</h2>
        </div>

        {featuredTopics.map((topic, index) => {
          const isExpanded = expandedTopic === topic.keyword;
          const activePiece = getActivePiece(topic);
          const isPosted = posted.includes(activePiece.id);

          return (
            <div
              key={topic.keyword}
              className="rounded-lg border border-[#222222] bg-[#111111] transition-all duration-200"
            >
              {/* Topic Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-[#c9a84c] text-[10px] font-medium text-[#c9a84c]"
                      >
                        #{index + 1} {topic.keyword}
                      </Badge>
                      <span className="text-[10px] text-[#666666]">
                        {topic.postedCount}/{topic.pieces.length} posted
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-white">{topic.title}</h3>
                    <p className="mt-1 text-xs italic text-[#a0a0a0]">{topic.hook}</p>
                  </div>
                </div>

                {/* Format Buttons */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {topic.pieces.map((piece) => {
                    const isActive = activePiece.id === piece.id;
                    const piecePosted = posted.includes(piece.id);
                    return (
                      <button
                        key={piece.format}
                        onClick={() => {
                          setActiveFormat((prev) => ({ ...prev, [topic.keyword]: piece.format }));
                          setExpandedTopic(topic.keyword);
                        }}
                        className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-[10px] font-semibold uppercase transition-colors ${
                          isActive
                            ? formatColors[piece.format]
                            : 'bg-[#1a1a1a] text-[#666666] hover:text-[#a0a0a0]'
                        }`}
                      >
                        {formatLabels[piece.format]}
                        {piecePosted && <CheckCircle className="h-2.5 w-2.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Expand toggle */}
                {isExpanded && (
                  <div className="mt-3 border-t border-[#222222] pt-3">
                    {/* Body Panel */}
                    <div className="rounded-md border border-[#222222] bg-[#0a0a0a] p-3">
                      <div
                        className="content-body max-h-[300px] overflow-y-auto text-[12px] leading-relaxed text-[#a0a0a0]"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(activePiece.body) }}
                      />
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-[#c9a84c] bg-transparent text-[#c9a84c] hover:bg-[#c9a84c]/10 text-xs"
                        onClick={() => handleCopy(activePiece.body)}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copy {formatLabels[activePiece.format]}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 text-xs ${
                          isPosted
                            ? 'border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10'
                            : 'border-[#222222] text-[#a0a0a0] hover:border-[#c9a84c] hover:text-[#c9a84c]'
                        }`}
                        onClick={() => togglePosted(activePiece.id)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {isPosted ? 'Posted' : 'Mark Posted'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Toggle expand/collapse if body is shown */}
                {isExpanded && (
                  <button
                    onClick={() => toggleExpanded(topic.keyword)}
                    className="mt-2 text-[10px] text-[#666666] hover:text-[#a0a0a0]"
                  >
                    Hide content
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Yesterday's Performance */}
      <div className="rounded-lg border border-[#222222] bg-[#111111] p-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#c9a84c]" />
          <h2 className="text-sm font-semibold text-white">Yesterday's Performance</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#666666]">
              DMs Received
            </label>
            <input
              type="number"
              min={0}
              value={yesterdayDMs}
              onChange={(e) => setYesterdayDMs(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-[#222222] bg-[#0a0a0a] px-3 text-sm text-white placeholder:text-[#666666] focus:border-[#c9a84c] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[#666666]">
              Calls Booked
            </label>
            <input
              type="number"
              min={0}
              value={yesterdayCalls}
              onChange={(e) => setYesterdayCalls(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-[#222222] bg-[#0a0a0a] px-3 text-sm text-white placeholder:text-[#666666] focus:border-[#c9a84c] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.visible && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transform lg:bottom-8">
          <div className="flex items-center gap-2 rounded-lg border border-[#c9a84c] bg-[#111111] px-4 py-3 shadow-lg">
            <span className="text-sm font-medium text-white">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
