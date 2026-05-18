# AI Content War Room Implementation Notes

## What Manus Sent

The bundle includes three proof artifacts:

- `proofs/AGENT_PROMPTS_PROOF.pdf`
- `proofs/WAR_ROOM_ARCHITECTURE_PROOF.pdf`
- `proofs/WAR_ROOM_SOURCE_PROOF_BUNDLE.zip`

The extracted source bundle is stored in `source-proof-bundle/` for reference.

## What Was Put Into The App

The individual prompt modules from the proof bundle were imported into `src/agents/`:

- `researcher.ts`
- `organizer.ts`
- `optimizer.ts`
- `writer.ts`
- `source-checker.ts`
- `editor.ts`
- `tonality-checker.ts`
- `engagement-checker.ts`
- `market-radar.ts`
- `idea-scorer.ts`
- `conversion.ts`

The existing generation prompts in `src/lib/agents.ts` now load the modular prompt registry from `src/agents`. This keeps the current app stable while giving the pipeline the stronger role definitions, contracts, prompt versions, and quality criteria.

## Not Safe To Drop In Yet

The proof bundle also includes a larger replacement pipeline:

- `src/lib/warRoomPipeline.ts`
- `src/lib/sourceIntelligence.ts`
- `src/lib/warRoomMemory.ts`
- replacement `GenerateView.tsx`
- replacement `contentGeneration.ts`
- expanded `data/types.ts`

Those files should not be copied directly into production yet. They reference contracts and a `youtubeTranscript` module that are not present in the current repo. Treat them as architecture reference for the next rebuild phase.

## Recommended Next Build Phase

1. Add the expanded war room data contracts to `src/data/types.ts`.
2. Add a real source intelligence service that works for pasted content first.
3. Add YouTube transcript support behind a tested adapter.
4. Add brief approval before generation.
5. Replace the current six-agent execution flow with the exact eight-step flow.
6. Add source-check and claim-status UI.
7. Add memory events for edits, ratings, copies, opens, exports, and performance data.
8. Add client/workspace support before selling to companies.

## Current Safety Rule

Keep the app build green at every step. Use the proof bundle as a blueprint, not a blind overwrite.
