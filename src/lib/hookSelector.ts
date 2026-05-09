/**
 * src/lib/hookSelector.ts
 * Client-side hook picker that queries supabase.hooks, picks N matching hooks,
 * and fills placeholder slots with topic-relevant terms via OpenAI.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type HookRow = Database['public']['Tables']['hooks']['Row'];

export interface SelectHooksOptions {
  topic: string;
  category?: string;
  count?: number;
  prioritizeOutliers?: boolean;
}

export interface FilledHook {
  id: string;
  category: string;
  template: string;
  filled: string;         // template with placeholders substituted
  score: number;
  is_outlier: boolean;
}

// ─── Mock data for demo mode ──────────────────────────────
const DEMO_HOOKS: HookRow[] = [
  {
    id: 'demo-1',
    category: 'educational',
    template: 'If I woke up (insert pain point) tomorrow, and wanted to (insert dream result) by (insert time) here\'s exactly what I would do.',
    placeholder_count: 3,
    performance_score: 9.0,
    is_outlier: true,
    use_count: 47,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    category: 'myth_busting',
    template: 'Everyone on the internet is going to tell you (insert common belief) is impossible. But I am going to show you how to do it from home.',
    placeholder_count: 1,
    performance_score: 8.5,
    is_outlier: true,
    use_count: 32,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    category: 'authority',
    template: 'In (insert time), I went from (insert before state) to (insert after state).',
    placeholder_count: 3,
    performance_score: 8.0,
    is_outlier: false,
    use_count: 28,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    category: 'comparison',
    template: 'A lot of people ask me what\'s better (insert option #1) or (insert option #2) for (insert dream result). I achieved (insert dream result) doing one of these and it\'s not even close.',
    placeholder_count: 3,
    performance_score: 7.5,
    is_outlier: false,
    use_count: 15,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-5',
    category: 'storytelling',
    template: 'X years ago I was (insert action) because I (insert pain point).',
    placeholder_count: 2,
    performance_score: 7.0,
    is_outlier: false,
    use_count: 12,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-6',
    category: 'educational',
    template: 'Here\'s exactly how you\'re gonna lock in if you want to (insert dream result).',
    placeholder_count: 1,
    performance_score: 7.5,
    is_outlier: false,
    use_count: 22,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-7',
    category: 'random_engagement',
    template: 'What if I told you this (insert item) could (insert result).',
    placeholder_count: 2,
    performance_score: 6.5,
    is_outlier: false,
    use_count: 9,
    created_at: new Date().toISOString(),
  },
];

// ─── Placeholder fill logic ────────────────────────────────
/**
 * Simple heuristic filler — used when OpenAI client is not provided.
 * Maps common placeholder patterns to topic-derived text.
 */
function heuristicFill(template: string, topic: string): string {
  const topicWords = topic.split(' ');
  const niche = topicWords.slice(0, 2).join(' ');

  const replacements: Array<[RegExp, string]> = [
    [/\(insert pain point\)/gi, `struggling with ${niche}`],
    [/\(insert dream result\)/gi, `mastering ${niche}`],
    [/\(insert result\)/gi, `real results with ${niche}`],
    [/\(insert action\)/gi, `building your ${niche} system`],
    [/\(insert time\)/gi, '30 days'],
    [/\(insert time frame\)/gi, '90 days'],
    [/\(insert before state\)/gi, 'zero traction'],
    [/\(insert after state\)/gi, `${niche} authority`],
    [/\(insert common belief\)/gi, `${niche} is too saturated`],
    [/\(insert target audience\)/gi, `${niche} creators`],
    [/\(insert noun\)/gi, niche],
    [/\(insert item\)/gi, niche],
    [/\(insert thing\)/gi, niche],
    [/\(insert topic\)/gi, topic],
    [/\(insert description\)/gi, niche],
    [/\(insert title\)/gi, `${niche} expert`],
    [/\(insert option #1\)/gi, 'doing it yourself'],
    [/\(insert option #2\)/gi, 'outsourcing it'],
    [/\(insert age\)/gi, '30'],
    [/\(insert age range\)/gi, '25-35'],
    [/\(insert age group\)/gi, 'your 20s'],
    [/\(insert industry\/niche\)/gi, niche],
    [/\(insert niche\)/gi, niche],
    [/\(insert #\)/gi, '3'],
    [/\(insert metric\)/gi, '$10k/month'],
    [/\(insert \$\)/gi, '$10k'],
    [/\(insert method\)/gi, `the ${niche} framework`],
    [/\(insert skill\)/gi, `${niche} skills`],
    [/\(insert year\)/gi, '2025'],
    [/\(insert label\)/gi, 'beginner'],
    [/\(insert location\)/gi, 'your industry'],
    [/\(insert person\)/gi, 'mentor'],
    [/\(insert place\/location\)/gi, 'the market'],
    [/\(insert business\)/gi, `${niche} business`],
    [/\(insert avenue\)/gi, 'content creation'],
    [/\(insert frequency\)/gi, 'every day'],
    [/\(insert goal\)/gi, `scale with ${niche}`],
    [/\(insert bad result\)/gi, 'burnout'],
    [/\(insert trait\)/gi, 'consistent'],
    [/\(insert adjective\)/gi, 'powerful'],
    [/\(insert price\)/gi, 'half the cost'],
    [/\(insert verb\)/gi, 'using'],
    [/\(insert realization\)/gi, `${niche} changes everything`],
    [/\(insert achievement\)/gi, `${niche} success`],
    [/\(insert event\/item\/result\)/gi, niche],
    [/\(insert event\)/gi, niche],
    [/\(insert quote\)/gi, `"you'll never make it in ${niche}"`],
    [/\(insert dream\)/gi, `building a ${niche} empire`],
    [/\(insert dream goal\)/gi, `dominate ${niche}`],
    [/\(insert negative result\)/gi, 'stole'],
    [/\(insert negative label\)/gi, 'lazy'],
    [/\(insert bad label\)/gi, 'behind'],
    [/\(insert harsh truth\)/gi, 'restart your whole strategy'],
    [/\(insert situation\)/gi, `the ${niche} grind`],
    [/\(insert experience\)/gi, `went all-in on ${niche}`],
    [/\(insert journey\)/gi, `${niche} journey`],
    [/\(insert good situation\)/gi, `${niche} success`],
    [/\(insert bad situation\)/gi, 'zero following'],
    [/\(insert challenge\)/gi, `the ${niche} learning curve`],
    [/\(insert decision\)/gi, `go all-in on ${niche}`],
    [/\(insert current state\)/gi, 'starting out'],
    [/\(insert after state\)/gi, `${niche} pro`],
    [/\(insert famous cliché or quote\)/gi, '"you need a big audience to make money"'],
    [/\(insert occupation\)/gi, `${niche} coach`],
    [/\(insert wishful\)/gi, 'perfect'],
    [/\(insert diagnosis\)/gi, 'missing the key piece'],
    [/\(insert shocking action\)/gi, 'tracked every dollar'],
    [/\(insert life event\)/gi, 'your first $10k month'],
    [/\(insert accomplishment\)/gi, `going viral in ${niche}`],
    [/\(insert observation\)/gi, `the same ${niche} pattern`],
    [/\(insert fact\)/gi, `${niche} works`],
    [/\(insert complete opposite item\)/gi, `being inconsistent in ${niche}`],
    [/\(insert trend\)/gi, `the ${niche} trend`],
    [/\(insert current state\)/gi, 'just starting'],
    [/\(insert guilty pleasure\)/gi, 'enjoying the process'],
    [/\(insert first name\)/gi, 'Los'],
    [/\(insert name\)/gi, 'Los'],
    [/\(insert people\)/gi, 'creators'],
    // Catch-all for any remaining placeholders
    [/\(insert [^)]+\)/gi, niche],
  ];

  let result = template;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * OpenAI-powered fill — uses the provided openai client to intelligently
 * substitute placeholders with topic-relevant, natural-sounding text.
 *
 * @param template - Hook template with (insert X) placeholders
 * @param topic    - User's topic/niche
 * @param openai   - OpenAI client instance (openai npm package)
 */
export async function fillHookWithAI(
  template: string,
  topic: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openai: any
): Promise<string> {
  try {
    const placeholders = [...template.matchAll(/\(insert [^)]+\)/gi)].map((m) => m[0]);
    if (!placeholders.length) return template;

    const prompt = `You are a short-form content hook writer. Fill in these placeholder slots for a hook about "${topic}".

Hook template: "${template}"

Placeholders to fill: ${placeholders.join(', ')}

Rules:
- Keep each fill SHORT (2-5 words max)
- Sound natural and conversational
- Be specific to the topic "${topic}"
- Return ONLY the completed hook text with placeholders replaced, nothing else`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || heuristicFill(template, topic);
  } catch {
    return heuristicFill(template, topic);
  }
}

// ─── Main selector ────────────────────────────────────────
/**
 * selectHooks — picks N hooks from the hooks table, fills placeholders.
 *
 * @param options.topic              - Topic / niche to tailor placeholders to
 * @param options.category           - Optional category filter (e.g. 'educational')
 * @param options.count              - Number of hooks to return (default 5)
 * @param options.prioritizeOutliers - Prefer is_outlier=true hooks (default true)
 * @param openai                     - Optional OpenAI client for AI-powered fill
 */
export async function selectHooks(
  options: SelectHooksOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openai?: any
): Promise<FilledHook[]> {
  const { topic, category, count = 5, prioritizeOutliers = true } = options;

  let hooks: HookRow[];

  if (!isSupabaseConfigured()) {
    // Demo mode: use mock data
    hooks = DEMO_HOOKS;
  } else {
    try {
      let query = supabase
        .from('hooks')
        .select('*')
        .order('performance_score', { ascending: false })
        .limit(count * 6); // fetch more, then score-sort client-side

      if (category) {
        query = query.eq('category', category);
      }

      if (prioritizeOutliers) {
        query = query.order('is_outlier', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      hooks = (data as HookRow[]) || DEMO_HOOKS;
    } catch {
      hooks = DEMO_HOOKS;
    }
  }

  // Shuffle slightly to add variety, then pick top N
  const shuffled = hooks
    .map((h) => ({ hook: h, sort: h.performance_score + Math.random() * 2 }))
    .sort((a, b) => {
      // Outliers always come first if prioritized
      if (prioritizeOutliers) {
        if (a.hook.is_outlier && !b.hook.is_outlier) return -1;
        if (!a.hook.is_outlier && b.hook.is_outlier) return 1;
      }
      return b.sort - a.sort;
    })
    .slice(0, count)
    .map((x) => x.hook);

  // Fill placeholders in parallel
  const filled = await Promise.all(
    shuffled.map(async (hook) => {
      const filledText = openai
        ? await fillHookWithAI(hook.template, topic, openai)
        : heuristicFill(hook.template, topic);

      return {
        id: hook.id,
        category: hook.category,
        template: hook.template,
        filled: filledText,
        score: hook.performance_score,
        is_outlier: hook.is_outlier,
      } satisfies FilledHook;
    })
  );

  return filled;
}

export { DEMO_HOOKS };
