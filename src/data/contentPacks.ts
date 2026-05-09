import type { ContentPack } from './types';

export const seedContentPacks: ContentPack[] = [
  {
    id: 'gpt-5-5-2026-04',
    tool_name: 'GPT-5.5',
    source_url: 'https://blog.mean.ceo/new-ai-model-releases-news-may-2026/',
    source_date: '2026-04-24',
    summary:
      'Better at agentic coding, computer use, knowledge work, and research-heavy tasks. API access is listed from Apr 24, 2026.',
    audience: '$500k-$10M founders/operators',
    theme: 'AI updates that actually change workflow',
    style: 'ai_news',
    created_at: '2026-05-09T12:00:00.000Z',
    impact_score: 92,
    adoption_score: 84,
    story_score: 88,
    long_post: {
      title: "How I'd Actually Use GPT-5.5 as a Founder",
      body_markdown:
        "# How I'd Actually Use GPT-5.5 as a Founder\n\nMost AI model news is noise. The useful question is simple. What can this model take off your plate this week?\n\nGPT-5.5 is positioned around stronger agentic coding, computer use, knowledge work, and research-heavy tasks. If that holds up in your stack, this is not just a better chatbot. It becomes a junior operator that can move across messy workflows.\n\n## What changed\n\nThe upgrade matters because founders do not need more prompts. They need more finished loops. A finished loop means the model can research, decide, draft, check, and hand you something usable.\n\n## Three ways I would use it this week\n\n1. Build a research brief before a sales call. Give it the company website, LinkedIn page, recent news, and your offer. Ask for pain points, buying triggers, objections, and a first email.\n\n2. Turn customer feedback into product priorities. Paste support tickets, call notes, and churn reasons. Ask it to cluster themes, score revenue impact, and write the next five experiments.\n\n3. Create internal SOPs from messy Looms. Drop in a transcript. Ask for the exact steps, decision rules, QA checklist, and a training version for a new hire.\n\n## Prompt to steal\n\nYou are my operator. Convert this messy input into a finished workflow. Return the goal, inputs, steps, quality bar, owner, tools, risks, and the exact next action. Keep it simple enough for a new team member to run today.\n\n## The real point\n\nThe winner is not the founder with the newest model. The winner is the founder who turns the newest model into fewer bottlenecks, faster decisions, and cleaner operating rhythm.",
    },
    x_thread: {
      hook: 'Most AI model launches do not matter. GPT-5.5 might, if you use it for finished workflow loops.',
      tweets: [
        'Most AI model launches do not matter. GPT-5.5 might, if you use it for finished workflow loops.',
        'The shift is not better answers. It is better execution across research, writing, coding, and computer use.',
        'Use case 1. Sales research before calls. Feed it the prospect site, LinkedIn, and your offer. Ask for pain, trigger, objection, and first email.',
        'Use case 2. Customer feedback. Paste tickets and notes. Ask it to cluster themes, score revenue impact, and propose five experiments.',
        'Use case 3. SOP creation. Give it a Loom transcript. Ask for steps, QA rules, owner, tools, and training notes.',
        'The prompt. You are my operator. Convert this messy input into a finished workflow with goal, inputs, steps, quality bar, risks, and next action.',
        'The edge goes to founders who turn model upgrades into fewer bottlenecks and cleaner operating rhythm.',
      ],
    },
    ig_caption: {
      hook: 'The AI update only matters if it changes your week.',
      body:
        'GPT-5.5 looks useful for founders because it points at agentic coding, computer use, knowledge work, and research-heavy tasks. Do not treat it like a chatbot upgrade. Treat it like an operator upgrade. Start with one repeatable workflow. Sales research, customer feedback, or SOP creation. Then force the model to return a finished loop, not a pile of ideas.',
      cta: 'Save this and test one workflow before you chase another tool.',
    },
    carousel: {
      slides: [
        { title: 'GPT-5.5 is not the strategy', bullets: ['The workflow is the strategy', 'Use the model to close loops'] },
        { title: 'What changed', bullets: ['Stronger agentic coding', 'Better computer use', 'More useful research output'] },
        { title: 'Use case 1', bullets: ['Sales call prep', 'Pain points, triggers, objections, first email'] },
        { title: 'Use case 2', bullets: ['Customer feedback analysis', 'Themes, revenue impact, next experiments'] },
        { title: 'Use case 3', bullets: ['SOP creation from transcripts', 'Steps, QA checklist, owner, tools'] },
        { title: 'Prompt format', bullets: ['Goal', 'Inputs', 'Steps', 'Quality bar', 'Risks', 'Next action'] },
        { title: 'Founder takeaway', bullets: ['Do not collect prompts', 'Build operating leverage'] },
      ],
    },
    short_script: {
      title: 'GPT-5.5 founder workflow script',
      beats: [
        'Hook: Most AI model launches are noise. This one matters if it closes work loops.',
        'Problem: Founders use new models for random prompts instead of operating leverage.',
        'Step 1: Use it for sales research and call prep.',
        'Step 2: Use it to cluster support tickets and churn reasons.',
        'Step 3: Use it to turn Loom transcripts into SOPs.',
        'Close: The edge is not the model. The edge is the workflow you install around it.',
      ],
    },
  },
];

export const emptyPack: ContentPack = seedContentPacks[0];
