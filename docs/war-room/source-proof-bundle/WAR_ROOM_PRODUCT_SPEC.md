# AI Content War Room Product Spec

This document is the active source of truth for the rebuild. The product is not another AI content generator. It is an AI content war room built around taste, proof, memory, and speed.

## Core Rule

No source context means no generation. The system must collect and show source intelligence before any writing begins. The user must approve or edit a one-page content brief before the agent pipeline writes content.

## Required Flow

| Step | Requirement |
|---|---|
| Source intelligence | Extract primary source links, publish dates, exact claims with quotes, proof snippets, competitor or creator angles, audience pain language, what everyone is saying, and what Los should say differently. |
| Brief approval | Show Angle, Target Audience, Hook Promise, Why Now, Proof Available, Content Structure, CTA, and Risk Flags with Approve Brief and Edit Brief controls. |
| Live pipeline | Run research, organize, optimize, write, source check, edit, tonality check, and engagement check in that exact sequence. |
| Quality gates | Score Hook Strength, Specificity, Proof, Usefulness, Originality, Voice Match, CTA Strength, and Platform Fit from 1 to 10, then show pass or fail reasons. |
| Workspace | Use a full-screen workspace with brief, notes, and controls on the left, outputs on the right. |
| Output tabs | Include Long Post, LinkedIn, X Thread, IG Caption, Carousel, Short Video Script, Email, Blog, and Lead Magnet. |
| Rewrite controls | Add tactical depth, voice match, proof, stronger hook, less generic, contrarian angle, shorter, story, SOP, and CTA controls. |
| Memory | Store edits, copied or opened or exported packs, thumbs ratings, rejected drafts, and exact learned rules in localStorage. |
| Versioning | Track prompt version, model, source brief, quality score, and editor notes on every output. |
| Explanation | Show why each output works, including hook type, desire, CTA logic, proof, pain, and platform logic. |
| Source checking | Show each factual claim with source and verified, weak, or unsupported status. Unsupported claims must be visually red. |
| Inputs | Keep Paste Content as default and preserve YouTube URL, Voice Record, and Interview modes. |
| Architecture | Use individual files in src/agents for all named agents. |
| Quality bar | Lint must pass, build must pass, all em dashes must be removed, and /market-radar plus /idea-scoring must route correctly. |

## Agent Files

The required agent files are researcher.ts, organizer.ts, optimizer.ts, writer.ts, source-checker.ts, editor.ts, tonality-checker.ts, engagement-checker.ts, market-radar.ts, idea-scorer.ts, and conversion.ts.

## Proof Required

After the build and deployment, create proof files showing the agent prompts and rebuilt architecture, then deliver them as attachments.
