// ═══════════════════════════════════════════════════════════════════════════════
// Mock Content Generation - Fallback when no API key or pipeline fails
// ═══════════════════════════════════════════════════════════════════════════════

import type { ContentPack, ContentStyle, GenerationProgress, GenerationRequest } from '@/data/types';
import { buildAgentArtifacts } from './agentArtifacts';
import { buildDerivedOutputs } from './derivedOutputs';
import { runQualityGate } from './qualityGate';
import { getActiveClientWorkspace } from './clientWorkspace';

const SIMULATE_DELAY = 1200;

function generateId(toolName: string): string {
  const slug = toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const date = new Date().toISOString().slice(0, 10);
  return `${slug}-${date}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockLongPost(toolName: string, style: ContentStyle): string {
  const setups: Record<ContentStyle, string> = {
    ai_news: `**The Update**\n\n${toolName} just launched with features that actually matter for business owners.\n\nNot the buzzword stuff. The real stuff.\n\n**What Changed**\n\n- Faster processing - tasks that took 10 minutes now take 2\n- Better memory - it remembers your business context across sessions\n- Native integrations - connects to your calendar, email, and spreadsheets\n\n**My Honest Take**\n\nI tested it on real work. Not demo tasks.\n\n${toolName} handled 3 days of admin work in 2 hours of review time.\n\nThe catch? You still have to review everything. It's not magic. It's a really good assistant.\n\n**The Bottom Line**\n\nIf you're spending more than 5 hours a week on emails, scheduling, or data entry, this is worth your time.\n\nMost people will read this and do nothing.\n\nDon't be most.\n\nComment the keyword below and I'll send you my full setup guide.`,

    workflow: `**The Workflow**\n\nStep 1: Connect ${toolName} to your email inbox\n- Go to Settings → Integrations\n- Click 'Connect Email'\n- Select read-only access (safer)\n\nStep 2: Set up your business context\n- Upload your pricing sheet\n- Add your service descriptions\n- Set your tone preferences (professional, casual, direct)\n\nStep 3: Create automation rules\n- 'When a client asks for a quote → pull from pricing sheet → draft response'\n- 'When someone asks to book → check calendar → propose 3 slots'\n\nStep 4: Review and send\n- ${toolName} drafts everything\n- You review in a unified inbox\n- One-click approve or edit\n\n**The Numbers**\n\nBefore: 2 hours/day on email\nAfter: 20 minutes/day on review\nTime saved: 1 hour 40 minutes daily = 8+ hours per week\n\n**Pro Tip**\n\nStart with read-only access. Trust the system for 1 week. Then gradually give it more permissions.\n\nComment the keyword below for my exact automation rules.`,

    system: `**The Story**\n\nMy dad called me last week. He was frustrated.\n\nHe spent 2 hours writing one email to a client. 'Why do I have to type the same stuff over and over?' he asked.\n\nI showed him ${toolName}.\n\nHe didn't believe it at first. 'AI can't write like me,' he said.\n\nI made him try it.\n\n**The System**\n\nI built him a simple setup:\n\n1. Tell ${toolName} about your business once (prices, services, how you talk)\n2. It remembers everything forever\n3. Ask it to write any email - it already knows your voice\n4. Review and send\n\n**What Happened**\n\nHe wrote 5 emails in 10 minutes.\n\nHe called me back and said 'This is scary good.'\n\nMy dad went from staying up late writing emails → to finishing work by 5 PM and having dinner with his family.\n\n**The Real Win**\n\nNot the productivity.\n\nThe time with family.\n\nThat's why I care about AI.\n\nComment the keyword below and I'll send you the exact setup I built for my dad.`,
  };
  return setups[style];
}

function mockXThread(toolName: string): { hook: string; tweets: string[] } {
  return {
    hook: `I tested ${toolName} on real work.\n\nNot demo tasks.\n\nActual client emails, quotes, and scheduling.\n\nHere's what happened:\n\n🧵`,
    tweets: [
      `1/ The problem:\nToo much admin work.\nEmails, scheduling, follow-ups.\nTaking time from real work.`,
      `2/ The test:\nConnected ${toolName} to my email and calendar.\nGave it my pricing sheet.\nTold it to handle client follow-ups.`,
      `3/ Hour 1:\nRead 200 unread emails.\nCategorized by urgency.\nTask I had put off for weeks - done.`,
      `4/ Hour 3:\n47 follow-up emails drafted.\n43 ready to send as-is.\nOnly changed 4.`,
      `5/ Hour 48:\n3 days of work in 2 hours of review.\n\nThe catch? Still had to review everything.\nIt flagged uncertain stuff for me.`,
      `6/ The real win:\nThose extra evenings with my family.\n\nThat's why I care about AI.\nNot because it's cool.\nBecause it gives me my time back.`,
      `7/ Want the exact setup?\n\nComment the keyword below.\nFollow + RT for priority access.`,
    ],
  };
}

function mockIGCaption(toolName: string): { hook: string; body: string; cta: string } {
  return {
    hook: `I let AI handle my admin work for 48 hours. Here's what happened 👀`,
    body: `I connected ${toolName} to my email, calendar, and pricing sheet.\n\nThen I told it: handle my client follow-ups.\n\nIn 2 hours of review time, I got 3 days of work done.\n\n47 emails drafted.\nAppointments rescheduled.\nQuotes calculated automatically.\n\nThe catch? I still reviewed everything. It flagged anything uncertain.\n\nThe real win? I got extra evenings with my family.\n\nThat's why I care about AI. Not because it's cool. Because it gives me my time back.\n\nSave this if you want to try it.`,
    cta: `Comment the keyword below for my full setup guide 👇 | Follow @loshustle for daily AI tips`,
  };
}

function mockCarousel(toolName: string): { slides: Array<{ title: string; bullets: string[] }> } {
  return {
    slides: [
      { title: `I Tested ${toolName} on Real Work`, bullets: ['Not demo tasks. Actual business admin.'] },
      { title: 'The Problem', bullets: ['Too much admin work', 'Emails, scheduling, follow-ups', 'Taking time from real work'] },
      { title: 'The Setup', bullets: [`Connected ${toolName}`, 'Email, calendar, pricing sheet', 'Gave it my business context'] },
      { title: 'The Results', bullets: ['3 days of work in 2 hours', '47 emails drafted', 'Appointments rescheduled', 'Quotes calculated auto'] },
      { title: 'The Catch', bullets: ['Still had to review everything', 'It flagged uncertain items', 'Not magic - just a great assistant'] },
      { title: 'The Real Win', bullets: ['Extra evenings with family', 'Not about productivity', 'About getting time back'] },
      { title: 'Want the Setup?', bullets: ['Comment the keyword below', 'Full guide with prompts', 'Safety settings included'] },
    ],
  };
}

function mockShortScript(toolName: string): { title: string; beats: string[] } {
  return {
    title: `I Tested ${toolName} on Real Business Work`,
    beats: [
      `HOOK (0-3s): I let AI handle my business admin for 2 days. I was ready to prove it was overhyped.`,
      `PROBLEM (3-8s): 200 unread emails. 3 weeks of follow-ups. I was drowning in admin work.`,
      `SETUP (8-15s): Connected ${toolName} to my email, calendar, and pricing sheet. One instruction: handle follow-ups.`,
      `RESULT 1 (15-25s): Hour 3 - 47 emails drafted. 43 ready to send. I only changed 4.`,
      `RESULT 2 (25-35s): Hour 6 - client wanted a quote. AI pulled numbers, calculated, drafted. I hit send.`,
      `RESULT 3 (35-45s): Hour 48 - 3 days of admin done in 2 hours of review.`,
      `CLOSE (45-60s): But the real win? Extra evenings with my family. Comment the keyword for my setup.`,
    ],
  };
}

export async function generateMockPack(
  request: GenerationRequest,
  onProgress: (progress: GenerationProgress) => void
): Promise<ContentPack> {
  const { sourceUrl, theme, style, customPrompt } = request;
  const clientWorkspace = request.clientWorkspace || getActiveClientWorkspace();

  let toolName = 'AI Tool';
  if (customPrompt) {
    toolName = customPrompt.split(/\s+/).slice(0, 3).join(' ');
  } else {
    try {
      const url = new URL(sourceUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      toolName = pathParts[0]?.replace(/-/g, ' ') || 'AI Tool';
    } catch {
      toolName = 'AI Tool';
    }
  }

  onProgress({ stage: 'finding', message: '[SIM] Agent 1: Scanning for AI updates...' });
  await delay(SIMULATE_DELAY);

  onProgress({ stage: 'filtering', message: '[SIM] Agent 2: Scoring relevance for your audience...' });
  await delay(SIMULATE_DELAY);

  onProgress({ stage: 'writing', message: `[SIM] Agent 3: Writing ${style} post...` });
  await delay(SIMULATE_DELAY * 1.5);

  const longPostBody = mockLongPost(toolName, style);
  const xThread = mockXThread(toolName);
  const igCaption = mockIGCaption(toolName);
  const carousel = mockCarousel(toolName);
  const shortScript = mockShortScript(toolName);

  onProgress({ stage: 'repurposing', message: '[SIM] Agent 4: Repurposing into 4 additional formats...' });
  await delay(SIMULATE_DELAY);

  const pack: ContentPack = {
    id: generateId(toolName),
    tool_name: toolName,
    source_url: sourceUrl || 'https://example.com/ai-update',
    summary: customPrompt || `Latest update for ${toolName} featuring improved performance and new business-focused capabilities.`,
    audience: clientWorkspace.audience || 'Founders / operators doing 500k-10M',
    theme,
    client_workspace_id: clientWorkspace.id,
    client_name: clientWorkspace.name,
    style,
    created_at: new Date().toISOString(),
    posted: false,
    long_post: {
      title: longPostBody.split('\n')[0].replace(/\*\*/g, ''),
      body_markdown: longPostBody,
    },
    ...buildDerivedOutputs({
      title: longPostBody.split('\n')[0].replace(/\*\*/g, ''),
      hook: xThread.hook,
      body: longPostBody,
      summary: customPrompt || `Latest update for ${toolName} featuring improved performance and new business-focused capabilities.`,
      cta: igCaption.cta,
    }),
    x_thread: xThread,
    ig_caption: igCaption,
    carousel,
    short_script: shortScript,
    source_intelligence: request.sourceIntelligence,
    approved_brief: request.approvedBrief,
    source_brief: { approved: request.approvedBrief },
  };
  const qualityReport = runQualityGate(pack.long_post.body_markdown);
  pack.quality_score = qualityReport.score;
  pack.critic_score = Math.round(qualityReport.score / 2.5);
  pack.agent_outputs = buildAgentArtifacts(request, pack, qualityReport);

  onProgress({ stage: 'complete', message: '[SIM] Content pack generated!', pack });
  return pack;
}
