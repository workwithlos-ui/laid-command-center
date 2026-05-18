
import type { CheckedClaim, ContentBrief, ContentPack, PipelineAgentRun, QualityScores, SourceIntelligence, WarRoomOutput } from '@/data/types';

const KEYS = {
  contentPacks: 'war_room_content_packs',
  sourceBriefs: 'war_room_source_briefs',
  agentRuns: 'war_room_agent_runs',
  editorScores: 'war_room_editor_scores',
  promptVersions: 'war_room_prompt_versions',
  userRatings: 'war_room_user_ratings',
  performanceData: 'war_room_performance_data',
  learnedRules: 'war_room_learned_rules',
  editEvents: 'war_room_edit_events',
} as const;

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows));
}

export interface UserRatingEvent {
  id: string;
  packId: string;
  outputFormat?: string;
  rating: 'up' | 'down';
  reason?: string;
  createdAt: string;
}

export interface LearnedRule {
  id: string;
  rule: string;
  source: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

export function getLearnedRules(): LearnedRule[] {
  return readArray<LearnedRule>(KEYS.learnedRules);
}

export function buildMemoryContext(): string {
  const rules = getLearnedRules().slice(-12);
  const ratings = readArray<UserRatingEvent>(KEYS.userRatings).slice(-12);
  const edits = readArray<{ outputFormat: string; before: string; after: string; createdAt: string }>(KEYS.editEvents).slice(-8);
  const lines: string[] = [];
  if (rules.length) lines.push(`Learned rules: ${rules.map((item) => item.rule).join(' | ')}`);
  if (ratings.length) lines.push(`Recent ratings: ${ratings.map((item) => `${item.rating} on ${item.outputFormat || 'pack'}${item.reason ? ` because ${item.reason}` : ''}`).join(' | ')}`);
  if (edits.length) lines.push(`Recent edit patterns: ${edits.map((item) => `${item.outputFormat} edited from ${item.before.slice(0, 80)} to ${item.after.slice(0, 80)}`).join(' | ')}`);
  return lines.join('\n');
}

export function persistSourceBrief(sourceIntelligence: SourceIntelligence, contentBrief: ContentBrief) {
  const rows = readArray<{ sourceIntelligence: SourceIntelligence; contentBrief: ContentBrief }>(KEYS.sourceBriefs);
  rows.unshift({ sourceIntelligence, contentBrief });
  writeArray(KEYS.sourceBriefs, rows.slice(0, 100));
}

export function persistAgentRuns(packId: string, runs: PipelineAgentRun[]) {
  const rows = readArray<PipelineAgentRun & { packId: string; createdAt: string }>(KEYS.agentRuns);
  rows.unshift(...runs.map((run) => ({ ...run, packId, createdAt: new Date().toISOString() })));
  writeArray(KEYS.agentRuns, rows.slice(0, 500));
}

export function persistEditorScore(packId: string, scores: QualityScores, checkedClaims: CheckedClaim[]) {
  const rows = readArray<{ packId: string; scores: QualityScores; checkedClaims: CheckedClaim[]; createdAt: string }>(KEYS.editorScores);
  rows.unshift({ packId, scores, checkedClaims, createdAt: new Date().toISOString() });
  writeArray(KEYS.editorScores, rows.slice(0, 200));
}

export function persistPromptVersions(versions: Array<{ agent: string; version: string }>) {
  const rows = readArray<{ agent: string; version: string; createdAt: string }>(KEYS.promptVersions);
  rows.unshift(...versions.map((item) => ({ ...item, createdAt: new Date().toISOString() })));
  writeArray(KEYS.promptVersions, rows.slice(0, 300));
}

export function persistContentPack(pack: ContentPack) {
  const rows = readArray<ContentPack>(KEYS.contentPacks);
  rows.unshift(pack);
  writeArray(KEYS.contentPacks, rows.slice(0, 100));
}

export function saveOutputEdit(packId: string, output: WarRoomOutput, before: string, after: string) {
  const rows = readArray<{ packId: string; outputFormat: string; before: string; after: string; createdAt: string }>(KEYS.editEvents);
  rows.unshift({ packId, outputFormat: output.format, before, after, createdAt: new Date().toISOString() });
  writeArray(KEYS.editEvents, rows.slice(0, 200));
  recordLearnedRule(`User edited ${output.label}. Prefer the edited style and wording pattern next time.`, 'inline_edit');
}

export function saveRating(packId: string, rating: 'up' | 'down', outputFormat?: string, reason?: string) {
  const rows = readArray<UserRatingEvent>(KEYS.userRatings);
  rows.unshift({ id: `rating-${Date.now().toString(36)}`, packId, outputFormat, rating, reason, createdAt: new Date().toISOString() });
  writeArray(KEYS.userRatings, rows.slice(0, 300));
  if (rating === 'down') recordLearnedRule(`Avoid the issue that caused a downvote on ${outputFormat || 'the pack'}${reason ? `: ${reason}` : ''}.`, 'user_rating');
}

export function recordLearnedRule(rule: string, source: string) {
  const rows = getLearnedRules();
  const existing = rows.find((item) => item.rule === rule);
  if (existing) {
    existing.count += 1;
    existing.updatedAt = new Date().toISOString();
  } else {
    rows.unshift({ id: `rule-${Date.now().toString(36)}`, rule, source, count: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  const promoted = rows.map((item) => (item.count >= 3 ? { ...item, rule: item.rule.replace(/^Permanent rule: /, 'Permanent rule: ') } : item));
  writeArray(KEYS.learnedRules, promoted.slice(0, 200));
}

export function recordPerformanceData(packId: string, metrics: Record<string, number | string>) {
  const rows = readArray<{ packId: string; metrics: Record<string, number | string>; createdAt: string }>(KEYS.performanceData);
  rows.unshift({ packId, metrics, createdAt: new Date().toISOString() });
  writeArray(KEYS.performanceData, rows.slice(0, 200));
}
