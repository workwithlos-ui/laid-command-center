
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

export type ContentStyle = 'ai_news' | 'workflow' | 'system';

export type OutputFormat =
  | 'long_post'
  | 'linkedin_post'
  | 'x_thread'
  | 'ig_caption'
  | 'carousel'
  | 'short_script'
  | 'email'
  | 'blog'
  | 'lead_magnet'
  | 'youtube_description'
  | 'conversion_assets';

export type ContentPlatform = 'blog' | 'x' | 'linkedin' | 'instagram' | 'email' | 'youtube_description';
export type PackRating = 'up' | 'neutral' | 'down' | null;
export type PipelineStatus = 'waiting' | 'running' | 'done' | 'error';
export type ClaimStatus = 'verified' | 'weak' | 'unsupported';

export interface AgentLogEntry {
  agent: string;
  summary: string;
  score?: number;
}

export interface TranscriptSegment {
  index: number;
  text: string;
  start?: number;
  duration?: number;
}

export interface VideoTranscriptSource {
  videoId: string;
  url: string;
  title: string;
  source: string;
  language?: string;
  fetchedAt: string;
  durationSeconds?: number;
  transcript: string;
  segments: TranscriptSegment[];
}

export interface SourceClaim {
  id: string;
  claim: string;
  quote?: string;
  source: string;
  sourceReference: string;
  status: ClaimStatus;
  category: 'number' | 'quote' | 'story' | 'claim' | 'date' | 'link';
}

export interface ProofSnippet {
  id: string;
  text: string;
  sourceReference: string;
  strength: ClaimStatus;
}

export interface SourceIntelligence {
  id: string;
  createdAt: string;
  primarySourceLinks: string[];
  publishDates: string[];
  exactClaims: SourceClaim[];
  proofSnippets: ProofSnippet[];
  competitorAngles: string[];
  audiencePainLanguage: string[];
  whatEveryoneIsSaying: string[];
  whatLosShouldSayDifferently: string[];
  keyThemes: string[];
  uniqueInsights: string[];
  riskFlags: string[];
  sourceText: string;
  transcriptSource?: VideoTranscriptSource;
}

export interface ContentBrief {
  id: string;
  angle: string;
  targetAudience: string;
  hookPromise: string;
  whyNow: string;
  proofAvailable: string[];
  contentStructure: string[];
  cta: string;
  riskFlags: string[];
  approvedAt?: string;
  editedAt?: string;
}

export interface PipelineAgentRun {
  key: string;
  name: string;
  status: PipelineStatus;
  produced: string;
  issuesCaught: string[];
  score: number;
  timeSpentMs: number;
  inputSummary?: string;
  outputSummary?: string;
  promptVersion?: string;
}

export interface QualityScores {
  hookStrength: number;
  specificity: number;
  proof: number;
  usefulness: number;
  originality: number;
  voiceMatch: number;
  ctaStrength: number;
  platformFit: number;
  composite: number;
  passed: boolean;
  reasons: string[];
}

export interface WhyThisWorks {
  hookType: string;
  targetDesire: string;
  ctaLogic: string;
  proofUsed: string[];
  audiencePainAddressed: string[];
  platformLogic: string[];
}

export interface CheckedClaim {
  id: string;
  claim: string;
  source: string;
  status: ClaimStatus;
  note: string;
}

export interface WarRoomOutput {
  format: OutputFormat;
  label: string;
  title: string;
  content: string;
  hook?: string;
  cta?: string;
  version: number;
  editedAt?: string;
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

export interface EmailAsset {
  subject: string;
  preview_text: string;
  body: string;
  cta: string;
}

export interface YouTubeDescriptionAsset {
  preview: string;
  description: string;
  keywords: string[];
  timestamps: string[];
  links: string[];
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

export interface ConversionAsset {
  primary_cta: string;
  soft_cta: string;
  dm_reply_templates: Array<{ scenario: string; reply: string; next_step: string }>;
  paid_offer_push: string;
  pure_value_version: string;
  conversion_optimized_version: string;
  trojan_horse_notes: string[];
  risk_checks: string[];
}

export interface SingleAgentMetadata {
  mode: 'all_agents' | 'single_agent';
  platform?: ContentPlatform;
  engagement_prediction?: {
    initial_score: number;
    reason: string;
    rewritten_hook: string;
    final_score: number;
  };
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
  linkedin_post?: LinkedInPost;
  ig_caption: IGCaption;
  email?: EmailAsset;
  youtube_description?: YouTubeDescriptionAsset;
  carousel: Carousel;
  short_script: ShortScript;
  conversion_assets?: ConversionAsset;
  single_agent?: SingleAgentMetadata;
  strategy?: unknown;
  source_brief?: unknown;
  editor_review?: unknown;
  transcript_source?: VideoTranscriptSource;
  agent_log?: AgentLogEntry[];
  quality_score?: number;
  critic_score?: number;
  rating?: PackRating;
  source_intelligence?: SourceIntelligence;
  content_brief?: ContentBrief;
  pipeline_agents?: PipelineAgentRun[];
  quality_scores?: QualityScores;
  why_this_works?: WhyThisWorks;
  checked_claims?: CheckedClaim[];
  prompt_version?: string;
  model?: string;
  editor_notes?: string[];
  war_room_outputs?: WarRoomOutput[];
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
  pastedContent?: string;
  mode?: 'all_agents' | 'single_agent';
  platform?: ContentPlatform;
  offerContext?: string;
}

export interface GenerationProgress {
  stage:
    | 'idle'
    | 'source_intelligence'
    | 'brief'
    | 'research'
    | 'organize'
    | 'optimize'
    | 'write'
    | 'source_check'
    | 'edit'
    | 'tonality_check'
    | 'engagement_check'
    | 'complete'
    | 'error'
    | 'strategizing'
    | 'finding'
    | 'filtering'
    | 'writing'
    | 'quality_gate'
    | 'repurposing'
    | 'conversion'
    | 'editing';
  message: string;
  pack?: ContentPack;
  agents?: PipelineAgentRun[];
  sourceIntelligence?: SourceIntelligence;
  contentBrief?: ContentBrief;
}

export interface SourcePreparation {
  sourceIntelligence: SourceIntelligence;
  contentBrief: ContentBrief;
  agents: PipelineAgentRun[];
}

export const formatLabels: Record<OutputFormat, string> = {
  long_post: 'Long Post',
  linkedin_post: 'LinkedIn',
  x_thread: 'X Thread',
  ig_caption: 'IG Caption',
  carousel: 'Carousel',
  short_script: 'Short Video Script',
  email: 'Email',
  blog: 'Blog',
  lead_magnet: 'Lead Magnet',
  youtube_description: 'YouTube Description',
  conversion_assets: 'Conversion Assets',
};

export const formatDescriptions: Record<OutputFormat, string> = {
  long_post: 'Flagship long-form operator post with proof and tactical depth',
  linkedin_post: 'Story-driven LinkedIn post with a strong CTA',
  x_thread: 'Seven or more tweets with a proof-led hook',
  ig_caption: 'Hook, body, and CTA for Instagram',
  carousel: 'Slide outline built for saves and shares',
  short_script: 'Short video script with a fast hook and clear beats',
  email: 'Subject, preview text, body, and CTA',
  blog: 'Search-aware blog article with proof and structure',
  lead_magnet: 'Downloadable or DM-worthy asset concept and outline',
  youtube_description: 'SEO description with preview lines, timestamps, and links',
  conversion_assets: 'CTAs, DM replies, offer push, and conversion variants',
};

export const styleLabels: Record<ContentStyle, string> = {
  ai_news: 'AI News',
  workflow: 'Workflow / SOP',
  system: 'Story + System',
};

export const styleDescriptions: Record<ContentStyle, string> = {
  ai_news: 'Update to what changed to use case to how to try it',
  workflow: 'Tactical SOP with numbered steps and screenshots',
  system: 'Story + framework + implementation',
};
