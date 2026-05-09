export interface ContentPiece {
  id: string;
  format: string;
  title: string;
  hook: string;
  body: string;
  dm_keyword: string;
  status: string;
}

export interface ContentPack {
  id: string;
  tool_name: string;
  source_url: string;
  source_date?: string;
  summary: string;
  audience: string;
  theme: string;
  style: 'ai_news' | 'workflow' | 'system';
  created_at?: string;
  impact_score?: number;
  adoption_score?: number;
  story_score?: number;
  long_post: {
    title: string;
    body_markdown: string;
  };
  x_thread: {
    hook: string;
    tweets: string[];
  };
  ig_caption: {
    hook: string;
    body: string;
    cta: string;
  };
  carousel: {
    slides: Array<{
      title: string;
      bullets: string[];
    }>;
  };
  short_script: {
    title: string;
    beats: string[];
  };
}

export interface CommandCenterSettings {
  openaiApiKey: string;
  perplexityApiKey: string;
  audience: string;
  defaultStyle: 'ai_news' | 'workflow' | 'system';
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
