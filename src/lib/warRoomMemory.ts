type MemoryEventType = 'brief_approved' | 'pack_opened' | 'pack_copied' | 'format_copied' | 'pack_deleted' | 'posted_toggled' | 'output_edited' | 'pack_rated' | 'performance_saved' | 'agent_studio_run' | 'agent_studio_training_saved';

export interface MemoryEvent {
  id: string;
  type: MemoryEventType;
  packId?: string;
  label?: string;
  detail?: string;
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

const EVENTS_KEY = 'war-room-memory-events';
const RULES_KEY = 'war-room-learned-rules';

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

export function recordMemoryEvent(type: MemoryEventType, event: Omit<MemoryEvent, 'id' | 'type' | 'createdAt'> = {}) {
  const rows = readArray<MemoryEvent>(EVENTS_KEY);
  rows.unshift({ id: `event-${Date.now().toString(36)}`, type, createdAt: new Date().toISOString(), ...event });
  writeArray(EVENTS_KEY, rows.slice(0, 500));
}

export function recordLearnedRule(rule: string, source: string) {
  const rows = readArray<LearnedRule>(RULES_KEY);
  const existing = rows.find((item) => item.rule === rule);
  if (existing) {
    existing.count += 1;
    existing.updatedAt = new Date().toISOString();
  } else {
    rows.unshift({ id: `rule-${Date.now().toString(36)}`, rule, source, count: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  writeArray(RULES_KEY, rows.slice(0, 200));
}

export function buildWarRoomMemoryContext(): string {
  const events = readArray<MemoryEvent>(EVENTS_KEY).slice(0, 20);
  const rules = readArray<LearnedRule>(RULES_KEY).slice(0, 12);
  const lines: string[] = [];

  if (rules.length) {
    lines.push('WAR ROOM LEARNED RULES:');
    rules.forEach((rule) => lines.push(`- ${rule.count >= 3 ? 'Permanent rule: ' : ''}${rule.rule} Source: ${rule.source}. Count: ${rule.count}.`));
  }

  if (events.length) {
    lines.push('RECENT USER BEHAVIOR:');
    events.forEach((event) => lines.push(`- ${event.type}${event.label ? `, ${event.label}` : ''}${event.detail ? `: ${event.detail}` : ''}.`));
  }

  return lines.join('\n');
}
