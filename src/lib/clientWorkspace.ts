import type { ClientWorkspace } from '@/data/types';

const WORKSPACES_KEY = 'content-command-client-workspaces';
const ACTIVE_WORKSPACE_KEY = 'content-command-active-client-workspace';

export const defaultClientWorkspace: ClientWorkspace = {
  id: 'los-internal',
  name: 'Los Internal',
  industry: 'AI implementation and content systems',
  offer: 'Done-for-you AI content command center for operators and companies',
  audience: '500k-10M founders/operators',
  voiceRules: 'Direct, tactical, operator-grade. Short sentences. Specific examples. No generic AI hype.',
  proofAssets: 'Founder-led content, AI implementation examples, workflow demos, client-ready content systems.',
  bannedPhrases: 'game changer, revolutionary, unlock your potential, in today\'s fast-paced world, AI-powered magic',
  cta: 'DM me CONTENT OS if you want this system built for your company.',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function canUseStorage() {
  return typeof localStorage !== 'undefined';
}

export function readClientWorkspaces(): ClientWorkspace[] {
  if (!canUseStorage()) return [defaultClientWorkspace];
  try {
    const raw = localStorage.getItem(WORKSPACES_KEY);
    const parsed = raw ? JSON.parse(raw) as ClientWorkspace[] : [];
    const rows = parsed.length ? parsed : [defaultClientWorkspace];
    if (!raw) localStorage.setItem(WORKSPACES_KEY, JSON.stringify(rows));
    if (!localStorage.getItem(ACTIVE_WORKSPACE_KEY)) localStorage.setItem(ACTIVE_WORKSPACE_KEY, rows[0].id);
    return rows;
  } catch {
    return [defaultClientWorkspace];
  }
}

export function saveClientWorkspaces(workspaces: ClientWorkspace[]) {
  if (!canUseStorage()) return;
  const rows = workspaces.length ? workspaces : [defaultClientWorkspace];
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(rows));
  const activeId = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
  if (!activeId || !rows.some((workspace) => workspace.id === activeId)) {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, rows[0].id);
  }
  window.dispatchEvent(new Event('content-command-workspace-updated'));
}

export function getActiveClientWorkspace(): ClientWorkspace {
  const rows = readClientWorkspaces();
  const activeId = canUseStorage() ? localStorage.getItem(ACTIVE_WORKSPACE_KEY) : null;
  return rows.find((workspace) => workspace.id === activeId) || rows[0] || defaultClientWorkspace;
}

export function setActiveClientWorkspace(id: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  window.dispatchEvent(new Event('content-command-workspace-updated'));
}

export function upsertClientWorkspace(workspace: ClientWorkspace) {
  const rows = readClientWorkspaces();
  const next = rows.some((item) => item.id === workspace.id)
    ? rows.map((item) => (item.id === workspace.id ? workspace : item))
    : [workspace, ...rows];
  saveClientWorkspaces(next);
}

export function deleteClientWorkspace(id: string) {
  const rows = readClientWorkspaces().filter((workspace) => workspace.id !== id);
  saveClientWorkspaces(rows);
}

export function createClientWorkspaceSeed(name = 'New Client'): ClientWorkspace {
  const now = new Date().toISOString();
  const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'client'}-${Date.now().toString(36)}`;
  return {
    ...defaultClientWorkspace,
    id,
    name,
    industry: '',
    offer: '',
    audience: '',
    proofAssets: '',
    cta: '',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

export function buildClientWorkspaceContext(workspace = getActiveClientWorkspace()): string {
  return [
    'CLIENT WORKSPACE CONTEXT:',
    `- Client: ${workspace.name}`,
    `- Industry: ${workspace.industry || 'not set'}`,
    `- Offer: ${workspace.offer || 'not set'}`,
    `- Audience: ${workspace.audience || 'not set'}`,
    `- Voice rules: ${workspace.voiceRules || 'not set'}`,
    `- Proof assets: ${workspace.proofAssets || 'not set'}`,
    `- Banned phrases: ${workspace.bannedPhrases || 'not set'}`,
    `- Default CTA: ${workspace.cta || 'not set'}`,
  ].join('\n');
}
