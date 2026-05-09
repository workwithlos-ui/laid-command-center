/**
 * src/lib/audienceQueries.ts
 * Supabase query helpers for the Audience Intel dashboard.
 * Falls back to realistic mock data when Supabase is not configured.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type AudienceInsight = Database['public']['Tables']['audience_insights']['Row'];

export interface ThemeStat {
  theme: string;
  count: number;
}

export interface SubredditStat {
  subreddit: string;
  count: number;
}

// ─── Mock data ─────────────────────────────────────────────
export const MOCK_INSIGHTS: AudienceInsight[] = [
  {
    id: 'mock-1',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/agency/comments/abc123',
    subreddit: 'agency',
    theme: 'AI agency burnout',
    pain_point: 'Clients want AI automation but don\'t understand the cost or complexity',
    quote: 'I\'ve had 3 clients this month ask me to "just add AI" to their workflows for $500. They think it\'s a button.',
    score: 847,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/nocode/comments/def456',
    subreddit: 'nocode',
    theme: 'n8n vs make',
    pain_point: 'Confused about which automation platform to build on for client work',
    quote: 'I started with Make but now clients are asking for n8n. Do I learn both or just pick one and stick with it?',
    score: 623,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/Entrepreneur/comments/ghi789',
    subreddit: 'Entrepreneur',
    theme: 'lead gen for coaches',
    pain_point: 'Coaches don\'t know how to get consistent leads without paid ads',
    quote: 'I\'ve tried every organic strategy and get 0 DMs a week. Meanwhile people say they\'re landing 10 clients a month from Instagram. What am I missing?',
    score: 1203,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-4',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/marketing/comments/jkl012',
    subreddit: 'marketing',
    theme: 'content consistency struggle',
    pain_point: 'Posting consistently while also delivering client work is unsustainable',
    quote: 'Week 1: 7 posts, Week 2: 3 posts, Week 3: 0 posts. Every single time. How do agencies batch content when client work explodes?',
    score: 445,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-5',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/agency/comments/mno345',
    subreddit: 'agency',
    theme: 'AI agency burnout',
    pain_point: 'Scope creep from AI projects destroying margins',
    quote: 'Sold a $3k AI automation project. It turned into 60 hours of work because the client kept "thinking of one more thing." Need better contracts.',
    score: 712,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-6',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/SaaS/comments/pqr678',
    subreddit: 'SaaS',
    theme: 'pricing anxiety',
    pain_point: 'Fear of charging premium prices without a strong personal brand',
    quote: 'How do people charge $5k/month retainers without an audience? I feel like I need 10k followers before I can ask for that.',
    score: 934,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-7',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/nocode/comments/stu901',
    subreddit: 'nocode',
    theme: 'n8n vs make',
    pain_point: 'n8n self-hosting complexity vs Make\'s cost at scale',
    quote: 'Make is getting expensive. Looking at n8n self-hosted but the setup time is killing me. Is there a middle ground?',
    score: 388,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-8',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/freelance/comments/vwx234',
    subreddit: 'freelance',
    theme: 'lead gen for coaches',
    pain_point: 'Cold DMs not converting to booked calls',
    quote: 'Sent 200 DMs last month. Got 8 replies. 2 calls booked. 0 closed. Is this normal or is my offer broken?',
    score: 567,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-9',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/Entrepreneur/comments/yza567',
    subreddit: 'Entrepreneur',
    theme: 'content consistency struggle',
    pain_point: 'Video content feels too vulnerable, fear of judgment',
    quote: 'I know I need to post on camera. I know it works. But I literally freeze when I hit record. Has anyone gotten over this?',
    score: 1567,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-10',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/marketing/comments/bcd890',
    subreddit: 'marketing',
    theme: 'AI agency burnout',
    pain_point: 'Clients churning because AI results don\'t match inflated expectations',
    quote: 'Promised AI would 10x their leads. After 3 months it 2x\'d them. Client left anyway. Setting expectations on AI is impossible.',
    score: 823,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-11',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/SaaS/comments/efg123',
    subreddit: 'SaaS',
    theme: 'pricing anxiety',
    pain_point: 'Undercharging for AI work because unsure of market rate',
    quote: 'What is everyone actually charging for an AI chatbot build? I\'ve seen $500 and $50,000 for what looks like the same thing.',
    score: 1102,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-12',
    user_id: 'demo',
    source: 'dm',
    source_url: null,
    subreddit: null,
    theme: 'lead gen for coaches',
    pain_point: 'No clear offer differentiation in saturated coaching market',
    quote: 'Everyone is a mindset coach now. How do I stand out when every bio looks identical?',
    score: 0,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-13',
    user_id: 'demo',
    source: 'reddit',
    source_url: 'https://reddit.com/r/agency/comments/hij456',
    subreddit: 'agency',
    theme: 'content consistency struggle',
    pain_point: 'Repurposing content takes as long as creating it',
    quote: 'I spend 3 hours writing a YouTube script, then another 3 making it into tweets, LinkedIn, and emails. There has to be a better way.',
    score: 678,
    used_in_content_id: null,
    created_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Query functions ───────────────────────────────────────

/**
 * getInsights — fetch audience insights for the current user.
 * Falls back to mock data when Supabase is unconfigured.
 */
export async function getInsights(userId?: string): Promise<AudienceInsight[]> {
  if (!isSupabaseConfigured() || !userId) {
    return MOCK_INSIGHTS;
  }

  try {
    const { data, error } = await supabase
      .from('audience_insights')
      .select('*')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(200);

    if (error) throw error;
    return (data as AudienceInsight[]) || MOCK_INSIGHTS;
  } catch {
    return MOCK_INSIGHTS;
  }
}

/**
 * getThemeStats — count insights per theme for the current user.
 */
export async function getThemeStats(userId?: string): Promise<ThemeStat[]> {
  const insights = await getInsights(userId);

  const counts: Record<string, number> = {};
  for (const insight of insights) {
    if (insight.theme) {
      counts[insight.theme] = (counts[insight.theme] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * getSubredditStats — count insights per subreddit for the current user.
 */
export async function getSubredditStats(userId?: string): Promise<SubredditStat[]> {
  const insights = await getInsights(userId);

  const counts: Record<string, number> = {};
  for (const insight of insights) {
    if (insight.subreddit) {
      counts[insight.subreddit] = (counts[insight.subreddit] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([subreddit, count]) => ({ subreddit, count }))
    .sort((a, b) => b.count - a.count);
}
