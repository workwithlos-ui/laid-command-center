import { useState } from 'react';
import { X, Wand2, Loader2, Bug, ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ContentStyle } from '@/data/types';
import { styleLabels, styleDescriptions } from '@/data/types';
import { isUsingRealPipeline } from '@/lib/contentGeneration';
import type { StageLog } from '@/lib/pipeline';

interface GenerateModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (request: {
    sourceUrl: string;
    theme: string;
    style: ContentStyle;
    customPrompt?: string;
  }) => void;
  isGenerating: boolean;
  progress: { stage: string; message: string } | null;
  stageLogs?: StageLog[];
  usedRealPipeline?: boolean;
  tokensUsed?: number;
}

export function GenerateModal({
  open,
  onClose,
  onGenerate,
  isGenerating,
  progress,
  stageLogs = [],
  usedRealPipeline = false,
  tokensUsed = 0,
}: GenerateModalProps) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [theme, setTheme] = useState('AI updates that actually change workflow');
  const [style, setStyle] = useState<ContentStyle>('ai_news');
  const [showDebug, setShowDebug] = useState(false);
  const hasKey = isUsingRealPipeline();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim() && !customPrompt.trim()) return;
    onGenerate({
      sourceUrl: sourceUrl.trim(),
      theme,
      style,
      customPrompt: customPrompt.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (isGenerating) return;
    setSourceUrl('');
    setCustomPrompt('');
    setShowDebug(false);
    onClose();
  };

  // Calculate progress percentage based on stage
  const progressValue =
    progress?.stage === 'finding'
      ? 15
      : progress?.stage === 'filtering'
        ? 30
        : progress?.stage === 'writing'
          ? 50
          : progress?.stage === 'repurposing'
            ? 75
            : progress?.stage === 'complete'
              ? 100
              : progress?.stage === 'error'
                ? 100
                : 5;

  // Agent stages in order
  const agentStages = [
    { key: 'news_finder', num: 1, label: 'News Finder', status: stageLogs[0]?.status || 'pending' },
    { key: 'relevance_filter', num: 2, label: 'Relevance Filter', status: stageLogs[1]?.status || 'pending' },
    { key: 'long_post_writer', num: 3, label: 'Long-Post Writer', status: stageLogs[2]?.status || 'pending' },
    { key: 'repurposer', num: 4, label: 'Repurposer', status: stageLogs[3]?.status || 'pending' },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg border-[#222222] bg-[#111111] p-0 text-white sm:max-w-lg [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-[#222222] p-4">
          <DialogTitle className="text-sm font-semibold text-white">
            Generate Content Pack
          </DialogTitle>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="rounded-md p-1 text-[#666666] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* API Mode Badge */}
          <div className="flex items-center gap-2">
            {hasKey ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-400">
                <Wifi className="size-3" />
                Agent Pipeline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#c9a84c]/10 px-2 py-0.5 text-[11px] font-medium text-[#c9a84c]">
                <WifiOff className="size-3" />
                Simulation Mode
              </span>
            )}
            {!hasKey && (
              <span className="text-[11px] text-[#666666]">
                Add your OpenAI API key in Settings for real generation
              </span>
            )}
          </div>

          {/* Source URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a0a0a0]">
              Source URL
            </label>
            <Input
              placeholder="https://openai.com/blog/..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              disabled={isGenerating}
              className="h-9 border-[#222222] bg-[#0a0a0a] text-sm text-white placeholder:text-[#666666] focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/20"
            />
          </div>

          {/* Custom Prompt (optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a0a0a0]">
              Custom Prompt <span className="text-[#666666]">(optional)</span>
            </label>
            <Input
              placeholder="Describe the AI tool or news..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isGenerating}
              className="h-9 border-[#222222] bg-[#0a0a0a] text-sm text-white placeholder:text-[#666666] focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/20"
            />
          </div>

          {/* Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a0a0a0]">Theme</label>
            <Input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              disabled={isGenerating}
              className="h-9 border-[#222222] bg-[#0a0a0a] text-sm text-white placeholder:text-[#666666] focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/20"
            />
          </div>

          {/* Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a0a0a0]">Content Style</label>
            <Select
              value={style}
              onValueChange={(v) => setStyle(v as ContentStyle)}
              disabled={isGenerating}
            >
              <SelectTrigger className="h-9 w-full border-[#222222] bg-[#0a0a0a] text-sm text-white [&>span]:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#222222] bg-[#1a1a1a] text-white">
                {(Object.keys(styleLabels) as ContentStyle[]).map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="text-sm text-white focus:bg-[#222222] focus:text-[#c9a84c]"
                  >
                    <div className="flex flex-col">
                      <span>{styleLabels[s]}</span>
                      <span className="text-[11px] text-[#666666]">
                        {styleDescriptions[s]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          {isGenerating && progress && (
            <div className="space-y-3 rounded-md border border-[#222222] bg-[#0a0a0a] p-3">
              {/* Progress bar */}
              <Progress value={progressValue} className="h-1.5 bg-[#222222]" />

              {/* Current stage message */}
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c9a84c]" />
                <span className="text-xs text-[#a0a0a0]">{progress.message}</span>
              </div>

              {/* Agent stage dots */}
              <div className="flex items-center gap-1">
                {agentStages.map((agent, i) => (
                  <div key={agent.key} className="flex items-center gap-1">
                    <span
                      className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        agent.status === 'done'
                          ? 'bg-green-500/20 text-green-400'
                          : agent.status === 'running'
                            ? 'bg-[#c9a84c]/20 text-[#c9a84c] animate-pulse'
                            : agent.status === 'error'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-[#222222] text-[#666666]'
                      }`}
                    >
                      {agent.num}
                    </span>
                    <span
                      className={`text-[10px] ${
                        agent.status === 'done'
                          ? 'text-green-400'
                          : agent.status === 'running'
                            ? 'text-[#c9a84c]'
                            : agent.status === 'error'
                              ? 'text-red-400'
                              : 'text-[#666666]'
                      }`}
                    >
                      {agent.label}
                    </span>
                    {i < agentStages.length - 1 && (
                      <span className="text-[#333333] mx-0.5">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isGenerating}
              className="h-8 border-[#222222] bg-transparent text-xs text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isGenerating || (!sourceUrl.trim() && !customPrompt.trim())}
              className="h-8 bg-[#c9a84c] text-xs font-semibold text-black hover:bg-[#c9a84c]/90 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-1 h-3.5 w-3.5" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Debug Panel */}
        {stageLogs.length > 0 && (
          <div className="border-t border-[#222222]">
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className="flex w-full items-center justify-between px-4 py-2 text-xs text-[#666666] hover:text-[#a0a0a0] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Bug className="size-3" />
                {usedRealPipeline ? `Agent Logs (${tokensUsed.toLocaleString()} tokens)` : 'Simulation Logs'}
              </span>
              {showDebug ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>
            {showDebug && (
              <div className="max-h-[300px] overflow-y-auto px-4 pb-4">
                {stageLogs.map((log, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold ${
                          log.status === 'done'
                            ? 'text-green-400'
                            : log.status === 'error'
                              ? 'text-red-400'
                              : 'text-[#c9a84c]'
                        }`}
                      >
                        {log.stage.toUpperCase().replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-[#666666]">
                        {Math.round(log.durationMs)}ms
                        {log.tokensUsed ? ` · ${log.tokensUsed} tokens` : ''}
                      </span>
                    </div>
                    {log.rawOutput && (
                      <pre className="text-[10px] text-[#888888] bg-[#0a0a0a] rounded p-2 overflow-x-auto border border-[#222222]">
                        {log.rawOutput.length > 800
                          ? log.rawOutput.slice(0, 800) + '\n\n[...truncated]'
                          : log.rawOutput}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
