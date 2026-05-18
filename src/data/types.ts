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

export type OutputFormat = 'long_post' | 'linkedin_post' | 'x_thread' | 'ig_caption' | 'carousel' | 'short_script' | 'email' | 'blog' | 'lead_magnet';

export type GenerationInputMode = 'paste_content' | 'youtube_url' | 'voice_record' | 'interview';

export type PackRating = 'up' | 'neutral' | 'down' | null;

export interface ClientWorkspace {
  id: string;
  name: string;
  industry: string;
  offer: string;
  audience: string;
  voiceRules: string;
  proofAssets: string;
  bannedPhrases: string;
  cta: string;
  status: 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface AgentLogEntry {
  agent: string;
  summary: string;
  score?: number;
}

export type AgentArtifactKey =
  | 'researcher'
  | 'organizer'
  | 'optimizer'
  | 'writer'
  | 'source_checker'
  | 'editor'
  | 'tonality_checker'
  | 'engagement_checker';

export interface AgentArtifact {
  key: AgentArtifactKey;
  name: string;
  status: 'waiting' | 'running' | 'done' | 'error';
  produced: string;
  issuesCaught: string[];
  score: number;
  details: Array<{ label: string; value: string }>;
  recommendations: string[];
  updatedAt: string;
}

export interface SourceIntelligenceSummary {
  sourceMode: GenerationInputMode;
  sourceLength: number;
  primaryLinks: string[];
  publishDates: string[];
  exactClaims: Array<{ claim: string; status: 'verified' | 'weak' | 'unsupported'; sourceReference: string }>;
  proofSnippets: string[];
  audiencePainLanguage: string[];
  marketNarrative: string[];
  differentiatedAngles: string[];
  riskFlags: string[];
}

export interface ContentBriefSummary {
  angle: string;
  targetAudience: string;
  hookPromise: string;
  whyNow: string;
  proofAvailable: string[];
  contentStructure: string[];
  cta: string;
  riskFlags: string[];
  approvedAt?: string;
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

export interface LinkedInPost {
  hook: string;
  body: string;
  cta: string;
}

export interface EmailOutput {
  subject: string;
  preview: string;
  body: string;
  cta: string;
}

export interface BlogOutput {
  title: string;
  body_markdown: string;
}

export interface LeadMagnetOutput {
  title: string;
  outline: string[];
  cta: string;
}

export interface PackPerformance {
  views?: number;
  likes?: number;
  comments?: number;
  saves?: number;
  shares?: number;
  dms?: number;
  bookedCalls?: number;
  revenue?: number;
  notes?: string;
  updatedAt: string;
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
  client_workspace_id?: string;
  client_name?: string;
  style: ContentStyle;
  created_at: string;
  posted: boolean;
  long_post: LongPost;
  linkedin_post?: LinkedInPost;
  x_thread: XThread;
  ig_caption: IGCaption;
  carousel: Carousel;
  short_script: ShortScript;
  email?: EmailOutput;
  blog?: BlogOutput;
  lead_magnet?: LeadMagnetOutput;
  strategy?: unknown;
  source_brief?: unknown;
  source_intelligence?: SourceIntelligenceSummary;
  approved_brief?: ContentBriefSummary;
  editor_review?: unknown;
  agent_log?: AgentLogEntry[];
  agent_outputs?: AgentArtifact[];
  quality_score?: number;
  critic_score?: number;
  rating?: PackRating;
  performance?: PackPerformance;
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
  clientWorkspace?: ClientWorkspace;
}

export interface GenerationRequest {
  sourceUrl: string;
  theme: string;
  style: ContentStyle;
  inputMode?: GenerationInputMode;
  customPrompt?: string;
  sourceContent?: string;
  voiceTranscript?: string;
  interviewNotes?: string;
  sourceIntelligence?: SourceIntelligenceSummary;
  approvedBrief?: ContentBriefSummary;
  clientWorkspace?: ClientWorkspace;
}

export interface GenerationProgress {
  stage: 'idle' | 'strategizing' | 'finding' | 'filtering' | 'writing' | 'quality_gate' | 'repurposing' | 'editing' | 'complete' | 'error';
  message: string;
  pack?: ContentPack;
}

export const formatLabels: Record<OutputFormat, string> = {
  long_post: 'Long Post',
  linkedin_post: 'LinkedIn',
  x_thread: 'X Thread',
  ig_caption: 'IG Caption',
  carousel: 'Carousel',
  short_script: 'Short Script',
  email: 'Email',
  blog: 'Blog',
  lead_magnet: 'Lead Magnet',
};

export const formatDescriptions: Record<OutputFormat, string> = {
  long_post: 'LinkedIn-style long-form post (500-1,500 words)',
  linkedin_post: 'Native LinkedIn post with hook, body, and CTA',
  x_thread: '8-12 tweet thread with hook',
  ig_caption: 'Hook + body + CTA for Instagram',
  carousel: '8-12 slide outline with titles and bullets',
  short_script: '45-60 second video script with beats',
  email: 'Subject, preview, body, and CTA',
  blog: 'SEO-ready blog draft',
  lead_magnet: 'Downloadable asset outline and CTA',
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
