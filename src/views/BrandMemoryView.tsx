import { useMemo, useState } from 'react';
import { AlertCircle, Ban, CheckCircle2, ClipboardList, Lightbulb, MessageCircleQuestion, PenLine, Quote, Save, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContentPacks } from '@/hooks/useContentPacks';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getActiveClientWorkspace } from '@/lib/clientWorkspace';

const defaultMemory = {
  voiceRules: 'Direct, tactical, operator-grade. Use short sentences, concrete examples, and clear implementation language. Avoid generic AI hype.',
  winningHooks: 'The posts that win promise a specific workflow improvement, reveal a costly mistake, or turn news into a repeatable system.',
  failedContent: 'Avoid vague productivity claims, bland AI summaries, tool worship, and content that lacks a clear reader action.',
  audienceObjections: 'I do not have time. AI content feels generic. This sounds complicated. I need leads, not theory. My team will not adopt another tool.',
  approvedPhrases: 'operator workflow, content sprint, practical AI system, repeatable SOP, founder-led growth, implementation path, quality gate',
  bannedPhrases: 'game changer, revolutionary, unlock your potential, in today’s fast-paced world, AI-powered magic, just automate everything',
};

type MemoryState = typeof defaultMemory;

type MemoryKey = keyof MemoryState;

const sections: Array<{ key: MemoryKey; title: string; description: string; icon: typeof PenLine }> = [
  { key: 'voiceRules', title: 'Voice Rules', description: 'How Content Command should sound every time.', icon: PenLine },
  { key: 'winningHooks', title: 'Winning Hooks', description: 'Patterns that deserve more generation weight.', icon: Trophy },
  { key: 'failedContent', title: 'Failed Content', description: 'What should be avoided or rewritten.', icon: AlertCircle },
  { key: 'audienceObjections', title: 'Audience Objections', description: 'Friction the content must address directly.', icon: MessageCircleQuestion },
  { key: 'approvedPhrases', title: 'Approved Phrases', description: 'Language the brand can safely reuse.', icon: CheckCircle2 },
  { key: 'bannedPhrases', title: 'Banned Phrases', description: 'Language that should trigger the editor gate.', icon: Ban },
];

export function BrandMemoryView() {
  const [activeWorkspace] = useState(() => getActiveClientWorkspace());
  const { packs } = useContentPacks();
  const [memory, setMemory] = useLocalStorage<MemoryState>(`content-command-brand-memory-${activeWorkspace.id}`, {
    ...defaultMemory,
    voiceRules: activeWorkspace.voiceRules || defaultMemory.voiceRules,
    audienceObjections: `${defaultMemory.audienceObjections}\n\nClient audience: ${activeWorkspace.audience}`,
    approvedPhrases: `${defaultMemory.approvedPhrases}, ${activeWorkspace.offer}`,
    bannedPhrases: activeWorkspace.bannedPhrases || defaultMemory.bannedPhrases,
  });
  const [savedAt, setSavedAt] = useLocalStorage<string>(`content-command-brand-memory-saved-${activeWorkspace.id}`, '');

  const learnings = useMemo(() => {
    const liked = packs.filter((pack) => pack.rating === 'up');
    const disliked = packs.filter((pack) => pack.rating === 'down');
    return [
      {
        title: 'New winning hook candidate',
        body: liked[0]?.x_thread?.hook || 'Hooks that promise a concrete workflow result should be promoted in future sprints.',
        action: 'Add to Winning Hooks',
        target: 'winningHooks' as MemoryKey,
      },
      {
        title: 'Failure pattern detected',
        body: disliked[0]?.summary || 'Down-rated outputs should be translated into clear banned patterns before the next generation run.',
        action: 'Add to Failed Content',
        target: 'failedContent' as MemoryKey,
      },
      {
        title: 'Editor training update',
        body: 'The six-agent editor should continue rejecting broad AI hype and enforce stronger CTAs tied to implementation.',
        action: 'Add to Voice Rules',
        target: 'voiceRules' as MemoryKey,
      },
    ];
  }, [packs]);

  const updateMemory = (key: MemoryKey, value: string) => setMemory({ ...memory, [key]: value });

  const appendLearning = (target: MemoryKey, body: string) => {
    setMemory({ ...memory, [target]: `${memory[target].trim()}\n\n${body}` });
    setSavedAt(new Date().toLocaleString());
  };

  return (
    <div className="space-y-8">
      <section className="obsidian-card obsidian-glow rounded-[28px] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Brand Memory</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#F8FAFC] md:text-5xl">The taste layer behind every agent.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#A1A1AA]">
              Keep {activeWorkspace.name}'s voice rules, hook patterns, objections, and phrase library in one editable memory layer so future content becomes more distinctive over time.
            </p>
          </div>
          <Button onClick={() => setSavedAt(new Date().toLocaleString())} className="h-12 rounded-2xl bg-gradient-to-r from-[#A855F7] to-[#22D3EE] px-5 text-sm font-semibold text-white shadow-[0_0_34px_rgba(168,85,247,0.22)] hover:opacity-95">
            <Save className="mr-2 h-4 w-4" /> Save Memory
          </Button>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs text-[#71717A]">
          {savedAt ? `Last saved ${savedAt}` : 'Memory is saved locally as you edit. Press Save Memory to mark a review point.'}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {learnings.map((learning) => (
          <article key={learning.title} className="obsidian-elevated rounded-[24px] p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A855F7]/18 to-[#22D3EE]/12">
                <Sparkles className="h-5 w-5 text-[#D8B4FE]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#22D3EE]">New Learning Available</p>
                <h3 className="mt-1 text-sm font-semibold text-[#F8FAFC]">{learning.title}</h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#A1A1AA]">{learning.body}</p>
            <button onClick={() => appendLearning(learning.target, learning.body)} className="mt-5 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-medium text-[#F8FAFC] transition hover:border-[#A855F7]/50">
              {learning.action}
            </button>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <article key={section.key} className="obsidian-card rounded-[24px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white/[0.055] text-[#22D3EE]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#F8FAFC]">{section.title}</h3>
                    <p className="mt-1 text-xs text-[#71717A]">{section.description}</p>
                  </div>
                </div>
                {section.key === 'approvedPhrases' && <Quote className="h-4 w-4 text-[#71717A]" />}
                {section.key === 'voiceRules' && <ClipboardList className="h-4 w-4 text-[#71717A]" />}
                {section.key === 'winningHooks' && <Lightbulb className="h-4 w-4 text-[#71717A]" />}
              </div>
              <textarea value={memory[section.key]} onChange={(event) => updateMemory(section.key, event.target.value)} rows={7} className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-[#050508]/62 px-4 py-3 text-sm leading-6 text-[#F8FAFC] outline-none transition placeholder:text-[#71717A] focus:border-[#A855F7]/50 focus:ring-4 focus:ring-[#A855F7]/10" />
            </article>
          );
        })}
      </section>
    </div>
  );
}
