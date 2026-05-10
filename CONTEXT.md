# LAID Content Command Center Context

This document records what has been integrated into the LAID Content Command Center, also called Content OS. It exists so the team can see what frameworks, agents, app modes, and product constraints are inside the tool at any time.

## Frameworks Integrated

| Framework | What Is Embedded | Where It Applies |
|---|---|---|
| **LOS_VOICE.md** | The prompt system includes the banned words list, no em dash rule, short sentence guidance, operator tone, specificity rules, named mechanism rules, and voice benchmarks inspired by Dan Koe and Tim Ferriss. | Writer Agent, Repurposer Agent, Critic Agent, correction prompts |
| **Kallaway Hook Framework** | The prompt system includes Four Horsemen desire mapping, proxy desires, 5 hook variations, 9 hook formats, 6 Power Words, Three Hook Alignment, and the Four Commandments. | Hook Writer Agent, Writer Agent openings, X hooks, IG hooks, LinkedIn hooks, short-form script openings |
| **20 Social Hook Templates** | The prompt system includes Pattern Recognition, Authority plus Contrast, Time Compression, Myth Buster, Specific Number plus Result, Unexpected Tool, Mistake to Mastery, Hidden Cost, Refuse or Stop, Accidental Discovery, Comparison Verdict, Evolution or Shift, Everyone Skips, Real Want vs Stated Want, Common Denominator Negative, Steal This, Free Replaces Paid, Almost Quit, One Question or Filter, and Simplicity Wins. | Hook Writer Agent and all repurposed social formats |
| **Hormozi Tweet Method** | The prompt system includes 7 tweet formats: If-You Conditional Reframe, Stacked Contrast, How-to-Stay-Poor, Difference-Between, Most-People Inversion, Single-Line Maxim, and Friendly Reminder. It also enforces under 140 characters by default, no hashtags, no emojis, declarative tone, and concrete phrasing. | Repurposer Agent, X thread output |
| **Content Cascade Pipeline** | The prompt system includes blog structure, Twitter or X thread structure, LinkedIn post structure, LinkedIn lead magnet guidance for tutorial content, short-form clip guidance, platform notes, and format-specific output rules. | Writer Agent and Repurposer Agent |
| **ELIOS Content OS** | The architecture includes 6 sub-agents: hook-writer, blog-writer, social-writer, shorts-cutter, critic, and orchestrator. The pipeline uses cascade execution, a two-layer quality gate, and an 8-dimension rubric scored out of 40. | Server generation pipeline, quality checks, correction prompts |
| **Content Market Intelligence** | The Research Agent system prompt includes topic decomposition, demand signal mapping, trend velocity scoring, and audience language extraction. | Research Agent, AI news discovery, GitHub Trending discovery |
| **Content Strategy Growth Engine** | The strategy layer includes searchable versus shareable content, topic clustering, pillar strategy, buyer stage mapping, and content scoring using customer impact at 40 percent, content-market fit at 30 percent, search potential at 20 percent, and resources at 10 percent. | Research selection, content angle selection, library scoring context |
| **Grand Slam Offer for CTAs** | CTA guidance uses the value equation: dream outcome multiplied by perceived likelihood of achievement, divided by time delay multiplied by effort and sacrifice. Each CTA should raise value, reduce friction, and make the next action obvious. | Writer Agent endings, LinkedIn CTA, IG CTA, script CTA |
| **Axiom Framework** | The pipeline uses self-correction loops, recursive depth, and meta-cognition for error recovery. The pattern is writer drafts, critic scores, writer revises, critic re-scores. | Orchestrator, Writer Agent correction, Repurposer Agent correction |
| **Short-Form Repurposing Engine** | The prompt system includes clip-worthy criteria: self-contained insight, high shock value, emotional peak, quotable statement, and contrarian take. It also includes platform-specific notes for Reels, Shorts, and TikTok. | Repurposer Agent, short-form script output |
| **GitHub Trending** | GitHub Trending is integrated as a real-time AI repository and tool discovery source alongside AI news, official blogs, changelogs, release notes, docs, and product pages. | Research Agent and news discovery module |
| **Content Strategy Assistant** | The hook and strategy prompts include contrast-as-curiosity, visual-first thinking, niche precision, multi-modal alignment, and hook structure using context lean-in, interjection, and snapback. | Hook Writer Agent, Repurposer Agent, short-form openings |

## Embedded Framework Details

The system prompts include the **LOS voice rules** as direct instructions. They forbid em dash characters, ban generic AI words, require short sentences, front-load the reveal, prefer specificity over abstraction, frame content for operators, name names when true, show the mechanism, and end on action. The Writer Agent also carries blog structure rules: H1 title, bold hook sentence, H2 headers as questions, labeled lists, FAQ section, CTA block, and a 1500-2500 word target for full blog-style output.

The **Kallaway Hook Framework** is embedded in the Hook Writer Agent prompt. It includes desire mapping across Money, Time, Health, and Status. It also includes proxy desires one standard deviation away from the obvious desire, the 5 hook variations, the 9 hook formats, the 6 Power Words check, Three Hook Alignment across Visual, Spoken, and Text, and the Four Commandments of Alignment, Speed, Clarity, and Curiosity.

The **Hormozi Tweet Method** is embedded in the Repurposer Agent prompt. X content defaults to short, declarative tweets under 140 characters, without hashtags or emojis. The supported tweet formats are If-You Conditional Reframe, Stacked Contrast, How-to-Stay-Poor, Difference-Between, Most-People Inversion, Single-Line Maxim, and Friendly Reminder.

The **ELIOS quality gate** is embedded in the Critic Agent prompt and mirrored in server checks. Layer 1 is a regex-style hard fail check for em dashes, banned words, dead openers, AI-slop transitions, empty hooks, empty CTAs, fake URLs, fake dates, and invented claims. Layer 2 is an LLM rubric with 8 dimensions: scroll-stop power, mechanism clarity, specificity, voice authenticity, action delivery, platform fit, angle commitment, and honest limitations. Each dimension is scored from 1 to 5. The total is scored out of 40. Below 28 means rework. Below 24 means full rewrite.

## Agent Architecture

| Agent | Responsibility | Embedded Frameworks |
|---|---|---|
| **Research Agent** | Finds real AI updates from the last 14 days using AI news, official sources, product pages, docs, changelogs, release notes, and GitHub Trending. It uses market intelligence protocol for topic scoring. | Content Market Intelligence, GitHub Trending, Content Strategy Growth Engine |
| **Hook Writer Agent** | Generates hooks using Kallaway desire mapping and social hook templates. It scores against the Four Commandments before output is accepted. | Kallaway Hook Framework, 20 Social Hook Templates, Content Strategy Assistant |
| **Writer Agent** | Writes the main post in LOS voice. It uses the content cascade blog structure and accepts critic feedback through correction prompts. | LOS_VOICE.md, Kallaway Hook Framework, Blog system prompt, Grand Slam Offer CTA guidance |
| **Repurposer Agent** | Creates X thread, IG caption, carousel, short-form script, and LinkedIn post. Each format has its own platform rules and prompt constraints. | Hormozi Tweet Method, Content Cascade Pipeline, Short-Form Repurposing Engine, Kallaway Hook Framework |
| **Critic Agent** | Runs Layer 1 hard checks and Layer 2 rubric scoring. It returns corrective notes for any failing content. | ELIOS Content OS, LOS banned words, dead opener checks, AI-slop transition checks |
| **Orchestrator** | Runs the full pipeline, handles self-correction loops, and performs at least two passes when quality gates fail. | Axiom Framework, recursive quality loop, cascade pipeline |

## Pipeline Behavior

Generate mode starts with Research. The Research Agent finds real updates with valid URLs, dates, and summaries. The Writer Agent turns the chosen update into a long post. The Repurposer Agent cascades that idea into X, IG, carousel, script, and LinkedIn. The Critic Agent checks the work. If it fails, the Orchestrator sends corrective notes back to the failing agent.

Repurpose mode skips Research. The user supplies content directly. The system builds a source object from that content, runs the Writer Agent if needed, then runs the Repurposer Agent and Critic Agent. The same quality expectations apply, but no external update discovery is performed.

## App Modes

| Mode | Purpose | User Flow |
|---|---|---|
| **Generate** | One-click content pack from a real AI update. | User enters a theme, selects a style, presses Generate, sees one progress line, then receives a content pack card. |
| **Repurpose** | Paste any content and get all selected formats. | User pastes content, selects formats, presses Repurpose, sees one progress line, then receives a content pack card. |
| **Library** | Browse all generated packs with scoring data. | User searches, filters by style, sorts by date or score, then opens a full-screen detail view. |

## UI Direction

The product direction is a minimal dark SaaS interface. The background is near-black, with one electric violet or deep blue accent. The app should feel closer to Linear, Raycast, and a ChatGPT empty state than a dashboard.

The interface should have three mode buttons at the top: **Generate**, **Repurpose**, and **Library**. There should be no sidebar, no dashboard widgets, no visible agent grid, no visible quality gates, and no research candidates panel. Agent work should run silently behind the scenes. Progress should appear as one updating text line.

Settings live behind a gear icon. Settings contain only three fields: OpenAI API key, audience, and default style. The API key is stored locally in the browser and sent in the API request body.

## Detail View

The detail view opens full screen when a content pack is clicked. It includes horizontal tabs for Long Post, X Thread, IG Caption, Carousel, Script, and LinkedIn. Each tab has clean readable text and a copy button. The view should prioritize reading and copying content, not editing.

## Data Shape

Content packs use a shared shape across Generate, Repurpose, Library, and storage. The core fields are id, tool_name, source_url, source_date, created_at, summary, audience, theme, style, critic_score, long_post, x_thread, ig_caption, carousel, short_script, and linkedin_post when available.

## Non-Negotiable Product Rules

- All framework content must be embedded in the system prompt strings that are sent to the LLM.
- No framework should be referenced only in comments or documentation.
- No em dash characters should appear in code, comments, prompts, or generated content.
- The app should do one thing well: create usable operator content packs.
- Generate and Repurpose should share the same content quality standards.
- Research must require real URLs, publish dates, and summaries.
- Repurpose must skip Research because the user provides the source content.
