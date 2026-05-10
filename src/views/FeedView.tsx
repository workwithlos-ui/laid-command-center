import { useState, useMemo } from 'react';
import { Search, Copy, CheckCircle, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import contentData from '@/data/laid_content.json';
import { renderMarkdown } from '@/lib/mdrender';

const statusFilters = [
  { key: 'all', label: 'All Topics' },
  { key: 'ready', label: 'Ready to Post' },
  { key: 'posted', label: 'Posted' },
];

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

export function FeedView() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [posted, setPosted] = useLocalStorage<string[]>('laid-posted', []);
  const [expandedTopics, setExpandedTopics] = useLocalStorage<string[]>('laid-expanded', []);
  const [activeFormat, setActiveFormat] = useState<Record<string, string>>({});
  const [toast, setToast] = useState({ visible: false, message: '' });

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

  const filtered = useMemo(() => {
    return topics.filter((topic) => {
      const allPosted = topic.postedCount === topic.pieces.length;
      const nonePosted = topic.postedCount === 0;
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'posted'
            ? allPosted
            : nonePosted || topic.postedCount < topic.pieces.length;
      const matchSearch =
        search === '' ||
        topic.title.toLowerCase().includes(search.toLowerCase()) ||
        topic.keyword.toLowerCase().includes(search.toLowerCase()) ||
        topic.hook.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [topics, statusFilter, search]);

  const togglePosted = (id: string) => {
    setPosted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleExpanded = (keyword: string) => {
    setExpandedTopics((prev) =>
      prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ visible: true, message: 'Copied. Now go post it.' });
    setTimeout(() => setToast({ visible: false, message: '' }), 2000);
  };

  const getActivePiece = (topic: typeof filtered[0]) => {
    const format = activeFormat[topic.keyword] || 'short';
    return topic.pieces.find((p) => p.format === format) || topic.pieces[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
          <Input
            placeholder="Search topics..."
            className="h-9 border-[#222222] bg-[#111111] pl-9 text-sm text-white placeholder:text-[#666666]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {statusFilters.map((f) => (
            <Button
              key={f.key}
              variant="ghost"
              size="sm"
              className={`h-7 text-[11px] ${
                statusFilter === f.key
                  ? 'bg-[#1a1a1a] text-[#c9a84c]'
                  : 'text-[#666666] hover:text-[#a0a0a0]'
              }`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-[#666666]">
        {filtered.length} topics • {filtered.reduce((acc, t) => acc + t.pieces.length, 0)} format variations
      </p>

      <div className="space-y-3">
        {filtered.map((topic) => {
          const isExpanded = expandedTopics.includes(topic.keyword);
          const activePiece = getActivePiece(topic);
          const allPosted = topic.postedCount === topic.pieces.length;
          const somePosted = topic.postedCount > 0 && topic.postedCount < topic.pieces.length;

          return (
            <div
              key={topic.keyword}
              className={`rounded-lg border bg-[#111111] transition-all duration-200 ${
                allPosted ? 'border-[#22c55e]/40' : somePosted ? 'border-[#c9a84c]/40' : 'border-[#222222]'
              }`}
            >
              {/* Topic Header */}
              <div
                className="cursor-pointer p-4"
                onClick={() => toggleExpanded(topic.keyword)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded border border-[#c9a84c] px-2 py-0.5 font-mono text-[10px] font-medium text-[#c9a84c]">
                        {topic.keyword}
                      </span>
                      {allPosted && (
                        <span className="rounded bg-[#22c55e]/10 px-2 py-0.5 text-[10px] font-medium text-[#22c55e]">
                          All Posted
                        </span>
                      )}
                      {somePosted && (
                        <span className="rounded bg-[#c9a84c]/10 px-2 py-0.5 text-[10px] font-medium text-[#c9a84c]">
                          {topic.postedCount}/{topic.pieces.length} Posted
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-white">{topic.title}</h3>
                    <p className="mt-1 text-xs italic text-[#a0a0a0]">{topic.hook}</p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[#666666] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-[#222222] p-4">
                  {/* Format Tabs */}
                  <div className="mb-3 flex flex-wrap gap-1">
                    {topic.pieces.map((piece) => (
                      <button
                        key={piece.format}
                        onClick={() => setActiveFormat((prev) => ({ ...prev, [topic.keyword]: piece.format }))}
                        className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold uppercase transition-colors ${
                          activePiece.format === piece.format
                            ? formatColors[piece.format]
                            : 'bg-[#1a1a1a] text-[#666666] hover:text-[#a0a0a0]'
                        }`}
                      >
                        {formatLabels[piece.format]}
                        {posted.includes(piece.id) && <CheckCircle className="h-2.5 w-2.5" />}
                      </button>
                    ))}
                  </div>

                  {/* Active Format Content */}
                  <div className="rounded-md border border-[#222222] bg-[#0a0a0a] p-3">
                    <div
                      className="content-body max-h-[400px] overflow-y-auto text-[12px] leading-relaxed text-[#a0a0a0]"
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
                        posted.includes(activePiece.id)
                          ? 'border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10'
                          : 'border-[#222222] text-[#a0a0a0] hover:border-[#c9a84c] hover:text-[#c9a84c]'
                      }`}
                      onClick={() => togglePosted(activePiece.id)}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {posted.includes(activePiece.id) ? 'Posted' : 'Mark Posted'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-[#222222] bg-[#111111] py-12 text-center text-sm text-[#666666]">
          No topics match your search.
        </div>
      )}

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
