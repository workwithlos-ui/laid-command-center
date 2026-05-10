const today = () => new Date().toISOString().slice(0, 10);

export const bannedWords = ['synergy', 'holistic', 'robust', 'cutting-edge'];

export const horsemanDesires = ['Money', 'Time', 'Health', 'Status'];

export function baseVoiceRules() {
  return [
    'Write in a plain operator and dad voice.',
    'Use short sentences.',
    'No corporate jargon.',
    'Make it practical for founders and operators.',
    'Include at least 1 concrete action.',
    'Use specific numbers where useful.',
    'Never use em dash characters. Use periods, commas, or line breaks.',
    'Do not use these words: synergy, holistic, robust, cutting-edge.',
  ].join('\n');
}

export function hookFrameworkRules() {
  return [
    'Use the Kallaway desire-based hook framework.',
    'Map every hook to one Four Horsemen desire: Money, Time, Health, or Status.',
    'Use a proxy desire one standard deviation away from the core desire. Examples: fewer founder fires, cleaner handoffs, faster content cycles, calmer mornings, stronger authority, better taste, less tool waste.',
    'Draft five hook variations mentally, then use the sharpest one.',
    'Use one hook format: confession, contrarian take, painful observation, specific promise, or before and after.',
    'Use one power word when natural: saved, exposed, unlocked, replaced, fastest, expensive.',
    'Pass Three Hook Alignment: right audience, right pain, right outcome.',
    'Pass Four Commandments: Alignment, Speed to Value, Clarity, Curiosity.',
  ].join('\n');
}

export function newsFinderPrompt({ theme, audience }) {
  return `Today is ${today()}.

Find real AI product, model, or platform updates from the last 14 days for this theme: ${theme}.
Audience: ${audience}.

Return JSON only.

Rules:
${baseVoiceRules()}
Use official blogs, release notes, product changelogs, or credible AI news sources.
Do not invent fake products, dates, links, or claims.
Prefer updates with workflow impact for founders doing $500k to $10M.

Return this shape:
{
  "candidates": [
    {
      "tool_name": "string",
      "update_title": "string",
      "source_url": "https://...",
      "source_type": "official_blog | release_notes | news | docs | product_page",
      "publish_date": "YYYY-MM-DD",
      "summary": "string",
      "why_it_matters": "string",
      "founder_use_cases": ["string"],
      "freshness_score": 1,
      "workflow_impact_score": 1,
      "story_potential_score": 1
    }
  ]
}`;
}

export function longPostPrompt({ candidate, theme, style, audience }) {
  return `Write the long post for a LAID AI Content Command Center pack.

Theme: ${theme}
Style: ${style}
Audience: ${audience}
Tool: ${candidate.tool_name}
Update: ${candidate.update_title}
Source: ${candidate.source_url}
Published: ${candidate.publish_date}
Summary: ${candidate.summary}
Why it matters: ${candidate.why_it_matters}
Use cases: ${(candidate.founder_use_cases || []).join('; ')}

Voice rules:
${baseVoiceRules()}

Hook rules:
${hookFrameworkRules()}

Required structure, use these exact section labels in the body:
Intro
What Changed / Problem
Step 1
Step 2
Step 3
Wrap-up

If a fourth step makes the post better, add Step 4 before Wrap-up.
Each step must include a concrete action, a tool, or a prompt someone can copy.
Length: 450 to 900 words.
Make it sound like an operator dad who has built systems, not a tech reporter.
Include source URL and date in the body.
Open with a hook mapped to Money, Time, Health, or Status without naming the framework.

Return JSON only:
{
  "long_post": {
    "title": "string",
    "body_markdown": "string"
  }
}`;
}

export function repurposerPrompt({ candidate, theme, style, audience, longPost }) {
  return `Repurpose this long post into a full content pack.

Theme: ${theme}
Style: ${style}
Audience: ${audience}
Tool: ${candidate.tool_name}
Source: ${candidate.source_url}
Published: ${candidate.publish_date}

Long post title: ${longPost.title}
Long post body:
${longPost.body_markdown}

Voice rules:
${baseVoiceRules()}

Hook framework for the X opener and IG hook:
${hookFrameworkRules()}

Content cascade rules:
IG caption must use hook, fast context, practical body, and a direct CTA.
X thread opener must deliver value in the first line and create curiosity for operators.
Carousel must have 6 to 8 slides. Each slide needs a title, 2 to 4 bullets, one talking point, and one visual aid note inside the bullets.
Short script must be 45 to 60 seconds. Use beats that identify a self-contained insight, high shock value, emotional peak, and one quotable line.
Avoid vague hype. Use specific numbers and business use cases.

Return JSON only:
{
  "x_thread": {
    "hook": "string",
    "tweets": ["6 to 9 short tweets"]
  },
  "ig_caption": {
    "hook": "string",
    "body": "string",
    "cta": "string"
  },
  "carousel": {
    "slides": [
      { "title": "string", "bullets": ["2 to 4 bullets, include talking point and visual aid note"] }
    ]
  },
  "short_script": {
    "title": "string",
    "beats": ["6 to 8 beats for a 45 to 60 second short"]
  }
}`;
}

export function fixLongPostPrompt({ issues, candidate, theme, style, audience, longPost }) {
  return `Fix this long post. Return JSON only.

Issues:
${issues.join('\n')}

Theme: ${theme}
Style: ${style}
Audience: ${audience}
Tool: ${candidate.tool_name}
Source: ${candidate.source_url}
Published: ${candidate.publish_date}

Voice rules:
${baseVoiceRules()}

Hook rules:
${hookFrameworkRules()}

Current title: ${longPost.title}
Current body:
${longPost.body_markdown}

Requirements:
At least 400 words.
Contains at least one digit.
No banned words.
No em dash characters.
Keep it grounded in the real update.
Use section labels: Intro, What Changed / Problem, Step 1, Step 2, Step 3, Wrap-up.
The opening hook must clearly map to Money, Time, Health, or Status.

Return:
{
  "long_post": {
    "title": "string",
    "body_markdown": "string"
  }
}`;
}

export function fixRepurposedPrompt({ issues, candidate, theme, style, audience, longPost, repurposed }) {
  return `Fix the repurposed content. Return JSON only.

Issues:
${issues.join('\n')}

Theme: ${theme}
Style: ${style}
Audience: ${audience}
Tool: ${candidate.tool_name}
Source: ${candidate.source_url}
Published: ${candidate.publish_date}

Voice rules:
${baseVoiceRules()}

Hook rules:
${hookFrameworkRules()}

Long post:
${longPost.body_markdown}

Current repurposed JSON:
${JSON.stringify(repurposed)}

Requirements:
X hook cannot be empty.
X hook must map to Money, Time, Health, or Status.
X hook must pass Alignment, Speed to Value, Clarity, and Curiosity.
IG CTA cannot be empty.
Carousel needs 6 to 8 slides with talking points and visual aid notes.
Script needs 6 to 8 beats with a self-contained insight, high shock value, emotional peak, and quotable line.
No banned words.
No em dash characters.

Return:
{
  "x_thread": { "hook": "string", "tweets": ["string"] },
  "ig_caption": { "hook": "string", "body": "string", "cta": "string" },
  "carousel": { "slides": [{ "title": "string", "bullets": ["string"] }] },
  "short_script": { "title": "string", "beats": ["string"] }
}`;
}
