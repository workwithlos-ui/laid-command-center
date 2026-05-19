import { useEffect, useMemo, useState } from 'react';
import { Building2, Eye, EyeOff, KeyRound, Loader2, Plus, Settings as SettingsIcon, ShieldCheck, Trash2, Users } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ClientWorkspace } from '@/data/types';
import { createClientWorkspaceSeed, deleteClientWorkspace, readClientWorkspaces, saveClientWorkspaces, setActiveClientWorkspace, upsertClientWorkspace } from '@/lib/clientWorkspace';
import { clearOpenAIKeyVerification, OPENAI_KEY_VERIFICATION_EVENT, readOpenAIKeyVerification, verifyOpenAIKey, type OpenAIKeyVerificationResult } from '@/lib/openaiKeyVerification';

const OPENAI_KEY = 'openai_api_key';
const AUDIENCE_KEY = 'content_command_audience';
const STYLE_KEY = 'content_command_default_style';

function syncLegacySettings(apiKey: string, audience: string, defaultStyle: string, workspace: ClientWorkspace) {
  const existingLaidSettings = JSON.parse(localStorage.getItem('laid-settings') || '{}');
  localStorage.setItem(
    'laid-settings',
    JSON.stringify({
      ...existingLaidSettings,
      openaiApiKey: apiKey,
      audience,
      defaultStyle,
      clientWorkspace: workspace,
      voiceTraining: workspace.voiceRules,
    })
  );

  const existingKimiSettings = JSON.parse(localStorage.getItem('ai-content-settings') || '{}');
  localStorage.setItem(
    'ai-content-settings',
    JSON.stringify({
      ...existingKimiSettings,
      audience,
      defaultStyle,
      clientWorkspace: workspace,
      voiceTraining: workspace.voiceRules,
      apiKeys: {
        ...(existingKimiSettings.apiKeys || {}),
        openai: apiKey,
      },
    })
  );
}

export function Settings() {
  const initialWorkspaces = useMemo(() => readClientWorkspaces(), []);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(OPENAI_KEY) || '');
  const [showKey, setShowKey] = useState(false);
  const [audience, setAudience] = useState(() => localStorage.getItem(AUDIENCE_KEY) || initialWorkspaces[0]?.audience || '500k-10M founders/operators');
  const [defaultStyle, setDefaultStyle] = useState(() => localStorage.getItem(STYLE_KEY) || 'ai_news');
  const [workspaces, setWorkspaces] = useState<ClientWorkspace[]>(initialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => localStorage.getItem('content-command-active-client-workspace') || initialWorkspaces[0]?.id || 'los-internal');
  const [keyVerification, setKeyVerification] = useState<OpenAIKeyVerificationResult>(() => readOpenAIKeyVerification());
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);

  useEffect(() => {
    const refreshKeyVerification = () => setKeyVerification(readOpenAIKeyVerification());
    window.addEventListener(OPENAI_KEY_VERIFICATION_EVENT, refreshKeyVerification);
    return () => window.removeEventListener(OPENAI_KEY_VERIFICATION_EVENT, refreshKeyVerification);
  }, []);

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) || workspaces[0];

  const updateActiveWorkspace = (updates: Partial<ClientWorkspace>) => {
    if (!activeWorkspace) return;
    const updated = { ...activeWorkspace, ...updates, updatedAt: new Date().toISOString() };
    const next = workspaces.map((workspace) => (workspace.id === updated.id ? updated : workspace));
    setWorkspaces(next);
    saveClientWorkspaces(next);
    if (updates.audience) setAudience(String(updates.audience));
  };

  const handleActiveWorkspaceChange = (id: string) => {
    const workspace = workspaces.find((item) => item.id === id);
    setActiveWorkspaceId(id);
    setActiveClientWorkspace(id);
    if (workspace?.audience) setAudience(workspace.audience);
  };

  const handleAddWorkspace = () => {
    const workspace = createClientWorkspaceSeed(`Client ${workspaces.length + 1}`);
    const next = [workspace, ...workspaces];
    setWorkspaces(next);
    upsertClientWorkspace(workspace);
    setActiveWorkspaceId(workspace.id);
    setActiveClientWorkspace(workspace.id);
    setAudience(workspace.audience || '500k-10M founders/operators');
    toast.success('Client workspace created.');
  };

  const handleDeleteWorkspace = () => {
    if (!activeWorkspace || workspaces.length <= 1) {
      toast.error('Keep at least one workspace.');
      return;
    }
    deleteClientWorkspace(activeWorkspace.id);
    const next = workspaces.filter((workspace) => workspace.id !== activeWorkspace.id);
    setWorkspaces(next);
    setActiveWorkspaceId(next[0].id);
    setActiveClientWorkspace(next[0].id);
    toast.success('Workspace deleted.');
  };

  const handleSave = async () => {
    if (!activeWorkspace) return;
    const trimmedKey = apiKey.trim();
    const workspace = { ...activeWorkspace, audience: audience.trim() || activeWorkspace.audience || '500k-10M founders/operators', updatedAt: new Date().toISOString() };
    const next = workspaces.map((item) => (item.id === workspace.id ? workspace : item));
    setWorkspaces(next);
    saveClientWorkspaces(next);
    localStorage.setItem(OPENAI_KEY, trimmedKey);
    localStorage.setItem(AUDIENCE_KEY, workspace.audience);
    localStorage.setItem(STYLE_KEY, defaultStyle);
    syncLegacySettings(trimmedKey, workspace.audience, defaultStyle, workspace);
    window.dispatchEvent(new Event('content-command-settings-updated'));
    if (trimmedKey) {
      setIsVerifyingKey(true);
      const result = await verifyOpenAIKey(trimmedKey);
      setKeyVerification(result);
      setIsVerifyingKey(false);
      if (result.status === 'ok') {
        toast.success('Settings saved. OpenAI key verified.');
      } else {
        toast.error('Settings saved, but OpenAI rejected the key.');
      }
      return;
    }
    clearOpenAIKeyVerification();
    setKeyVerification(readOpenAIKeyVerification(''));
    toast.success('Settings saved. Workspace context is ready.');
  };

  const badgeClasses = {
    unknown: 'border-white/10 bg-white/[0.045] text-[#A1A1AA]',
    ok: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    invalid: 'border-rose-400/25 bg-rose-400/10 text-rose-300',
  }[isVerifyingKey ? 'unknown' : keyVerification.status];

  const badgeLabel = isVerifyingKey ? 'Testing OpenAI key' : keyVerification.message;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Toaster richColors position="top-right" theme="dark" />

      <section className="rounded-[28px] border border-white/[0.08] bg-[#101014]/86 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#22D3EE]">Settings</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#F8FAFC] md:text-5xl">Client command setup</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#A1A1AA]">
              Configure the API key, active client, offer, voice, proof assets, and default CTA. Every generation uses this workspace context.
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium ${badgeClasses}`}>
            {isVerifyingKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {badgeLabel}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-white/[0.08] bg-[#101014] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.36)] md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-[#A855F7]/35 bg-[#A855F7]/15 text-[#F8FAFC] shadow-[0_0_34px_rgba(168,85,247,0.18)]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#F8FAFC]">OpenAI API Key</h3>
              <p className="text-sm text-[#A1A1AA]">Required for the live agent pipeline.</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">OpenAI API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(event) => {
                    setApiKey(event.target.value);
                    setKeyVerification(readOpenAIKeyVerification(event.target.value));
                  }}
                  placeholder="sk-..."
                  className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.045] pr-12 text-[#F8FAFC] placeholder:text-[#71717A] focus-visible:ring-[#A855F7]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#A1A1AA] transition hover:bg-white/[0.06] hover:text-[#F8FAFC]"
                  aria-label={showKey ? 'Hide OpenAI API key' : 'Show OpenAI API key'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">Default Style</label>
              <Select value={defaultStyle} onValueChange={setDefaultStyle}>
                <SelectTrigger className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.045] text-[#F8FAFC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-[#171720] text-[#F8FAFC]">
                  <SelectItem value="ai_news">AI News</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => void handleSave()} disabled={isVerifyingKey} className="h-12 rounded-2xl bg-gradient-to-r from-[#A855F7] to-[#22D3EE] px-6 text-sm font-semibold text-white shadow-[0_0_34px_rgba(168,85,247,0.28)] hover:opacity-95 disabled:opacity-55">
              {isVerifyingKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SettingsIcon className="mr-2 h-4 w-4" />}
              {isVerifyingKey ? 'Testing Key' : 'Save Settings'}
            </Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-[#101014] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.36)] md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-[#22D3EE]/30 bg-[#22D3EE]/12 text-[#67E8F9]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#F8FAFC]">Client Workspace</h3>
                <p className="text-sm text-[#A1A1AA]">One sellable system per company.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAddWorkspace} className="h-10 rounded-xl border-white/10 bg-white/[0.045] px-3 text-xs text-[#F8FAFC] hover:bg-white/[0.075]">
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
              <Button variant="ghost" onClick={handleDeleteWorkspace} className="h-10 rounded-xl px-3 text-xs text-rose-300 hover:bg-rose-500/10 hover:text-rose-200">
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          {activeWorkspace && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">Active Client</label>
                <Select value={activeWorkspace.id} onValueChange={handleActiveWorkspaceChange}>
                  <SelectTrigger className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.045] text-[#F8FAFC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/[0.08] bg-[#171720] text-[#F8FAFC]">
                    {workspaces.map((workspace) => <SelectItem key={workspace.id} value={workspace.id}>{workspace.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Client Name" value={activeWorkspace.name} onChange={(value) => updateActiveWorkspace({ name: value })} />
                <Field label="Industry" value={activeWorkspace.industry} onChange={(value) => updateActiveWorkspace({ industry: value })} />
                <Field label="Audience" value={audience} onChange={(value) => { setAudience(value); updateActiveWorkspace({ audience: value }); }} />
                <Field label="Default CTA" value={activeWorkspace.cta} onChange={(value) => updateActiveWorkspace({ cta: value })} />
              </div>

              <LongField label="Offer" value={activeWorkspace.offer} onChange={(value) => updateActiveWorkspace({ offer: value })} rows={3} />
              <LongField label="Voice Rules" value={activeWorkspace.voiceRules} onChange={(value) => updateActiveWorkspace({ voiceRules: value })} rows={4} />
              <LongField label="Proof Assets" value={activeWorkspace.proofAssets} onChange={(value) => updateActiveWorkspace({ proofAssets: value })} rows={4} />
              <LongField label="Banned Phrases" value={activeWorkspace.bannedPhrases} onChange={(value) => updateActiveWorkspace({ bannedPhrases: value })} rows={3} />
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.045] p-5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#22D3EE]" />
          <div>
            <h4 className="text-sm font-semibold text-[#F8FAFC]">Production note</h4>
            <p className="mt-1 text-sm leading-6 text-[#A1A1AA]">
              This is still local browser storage. Good for demos and internal use. For company sales, move workspaces, keys, packs, and memory to authenticated database storage.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MiniStat icon={Users} label="Client slots" value={String(workspaces.length)} />
        <MiniStat icon={Building2} label="Active workspace" value={activeWorkspace?.name || 'None'} />
        <MiniStat icon={ShieldCheck} label="Storage mode" value="Local demo" />
      </section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">{label}</label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.045] text-[#F8FAFC] placeholder:text-[#71717A] focus-visible:ring-[#A855F7]/30" />
    </div>
  );
}

function LongField({ label, value, rows, onChange }: { label: string; value: string; rows: number; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">{label}</label>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="w-full resize-y rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm leading-6 text-[#F8FAFC] outline-none transition placeholder:text-[#71717A] focus:border-[#A855F7]/50 focus:ring-4 focus:ring-[#A855F7]/10" />
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#101014] p-4">
      <Icon className="h-5 w-5 text-[#22D3EE]" />
      <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[#71717A]">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-[#F8FAFC]">{value}</div>
    </div>
  );
}
