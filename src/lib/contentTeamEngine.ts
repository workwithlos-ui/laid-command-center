export type ContentStyle = 'ai_news' | 'workflow' | 'system';
export type SourceMode = 'ai_news' | 'github_trending' | 'both';
export type GenerationMode = 'generate' | 'repurpose';
export type PackRating = 'up' | 'neutral' | 'down' | null;

export interface ContentEngineSettings {
  openaiApiKey: string;
  audience: string;
  defaultStyle: ContentStyle;
  voiceTraining: string;
  brandName: string;
  handle: string;
  cta: string;
}

export interface AgentMemoryCorrection {
  date: string;
  agent: string;
  issue: string;
  score: number;
}

export interface AgentMemoryPattern {
  hookType: string;
  score: number;
  topic: string;
}

export interface AgentMemory {
  corrections: AgentMemoryCorrection[];
  bestPatterns: AgentMemoryPattern[];
}

export interface AgentLogEntry {
  agent: string;
  status: 'complete' | 'warning' | 'failed';
  summary: string;
  score?: number;
  timestamp: string;
}

export interface GeneratedContentPack {
  id: string;
  title: string;
  topic: string;
  style: ContentStyle;
  sourceMode: SourceMode;
  sourceUrl: string;
  sourceDate: string;
  summary: string;
  desireMapping: string;
  hookType: string;
  criticScore: number;
  date: string;
  rating: PackRating;
  content: {
    youtubeScript: string;
    linkedin: string;
    shortClips: string;
    xThread: string;
    instagramCaption: string;
    carousel: string;
    email: string;
    blog: string;
  };
  agentLog: AgentLogEntry[];
}

export interface GenerateRequest {
  theme: string;
  style: ContentStyle;
  sourceMode: SourceMode;
  settings: ContentEngineSettings;
  memory?: AgentMemory;
  previousPacks?: GeneratedContentPack[];
}

export interface RepurposeRequest {
  sourceContent: string;
  formats: Array<keyof GeneratedContentPack['content']>;
  settings: ContentEngineSettings;
  memory?: AgentMemory;
  previousPacks?: GeneratedContentPack[];
}

const today = () => new Date().toISOString().slice(0, 10);

const losVoiceRules = `
LOS_VOICE.md RULES EMBEDDED:
- Banned words: delve, leverage, seamless, robust, revolutionary, cutting-edge, game-changer, synergy, holistic, unlock, transformative, innovative, disrupt, elevate, empower, optimize, streamline, maximize, utilize, landscape, ecosystem, paradigm, journey, tapestry, realm, dynamic, comprehensive, ultimate, essential, powerful, advanced, state-of-the-art, next-generation, world-class, supercharge, harness, pivotal, crucial, vital, foster, seamlessly, effortlessly, reimagine, redefine, unprecedented, ever-evolving, fast-paced, digital age, in today, dive in.
- No em dashes ever. Use commas, periods, or colons.
- Short sentences. Aim for 5-12 words in social hooks and under 20 words elsewhere.
- Front-load the reveal. Do not warm up.
- Specificity beats abstraction. Name tools, dollar amounts, timeframes, industries, and mechanisms.
- Operator framing. Write for $500K-$10M founders and operators who care about revenue, margin, appointments, and speed.
- Voice benchmarks: Dan Koe and Tim Ferriss. Direct, operator-to-operator, zero filler.
- Name names. Show the mechanism. End on action.
- Self-check: zero em dashes, zero banned words, first line stops scroll, at least one specific number/tool/dollar amount, last line gives a clear next move.
`;

const kallawayFramework = `
KALLAWAY HOOK FRAMEWORK EMBEDDED:
- Four Horsemen desire mapping: Money, Time, Health, Status. Identify the primary desire and a proxy desire one standard deviation away from the obvious desire.
- Five hook variations: About Me, If I, To You, Can You, He/She Just Did.
- Nine hook formats: Secret Reveal, Case Study, Comparison, Question, Education, List, Contrarian, Personal Experience, Problem.
- Six Power Words check: Subject, Action, Objective, Contrast, Proof, Time.
- Three Hook Alignment: Visual hook, spoken hook, and text hook must all make the same promise.
- Four Commandments: Alignment, Speed, Clarity, Curiosity.
- Hook structure: context lean-in, interjection, snapback.
- Content Strategy Assistant principles: contrast-as-curiosity engine, viewer-centric framing, multi-modal alignment, niche precision.
- 20 Social Hook Templates: Pattern Recognition, Authority+Contrast, Time Compression, Myth Buster, Specific Number+Result, Unexpected Tool, Mistake to Mastery, Hidden Cost, Refuse/Stop, Accidental Discovery, Comparison Verdict, Evolution/Shift, Everyone Skips, Real Want vs Stated Want, Common Denominator Negative, Steal This, Free Replaces Paid, Almost Quit, One Question/Filter, Simplicity Wins.
`;

const hormoziTweetMethod = `
HORMOZI TWEET METHOD EMBEDDED:
- Default X posts under 140 characters when possible.
- No hashtags. No emojis. Declarative, not hedged. Concrete over abstract.
- Seven formats: If-You Conditional Reframe, Stacked Contrast, How-to-Stay-Poor, Difference-Between, Most-People Inversion, Single-Line Maxim, Friendly Reminder.
`;

const researchIntelligence = `
CONTENT MARKET INTELLIGENCE PROTOCOL EMBEDDED:
- Topic decomposition: identify the core topic, sub-angles, and adjacent topics.
- Demand signal mapping: audience pain, buying intent, search/social momentum, creator saturation, and sales relevance.
- Trend velocity scoring: prioritize by velocity. A tool launched 2 days ago gaining rapid attention is better content than a major release from 12 days ago already covered everywhere. Score freshness and acceleration, not just recency.
- Audience language extraction: capture the exact phrases operators use when describing the pain.
- Sources must include AI news and GitHub Trending when relevant.
- Only accept updates with real URLs, publish dates, and summaries. If a URL cannot be verified, label it unverified and do not use it as a factual claim.
`;

const criticFramework = `
ELIOS CRITIC SYSTEM EMBEDDED:
Layer 1 regex check: reject em dashes, all LOS banned words, dead openers like Hey guys, Welcome back, In today's world, Let's dive in, and AI-slop transitions like With that said, Moving on, That being said.
Layer 2 LLM rubric: score 1-5 on scroll-stop power, mechanism clarity, specificity, voice authenticity, action delivery, platform fit, angle commitment, and honest limitations. Total score is /40. Below 28/40 requires rework. Below 24/40 requires full rewrite.
Hard fail means rerun the failing agent with corrective notes.
`;

const architectureOverview = `
CONTENT TEAM ARCHITECTURE EMBEDDED:
Purpose: build a hands-off AI-powered content engine that drives qualified consulting leads worth $10K-$50K for AI Simple.
Primary channel: YouTube @loshustle as the engine, repurposed across platforms.
ICP: Business owners doing $500K-$10M in home services, DTC, agencies, and local services.
Core principle: every piece must generate a qualified lead or move an existing lead closer to a consulting engagement. No vanity metrics. No content for content's sake.
Repurposing pipeline: one 10-15 minute YouTube video becomes short clips, LinkedIn, X thread, Instagram caption, carousel, email, blog, visual assets, and lead magnet ideas.
Voice identity: Direct. Experienced. Slightly provocative. Built things, broken things, no time for theory. Speaks to business owners like a peer in the trenches.
Six gates: Tactical, Specific, Honest, Structured, Voice-Aligned, Fact-Checked.
`;

export const AGENT_SYSTEM_PROMPTS = {
  strategist: `${architectureOverview}\n${researchIntelligence}\nROLE: You are the Content Strategist for AI Simple, a consulting firm that helps $500K-$10M businesses implement AI to increase revenue and reduce costs.\n\nTASK: Pick the strongest topic and map it to revenue. Output content pillar alignment, YouTube title under 70 characters, content angle, business objective, ICP pain, target keyword, derivative map, lead magnet tie-in, success metric, and distribution priority.\n\nDECISION FRAMEWORK: Awareness uses shocking result or case study. Trust uses behind-the-scenes process. Lead Gen uses how-to tutorial with a free tool or template. Convert uses ROI calculator or comparison with diagnostic call.\n\nCONSTRAINTS: Every piece ties to a specific service or lead magnet. One idea must be case-study or results focused. One idea must be tactical. No generic AI news without a business mechanism.\n${kallawayFramework}\n${losVoiceRules}`,
  research: `${architectureOverview}\n${researchIntelligence}\nROLE: You are the Research Analyst for AI Simple. Your job is to build an airtight Source Brief before any writing happens. You are paranoid about accuracy.\n\nOUTPUT FORMAT, SOURCE BRIEF:\n1. CORE CLAIM AND VERIFICATION: main argument and evidence strength.\n2. PRIMARY DATA POINTS: minimum 5 claims with source URL, report name, exact number, verification status, and how it will be used.\n3. CASE STUDY MATERIAL: client, industry, before state, after state, timeframe, quote, visuals available.\n4. INDUSTRY BENCHMARKS: average, top performers, where most businesses fall.\n5. COUNTERARGUMENTS AND REBUTTALS: at least 2.\n6. VISUAL ASSETS NEEDED: screenshots, charts, screen recordings, B-roll.\n7. SOURCE INVENTORY: every source with full citation, URL, publish date, and summary.\n\nQUALITY STANDARD: if a claim cannot be verified, cut it or reframe it as opinion with attribution. No exceptions.\n\nTREND VELOCITY: when evaluating AI updates, prioritize by velocity. A tool launched 2 days ago gaining rapid attention beats a major release from 12 days ago already covered everywhere. Score freshness and acceleration, not just recency. Use AI news and GitHub Trending as source categories when relevant.`,
  youtubeScriptwriter: `${architectureOverview}\n${kallawayFramework}\n${losVoiceRules}\nROLE: You are the YouTube Scriptwriter for Los Silva @loshustle. You write scripts that make business owners stop everything and watch, then book a call.\n\nSCRIPT STRUCTURE, FOLLOW EXACTLY:\nOPENING HOOK 0:00-0:45, THE RESULT: never start with In this video or Hey guys. Open with the most shocking result, a number, a transformation, or confession. Establish credibility. Tease the mechanism. End with Let me show you exactly how we did it.\nTHE STAKES 0:45-2:00: what is costing them money now, invisible problem, industry average versus possible result.\nTHE PROOF 2:00-5:00: case study, before and after, screen recording cue, client quote, skeptic response.\nTHE PROCESS 5:00-10:00: step-by-step breakdown, why it matters, how to implement, mistakes, highest-value action.\nTHE STACK 10:00-12:00: exact tools, cost breakdown, AI stack cost versus human equivalent.\nTHE CTA 12:00-END: free tool, template, or discovery call. Exact URL. What happens next.\n\nREQUIRED: 3+ screen cues, 2+ B-roll directions, 5+ specific numbers, 1 direct quote, 1 counterargument, CTA URL.\n\nREPURPOSING BRIEF: generate 3-5 clip timestamps and best quotes for overlays.`,
  linkedinShortFormWriter: `${architectureOverview}\n${kallawayFramework}\n${hormoziTweetMethod}\n${losVoiceRules}\nROLE: You are the LinkedIn and Short-Form Writer for AI Simple. You create the written authority post and the clip architecture.\n\nLINKEDIN POST: 500-800 words. Opening line max 12 words. Use shocking number, contrarian take, direct challenge, or curiosity gap. Setup with invisible problem, one stat, and credibility. Insight with counter-truth. Breakdown with 3-5 tactical points, bold labels, specific numbers and tools. Proof with one mini case. CTA to AISimple.com. No emojis, no hashtags, no engagement bait.\n\nSHORT-FORM CLIPS: 3-5 clips, 30-60 seconds each. Provide timestamp, platform priority, hook type, script text-on-screen frames, voiceover direction, B-roll, caption, text overlay notes. Platform notes for Reels, TikTok, X. Each clip must work standalone and include a quote-tweetable line.\n\nCLIP-WORTHY CRITERIA: self-contained insight, high shock value, emotional peak, quotable statement, contrarian take.`,
  repurposer: `${architectureOverview}\n${kallawayFramework}\n${hormoziTweetMethod}\n${losVoiceRules}\nROLE: You are the Repurposer Agent. You turn the approved YouTube script and source brief into channel-native assets without making them feel recycled.\n\nOUTPUTS REQUIRED:\nX thread: 8-12 tweets, one angle, first tweet uses Hormozi style, no hashtags, no emojis, concrete claims.\nInstagram caption: hook, body, CTA. Short paragraphs. Platform-native.\nCarousel: 8-12 slides, each slide self-contained, one idea per slide, mobile readable.\nEmail: subject line, personal opening, tactical breakdown, CTA, P.S.\nBlog: 1500-2500 word structure with H1 title, bold hook sentence, H2 headers as questions, lists with bold labels, FAQ section, CTA blocks.\nLinkedIn: mirror the core premise, 800-1500 characters if requested as a shorter derivative, first 150 characters stop the scroll, blank line every 1-2 sentences, CTA uses a keyword.\n\nCONTENT CASCADE: preserve the same mechanism, proof, and CTA across formats while changing structure for each platform.`,
  editor: `${architectureOverview}\n${criticFramework}\n${losVoiceRules}\nROLE: You are the Final Quality Gate for AI Simple content. You are ruthless. Your job is to reject content that does not meet our standards, even if it means sending it back 3 times. You protect Los's reputation and audience trust.\n\nREVIEW CHECKLIST, MUST PASS ALL:\n1. Voice consistency: approved opening, no Hey guys, average sentence length under 20 words, active voice, first person, direct address, confident but not arrogant.\n2. Tactical value: reader leaves with one specific action today. Action is detailed enough to execute. Tool names and steps are specific.\n3. Specificity: 3+ numbers, no vague phrases, niche specified, case study has before and after.\n4. Honesty: claims traceable to source brief, counterarguments acknowledged, no absolute promises, limitations included, pricing disclosed.\n5. Structure: scannable headers, clear beginning/middle/end, single CTA, LinkedIn max 2 sentences per paragraph, YouTube follows Result, Proof, Process, CTA.\n6. Anti-AI detection: flag corporate buzzwords, fluff phrases, generic advice, hedged language, shallow listicles, Wikipedia definitions, AI confession.\n7. CTA check: single clear CTA, exact URL, lead magnet value clear, no competing CTAs.\n\nDECISION: PASS, PASS WITH MINOR EDITS, or REJECT. Return score /40 and correction notes by agent.`,
};

const jsonInstruction = `Return ONLY valid JSON. Do not wrap in markdown. Do not include commentary outside JSON.`;

function memoryAddendum(memory?: AgentMemory, previousPacks: GeneratedContentPack[] = []) {
  const corrections = memory?.corrections?.slice(-5) ?? [];
  const lessons = corrections.length
    ? `\nLESSONS FROM PAST GENERATIONS, avoid these issues:\n${corrections.map((c) => `- ${c.date}, ${c.agent}, score ${c.score}: ${c.issue}`).join('\n')}`
    : '';
  const bestByScore = [...(memory?.bestPatterns ?? [])].sort((a, b) => b.score - a.score).slice(0, 5);
  const topPatterns = previousPacks.length >= 10 && bestByScore.length
    ? `\nTOP PATTERNS ADDENDUM: Your highest-scoring hooks used these patterns: ${bestByScore.map((p) => `${p.hookType} on ${p.topic}, ${p.score}/40`).join('; ')}. Lean into these.`
    : '';
  const ratedTop = previousPacks.filter((p) => p.rating === 'up').slice(-5);
  const userRated = ratedTop.length
    ? `\nUSER-RATED TOP PACKS HAD THESE CHARACTERISTICS: ${ratedTop.map((p) => `${p.hookType}, ${p.desireMapping}, ${p.style}, ${p.topic}`).join('; ')}.`
    : '';
  return `${topPatterns}${lessons}${userRated}`;
}

function buildUserContext(settings: ContentEngineSettings) {
  return `\nBRAND SETTINGS:\nBrand: ${settings.brandName || 'AI Simple'}\nHandle: ${settings.handle || '@loshustle'}\nAudience: ${settings.audience || '$500K-$10M founders/operators'}\nDefault CTA: ${settings.cta || 'DM me the keyword and I will send it.'}\nVoice training examples from user:\n${settings.voiceTraining || 'No extra user voice samples provided.'}`;
}

async function callOpenAI<T>(apiKey: string, systemPrompt: string, userPrompt: string): Promise<T> {
  if (!apiKey?.trim()) {
    throw new Error('Add your OpenAI API key in Settings before generating new content.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${userPrompt}\n\n${jsonInstruction}` },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned an empty response.');
  return JSON.parse(content) as T;
}

function log(agent: string, summary: string, score?: number): AgentLogEntry {
  return { agent, status: 'complete', summary, score, timestamp: new Date().toISOString() };
}

export function updateMemoryFromPack(memory: AgentMemory, pack: GeneratedContentPack): AgentMemory {
  const corrections = [...(memory.corrections ?? [])];
  if (pack.criticScore < 34) {
    corrections.push({ date: today(), agent: 'editor', issue: `Quality score ${pack.criticScore}/40 on ${pack.topic}. Review agent log for correction notes.`, score: pack.criticScore });
  }
  const bestPatterns = [...(memory.bestPatterns ?? [])];
  if (pack.criticScore >= 34) {
    bestPatterns.push({ hookType: pack.hookType, score: pack.criticScore, topic: pack.topic });
  }
  return {
    corrections: corrections.slice(-50),
    bestPatterns: bestPatterns.sort((a, b) => b.score - a.score).slice(0, 50),
  };
}

function mockPackBase(title: string, topic: string, style: ContentStyle, sourceMode: SourceMode, sourceUrl: string): GeneratedContentPack {
  const keyword = topic.replace(/[^a-z0-9]+/gi, '_').toUpperCase().slice(0, 28) || 'AI_SYSTEM';
  const summary = `${title} translated into an operator-ready content pack with proof, process, and a clear CTA.`;
  return {
    id: `mock-${Date.now()}`,
    title,
    topic,
    style,
    sourceMode,
    sourceUrl,
    sourceDate: today(),
    summary,
    desireMapping: style === 'workflow' ? 'Time' : style === 'system' ? 'Status' : 'Money',
    hookType: style === 'workflow' ? 'Time Compression' : style === 'system' ? 'Simplicity Wins' : 'Specific Number+Result',
    criticScore: 34,
    date: new Date().toISOString(),
    rating: null,
    content: {
      youtubeScript: `OPENING HOOK\nMost owners do not need more AI tools. They need one repeatable system that saves the team five hours this week.\n\nTHE STAKES\nThe expensive part is not the subscription. It is the random workflow around it. One person tests a tool. Another person keeps using the old process. Nothing compounds.\n\nTHE PROOF\nI would test ${title} on one revenue task first: lead response, proposal drafting, client onboarding, or content production. Track minutes saved, human handoffs removed, and appointments created.\n\nTHE PROCESS\nStep 1: pick one painful workflow.\nStep 2: write the current process in five bullets.\nStep 3: let AI handle the first draft, routing, or research step.\nStep 4: keep a human approval point.\nStep 5: measure the result after seven days.\n\nCTA\nComment ${keyword} and I will send the worksheet I use to score AI workflows before we install them.`,
      linkedin: `Most AI tools fail because the workflow is still broken.\n\nI would not roll out ${title} across the company first.\n\nI would test it on one measurable bottleneck.\n\n**The filter is simple:**\n1. Does it remove a manual handoff?\n2. Does it save at least five hours per week?\n3. Does it create or protect revenue?\n4. Can a non-technical employee run it?\n\nIf the answer is no, it is a distraction.\n\nIf the answer is yes, document the process and install it across the team.\n\nThat is how AI becomes margin.\n\nComment ${keyword} and I will send the workflow scorecard.`,
      shortClips: `Clip 1, 0:00 to 0:35\nHook: Stop buying AI tools before you map the workflow.\nPoint: A tool only matters if it removes a handoff.\nOverlay: Tool does not equal system.\n\nClip 2, 0:35 to 1:10\nHook: This five-question filter saves bad AI projects.\nPoint: Score time saved, revenue impact, owner, risk, and repeatability.\nOverlay: Score before you install.\n\nClip 3, 1:10 to 1:45\nHook: The first AI win should be boring.\nPoint: Lead response, proposals, onboarding, and reporting beat flashy demos.\nOverlay: Boring workflows print money.`,
      xThread: `1/ Most AI rollouts fail for one reason:\n\nThe tool is new.\nThe workflow is old.\n\n2/ Before using ${title}, write the current process in five steps.\n\nIf you cannot explain it, AI cannot fix it.\n\n3/ Then score one bottleneck:\n\nTime saved\nRevenue impact\nRisk\nOwner\nRepeatability\n\n4/ If it saves less than five hours a week, skip it.\n\n5/ If it removes a handoff, test it.\n\n6/ If it touches revenue, measure it daily.\n\n7/ The goal is not using AI.\n\nThe goal is fewer dropped leads, faster proposals, and cleaner operations.\n\n8/ Comment ${keyword} and I will send the scorecard.`,
      instagramCaption: `Most AI tools are distractions.\n\nThe winners are boring workflows.\n\nLead response.\nProposal drafts.\nOnboarding checklists.\nWeekly reports.\n\nThat is where owners get time back.\n\nBefore you install ${title}, ask one question:\n\nDoes this remove a handoff or create revenue?\n\nIf not, skip it.\n\nComment ${keyword} and I will send the workflow scorecard.`,
      carousel: `Slide 1: Stop buying AI tools\nFix the workflow first.\n\nSlide 2: The real problem\nYour process has too many handoffs.\n\nSlide 3: Pick one bottleneck\nLead response, proposals, onboarding, or reporting.\n\nSlide 4: Score the task\nTime saved, revenue impact, risk, owner, repeatability.\n\nSlide 5: Use AI once\nDraft, route, summarize, or research.\n\nSlide 6: Keep approval\nAI drafts. Humans decide.\n\nSlide 7: Measure seven days\nHours saved and revenue protected.\n\nSlide 8: Comment ${keyword}\nI will send the scorecard.`,
      email: `Subject: The AI rollout filter I use\n\nMost owners are asking the wrong question.\n\nThey ask which AI tool to buy.\n\nI ask which workflow is leaking time or revenue.\n\nUse this filter before you test ${title}:\n\n1. What task repeats every week?\n2. Who owns it today?\n3. How many minutes does it take?\n4. What breaks if AI gets it wrong?\n5. What number proves it worked?\n\nIf the workflow cannot pass that test, skip the tool.\n\nIf it passes, run a seven-day pilot.\n\nReply ${keyword} and I will send the worksheet.`,
      blog: `# How to Test ${title} Without Wasting a Month\n\n**The best AI projects start with one painful workflow.**\n\n## What should you test first?\n\nStart with a task that repeats every week and touches revenue or delivery. Lead response, proposal drafting, onboarding, and reporting are usually better than flashy demos.\n\n## How do you score the workflow?\n\nUse five checks.\n\n**Time saved:** Will this save at least five hours a week?\n\n**Revenue impact:** Will it create, protect, or accelerate revenue?\n\n**Risk:** What happens if the AI gets it wrong?\n\n**Owner:** Who approves the output?\n\n**Repeatability:** Can the team run it without you?\n\n## What is the seven-day pilot?\n\nDocument the current process. Add AI to one step. Keep human approval. Measure hours saved and mistakes prevented. Then decide if it earns a permanent place in the business.\n\n## FAQ\n\n**Should I roll this out to everyone?**\nNo. Prove one workflow first.\n\n**What if the tool is impressive?**\nImpressive is not the metric. Margin is.\n\n**What should I do next?**\nComment ${keyword} and I will send the workflow scorecard.`,
    },
    agentLog: [
      log('Simulation Mode', 'No OpenAI key found. Generated a realistic demo pack locally.'),
      log('Content Strategist', `Mapped ${topic} to a measurable operator workflow.`),
      log('Research Agent', 'Used mock source brief with clear verification warning.'),
      log('YouTube Scriptwriter', 'Created long-form script structure.'),
      log('LinkedIn/Short-Form Writer', 'Created LinkedIn post and clip architecture.'),
      log('Repurposer Agent', 'Created X, IG, carousel, email, and blog outputs.'),
      log('Editor/Quality Gate', 'PASS WITH MINOR EDITS: simulation copy meets structure but needs live source verification.', 34),
    ],
  };
}

function mockGenerateContentPack(request: GenerateRequest): GeneratedContentPack {
  return mockPackBase(request.theme || 'AI Workflow Pilot', request.theme || 'AI Workflow Pilot', request.style, request.sourceMode, 'Simulation mode, add OpenAI key for live sources');
}

function mockRepurposeContent(request: RepurposeRequest): GeneratedContentPack {
  const title = 'Repurposed Operator Content';
  const pack = mockPackBase(title, 'User-provided content', request.settings.defaultStyle || 'workflow', 'both', 'User-provided content');
  pack.id = `mock-rep-${Date.now()}`;
  pack.summary = 'Pasted content converted into platform-native assets in simulation mode.';
  pack.agentLog[0] = log('Simulation Mode', 'No OpenAI key found. Repurposed pasted content locally for UI testing.');
  return pack;
}

export async function generateContentPack(request: GenerateRequest): Promise<GeneratedContentPack> {
  if (!request.settings.openaiApiKey?.trim()) {
    return mockGenerateContentPack(request);
  }

  const commonContext = buildUserContext(request.settings);
  const memoryContext = memoryAddendum(request.memory, request.previousPacks);
  const agentLog: AgentLogEntry[] = [];

  const strategist = await callOpenAI<{ title: string; topic: string; pillar: string; angle: string; objective: string; leadMagnet: string; successMetric: string; desireMapping: string; hookType: string }>(
    request.settings.openaiApiKey,
    `${AGENT_SYSTEM_PROMPTS.strategist}${memoryContext}${commonContext}`,
    `Theme: ${request.theme}\nStyle: ${request.style}\nSource mode: ${request.sourceMode}\nChoose one content pack concept and return JSON with title, topic, pillar, angle, objective, leadMagnet, successMetric, desireMapping, hookType.`
  );
  agentLog.push(log('Content Strategist', `Mapped ${strategist.topic} to ${strategist.pillar} and ${strategist.objective}.`));

  const research = await callOpenAI<{ summary: string; sourceUrl: string; sourceDate: string; sourceBrief: string }>(
    request.settings.openaiApiKey,
    `${AGENT_SYSTEM_PROMPTS.research}${commonContext}`,
    `Build a source brief for this strategy. Strategy JSON: ${JSON.stringify(strategist)}. Source mode: ${request.sourceMode}. Return JSON with summary, sourceUrl, sourceDate, sourceBrief.`
  );
  agentLog.push(log('Research Agent', `Built source brief from ${research.sourceUrl || 'source inventory'}.`));

  const script = await callOpenAI<{ youtubeScript: string; repurposingBrief: string }>(
    request.settings.openaiApiKey,
    `${AGENT_SYSTEM_PROMPTS.youtubeScriptwriter}${memoryContext}${commonContext}`,
    `Write the YouTube script and repurposing brief. Strategy: ${JSON.stringify(strategist)}. Source brief: ${research.sourceBrief}. Return JSON with youtubeScript and repurposingBrief.`
  );
  agentLog.push(log('YouTube Scriptwriter', 'Created the long-form script and repurposing brief.'));

  const linkedinShort = await callOpenAI<{ linkedin: string; shortClips: string }>(
    request.settings.openaiApiKey,
    `${AGENT_SYSTEM_PROMPTS.linkedinShortFormWriter}${memoryContext}${commonContext}`,
    `Create LinkedIn and short-form clip assets. Strategy: ${JSON.stringify(strategist)}. Source brief: ${research.sourceBrief}. Script: ${script.youtubeScript}. Repurposing brief: ${script.repurposingBrief}. Return JSON with linkedin and shortClips.`
  );
  agentLog.push(log('LinkedIn/Short-Form Writer', 'Created LinkedIn post and short clip scripts.'));

  const repurposed = await callOpenAI<{ xThread: string; instagramCaption: string; carousel: string; email: string; blog: string }>(
    request.settings.openaiApiKey,
    `${AGENT_SYSTEM_PROMPTS.repurposer}${memoryContext}${commonContext}`,
    `Create the derivative assets. Strategy: ${JSON.stringify(strategist)}. Source brief: ${research.sourceBrief}. Script: ${script.youtubeScript}. LinkedIn: ${linkedinShort.linkedin}. Return JSON with xThread, instagramCaption, carousel, email, blog.`
  );
  agentLog.push(log('Repurposer Agent', 'Created X thread, IG caption, carousel, email, and blog.'));

  const editor = await callOpenAI<{ score: number; decision: string; correctionNotes: string; summary: string }>(
    request.settings.openaiApiKey,
    `${AGENT_SYSTEM_PROMPTS.editor}${commonContext}`,
    `Review this full content pack against the 6 gates. Strategy: ${JSON.stringify(strategist)}. Source brief: ${research.sourceBrief}. Pack: ${JSON.stringify({ script, linkedinShort, repurposed })}. Return JSON with score number from 1 to 40, decision, correctionNotes, summary.`
  );
  agentLog.push(log('Editor/Quality Gate', `${editor.decision}: ${editor.correctionNotes}`, editor.score));

  return {
    id: `gen-${Date.now()}`,
    title: strategist.title,
    topic: strategist.topic,
    style: request.style,
    sourceMode: request.sourceMode,
    sourceUrl: research.sourceUrl,
    sourceDate: research.sourceDate,
    summary: editor.summary || research.summary,
    desireMapping: strategist.desireMapping,
    hookType: strategist.hookType,
    criticScore: editor.score,
    date: new Date().toISOString(),
    rating: null,
    content: {
      youtubeScript: script.youtubeScript,
      linkedin: linkedinShort.linkedin,
      shortClips: linkedinShort.shortClips,
      xThread: repurposed.xThread,
      instagramCaption: repurposed.instagramCaption,
      carousel: repurposed.carousel,
      email: repurposed.email,
      blog: repurposed.blog,
    },
    agentLog,
  };
}

export async function repurposeContent(request: RepurposeRequest): Promise<GeneratedContentPack> {
  if (!request.settings.openaiApiKey?.trim()) {
    return mockRepurposeContent(request);
  }

  const commonContext = buildUserContext(request.settings);
  const memoryContext = memoryAddendum(request.memory, request.previousPacks);
  const agentLog: AgentLogEntry[] = [];

  const writer = await callOpenAI<{ title: string; topic: string; desireMapping: string; hookType: string; linkedin: string; shortClips: string; youtubeScript: string }>(
    request.settings.openaiApiKey,
    `${AGENT_SYSTEM_PROMPTS.linkedinShortFormWriter}${memoryContext}${commonContext}`,
    `Repurpose the user's source content into the core written and short-form assets. Source content: ${request.sourceContent}. Requested formats: ${request.formats.join(', ')}. Return JSON with title, topic, desireMapping, hookType, linkedin, shortClips, youtubeScript.`
  );
  agentLog.push(log('LinkedIn/Short-Form Writer', 'Converted pasted content into core assets.'));

  const repurposed = await callOpenAI<Partial<GeneratedContentPack['content']>>(
    request.settings.openaiApiKey,
    `${AGENT_SYSTEM_PROMPTS.repurposer}${memoryContext}${commonContext}`,
    `Create all requested derivative assets from the source content and core assets. Requested formats: ${request.formats.join(', ')}. Source content: ${request.sourceContent}. Core assets: ${JSON.stringify(writer)}. Return JSON with keys youtubeScript, linkedin, shortClips, xThread, instagramCaption, carousel, email, blog. Fill non-requested keys with an empty string.`
  );
  agentLog.push(log('Repurposer Agent', 'Created requested platform derivatives.'));

  const editor = await callOpenAI<{ score: number; decision: string; correctionNotes: string; summary: string }>(
    request.settings.openaiApiKey,
    `${AGENT_SYSTEM_PROMPTS.editor}${commonContext}`,
    `Review this repurposed pack. Source content: ${request.sourceContent}. Pack: ${JSON.stringify({ writer, repurposed })}. Return JSON with score number from 1 to 40, decision, correctionNotes, summary.`
  );
  agentLog.push(log('Editor/Quality Gate', `${editor.decision}: ${editor.correctionNotes}`, editor.score));

  return {
    id: `rep-${Date.now()}`,
    title: writer.title,
    topic: writer.topic,
    style: request.settings.defaultStyle || 'workflow',
    sourceMode: 'both',
    sourceUrl: 'User-provided content',
    sourceDate: today(),
    summary: editor.summary,
    desireMapping: writer.desireMapping,
    hookType: writer.hookType,
    criticScore: editor.score,
    date: new Date().toISOString(),
    rating: null,
    content: {
      youtubeScript: repurposed.youtubeScript || writer.youtubeScript || '',
      linkedin: repurposed.linkedin || writer.linkedin || '',
      shortClips: repurposed.shortClips || writer.shortClips || '',
      xThread: repurposed.xThread || '',
      instagramCaption: repurposed.instagramCaption || '',
      carousel: repurposed.carousel || '',
      email: repurposed.email || '',
      blog: repurposed.blog || '',
    },
    agentLog,
  };
}
