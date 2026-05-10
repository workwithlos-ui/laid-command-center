export interface ContentPiece {
  id: string;
  format: string;
  title: string;
  hook: string;
  body: string;
  dm_keyword: string;
  status: string;
}

export interface Asset {
  id: string;
  keyword: string;
  title: string;
  what_is: string;
  exact_content: string;
  how_to: string;
  expected_result: string;
  troubleshooting: string;
}

export interface Prospect {
  id: number;
  name: string;
  company: string;
  industry: string;
  revenue: string;
  linkedin: string;
  website: string;
  icebreaker: string;
  stage: string;
}

// ── AI Content Command Center Types ──

export type ContentStyle = 'ai_news' | 'workflow' | 'system';

export type OutputFormat = 'long_post' | 'x_thread' | 'ig_caption' | 'carousel' | 'short_script';

export type PackRating = 'up' | 'neutral' | 'down' | null;

export interface AgentLogEntry {
  agent: string;
  summary: string;
  score?: number;
}

export interface LongPost {
  title: string;
  body_markdown: string;
}

export interface XThread {
  hook: string;
  tweets: string[];
}

export interface IGCaption {
  hook: string;
  body: string;
  cta: string;
}

export interface CarouselSlide {
  title: string;
  bullets: string[];
}

export interface Carousel {
  slides: CarouselSlide[];
}

export interface ShortScript {
  title: string;
  beats: string[];
}

export interface ContentPack {
  id: string;
  tool_name: string;
  source_url: string;
  summary: string;
  audience: string;
  theme: string;
  style: ContentStyle;
  created_at: string;
  posted: boolean;
  long_post: LongPost;
  x_thread: XThread;
  ig_caption: IGCaption;
  carousel: Carousel;
  short_script: ShortScript;
  strategy?: unknown;
  source_brief?: unknown;
  editor_review?: unknown;
  agent_log?: AgentLogEntry[];
  quality_score?: number;
  critic_score?: number;
  rating?: PackRating;
}

export interface ApiKeys {
  perplexity: string;
  openai: string;
}

export interface GenerationSettings {
  apiKeys: ApiKeys;
  audience: string;
  defaultStyle: ContentStyle;
  theme: string;
  voiceTraining?: string;
}

export interface GenerationRequest {
  sourceUrl: string;
  theme: string;
  style: ContentStyle;
  customPrompt?: string;
}

export interface GenerationProgress {
  stage: 'idle' | 'strategizing' | 'finding' | 'filtering' | 'writing' | 'quality_gate' | 'repurposing' | 'editing' | 'complete' | 'error';
  message: string;
  pack?: ContentPack;
}

export const formatLabels: Record<OutputFormat, string> = {
  long_post: 'Long Post',
  x_thread: 'X Thread',
  ig_caption: 'IG Caption',
  carousel: 'Carousel',
  short_script: 'Short Script',
};

export const formatDescriptions: Record<OutputFormat, string> = {
  long_post: 'LinkedIn-style long-form post (500-1,500 words)',
  x_thread: '8-12 tweet thread with hook',
  ig_caption: 'Hook + body + CTA for Instagram',
  carousel: '8-12 slide outline with titles and bullets',
  short_script: '45-60 second video script with beats',
};

export const styleLabels: Record<ContentStyle, string> = {
  ai_news: 'AI News',
  workflow: 'Workflow / SOP',
  system: 'Story + System',
};

export const styleDescriptions: Record<ContentStyle, string> = {
  ai_news: 'Update → what changed → use case → how to try it',
  workflow: 'Tactical SOP with numbered steps and screenshots',
  system: 'Story + framework + implementation',
};
