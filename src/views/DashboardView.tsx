import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Copy, ExternalLink, Settings, X } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { CommandCenterSettings, ContentPack } from '@/data/types';

type Mode = 'generate' | 'repurpose' | 'library';
type RunState = 'idle' | 'running' | 'done' | 'error';
type DetailTab = 'long_post' | 'x_thread' | 'ig_caption' | 'carousel' | 'short_script' | 'linkedin_post';
type FormatKey = DetailTab;

type FormatOption = {
  key: FormatKey;
  label: string;
};

type TabMeta = {
  key: DetailTab;
  label: string;
  instruction: string;
};

const defaultSettings: CommandCenterSettings = {
  openaiApiKey: '',
  perplexityApiKey: '',
  audience: '500k-10M founders/operators',
  defaultStyle: 'ai_news',
};

const styles: Array<{ value: ContentPack['style']; label: string }> = [
  { value: 'ai_news', label: 'AI News' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'system', label: 'System' },
];

const formatOptions: FormatOption[] = [
  { key: 'long_post', label: 'Long Post' },
  { key: 'x_thread', label: 'X Thread' },
  { key: 'ig_caption', label: 'IG Caption' },
  { key: 'carousel', label: 'Carousel' },
  { key: 'short_script', label: 'Script' },
  { key: 'linkedin_post', label: 'LinkedIn' },
];

const tabs: TabMeta[] = [
  { key: 'long_post', label: 'Long Post', instruction: '500-1,500 word post for your blog or newsletter' },
  { key: 'x_thread', label: 'X Thread', instruction: '6-10 tweet thread optimized for engagement' },
  { key: 'ig_caption', label: 'IG Caption', instruction: 'Hook + body + CTA for Instagram' },
  { key: 'carousel', label: 'Carousel', instruction: '6-8 slide outline with titles and bullets' },
  { key: 'short_script', label: 'Script', instruction: '45-60 second short-form video script' },
  { key: 'linkedin_post', label: 'LinkedIn', instruction: 'Professional post with engagement CTA' },
];

const progressSteps = ['Finding AI update...', 'Writing post...', 'Creating formats...', 'Quality check...'];
const repurposeSteps = ['Reading source...', 'Writing post...', 'Creating formats...', 'Quality check...'];

function normalizePack(payload: unknown): ContentPack | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  return (record.contentPack || record) as ContentPack;
}

function formatDate(value?: string) {
  if (!value) return 'Today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function styleLabel(style: ContentPack['style']) {
  return styles.find((item) => item.value === style)?.label || 'AI News';
}

function packSummary(pack: ContentPack) {
  return pack.summary || pack.long_post?.title || pack.x_thread?.hook || 'Content pack ready.';
}

function getTabText(pack: ContentPack, tab: DetailTab) {
  if (tab === 'long_post') return `${pack.long_post.title}\n\n${pack.long_post.body_markdown}`.trim();
  if (tab === 'x_thread') return [pack.x_thread.hook, ...(pack.x_thread.tweets || [])].filter(Boolean).join('\n\n');
  if (tab === 'ig_caption') return [pack.ig_caption.hook, pack.ig_caption.body, pack.ig_caption.cta].filter(Boolean).join('\n\n');
  if (tab === 'carousel') {
    return (pack.carousel.slides || [])
      .map((slide, index) => `${index + 1}. ${slide.title}\n${(slide.bullets || []).map((bullet) => `• ${bullet}`).join('\n')}`)
      .join('\n\n');
  }
  if (tab === 'short_script') return [pack.short_script.title, ...(pack.short_script.beats || [])].filter(Boolean).join('\n\n');
  return [pack.linkedin_post?.hook, pack.linkedin_post?.body, pack.linkedin_post?.cta].filter(Boolean).join('\n\n');
}

function MarkdownText({ value }: { value: string }) {
  const blocks = value.split('\n');
  return (
    <div className="content-text">
      {blocks.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-3" />;
        if (trimmed.startsWith('# ')) return <h1 key={index}>{trimmed.replace(/^#\s+/, '')}</h1>;
        if (trimmed.startsWith('## ')) return <h2 key={index}>{trimmed.replace(/^##\s+/, '')}</h2>;
        if (trimmed.startsWith('### ')) return <h3 key={index}>{trimmed.replace(/^###\s+/, '')}</h3>;
        if (/^[-•]\s+/.test(trimmed)) return <p key={index} className="content-bullet">{trimmed.replace(/^[-•]\s+/, '')}</p>;
        if (/^\d+\.\s+/.test(trimmed)) return <p key={index} className="content-numbered">{trimmed}</p>;
        return <p key={index}>{trimmed.replace(/\*\*/g, '')}</p>;
      })}
    </div>
  );
}

function ContentBlock({ pack, tab }: { pack: ContentPack; tab: DetailTab }) {
  if (tab === 'carousel') {
    return (
      <div className="space-y-4">
        {(pack.carousel.slides || []).map((slide, index) => (
          <section key={`${slide.title}-${index}`} className="surface p-5">
            <p className="text-xs text-muted">Slide {index + 1}</p>
            <h3 className="mt-2 text-lg font-medium text-primary-text">{slide.title}</h3>
            <div className="mt-3 space-y-2 text-sm leading-6 text-secondary-text">
              {(slide.bullets || []).map((bullet) => (
                <p key={bullet}>• {bullet}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (tab === 'short_script') {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-medium text-primary-text">{pack.short_script.title}</h2>
        {(pack.short_script.beats || []).map((beat, index) => (
          <section key={`${beat}-${index}`} className="surface p-5">
            <p className="text-xs text-muted">Beat {index + 1}</p>
            <p className="mt-2 text-base leading-7 text-primary-text">{beat}</p>
          </section>
        ))}
      </div>
    );
  }

  return <MarkdownText value={getTabText(pack, tab)} />;
}

function PackCard({ pack, onOpen }: { pack: ContentPack; onOpen: (pack: ContentPack) => void }) {
  return (
    <button type="button" className="pack-card text-left" onClick={() => onOpen(pack)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-medium text-primary-text">{pack.tool_name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{formatDate(pack.source_date || pack.created_at)}</span>
            <span className="tag">{styleLabel(pack.style)}</span>
            {typeof pack.critic_score === 'number' ? <span className="tag">{pack.critic_score}%</span> : null}
          </div>
        </div>
        <span className="view-link">View Pack →</span>
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-secondary-text">{packSummary(pack)}</p>
    </button>
  );
}

export function DashboardView() {
  const [settings, setSettings] = useLocalStorage<CommandCenterSettings>('laid-command-center-settings', defaultSettings);
  const [localPacks, setLocalPacks] = useLocalStorage<ContentPack[]>('laid-content-packs-cache', []);
  const [mode, setMode] = useState<Mode>('generate');
  const [theme, setTheme] = useState('');
  const [style, setStyle] = useState<ContentPack['style']>(settings.defaultStyle || 'ai_news');
  const [sourceContent, setSourceContent] = useState('');
  const [formats, setFormats] = useState<FormatKey[]>(formatOptions.map((format) => format.key));
  const [packs, setPacks] = useState<ContentPack[]>(localPacks);
  const [selectedPack, setSelectedPack] = useState<ContentPack | null>(null);
  const [selectedTab, setSelectedTab] = useState<DetailTab>('long_post');
  const [runState, setRunState] = useState<RunState>('idle');
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState<'all' | ContentPack['style']>('all');
  const [sort, setSort] = useState<'date' | 'score'>('date');

  useEffect(() => {
    let ignore = false;
    async function loadPacks() {
      try {
        const response = await fetch('/api/contentPacks');
        if (!response.ok) return;
        const data = await response.json();
        if (!ignore && Array.isArray(data)) {
          setPacks(data);
          setLocalPacks(data);
        }
      } catch {
        if (!ignore) setPacks(localPacks);
      }
    }
    loadPacks();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    setLocalPacks(packs);
  }, [packs, setLocalPacks]);

  useEffect(() => {
    if (runState !== 'running') return;
    const steps = mode === 'repurpose' ? repurposeSteps : progressSteps;
    let index = 0;
    setProgressText(steps[0]);
    const interval = window.setInterval(() => {
      index = Math.min(index + 1, steps.length - 1);
      setProgressText(steps[index]);
    }, 2200);
    return () => window.clearInterval(interval);
  }, [runState, mode]);

  const filteredPacks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...packs]
      .filter((pack) => {
        const matchesQuery = !query || [pack.tool_name, pack.summary, pack.theme, pack.long_post?.title].filter(Boolean).join(' ').toLowerCase().includes(query);
        const matchesStyle = styleFilter === 'all' || pack.style === styleFilter;
        return matchesQuery && matchesStyle;
      })
      .sort((a, b) => {
        if (sort === 'score') return (b.critic_score || 0) - (a.critic_score || 0);
        return new Date(b.created_at || b.source_date || 0).getTime() - new Date(a.created_at || a.source_date || 0).getTime();
      });
  }, [packs, search, styleFilter, sort]);

  function savePack(pack: ContentPack) {
    setPacks((current) => [pack, ...current.filter((item) => item.id !== pack.id)]);
  }

  async function requestPack(path: string, body: Record<string, unknown>) {
    setRunState('running');
    setError('');
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || 'Request failed.');
    const pack = normalizePack(payload);
    if (!pack) throw new Error('The server returned an invalid content pack.');
    savePack(pack);
    setSelectedPack(null);
    setProgressText('Done');
    setRunState('done');
    return pack;
  }

  async function handleGenerate() {
    const cleanTheme = theme.trim() || 'AI tools for founders';
    try {
      await requestPack('/api/generateContentPack', {
        theme: cleanTheme,
        style,
        audience: settings.audience,
        apiKey: settings.openaiApiKey,
        source: 'both',
      });
    } catch (requestError) {
      setRunState('error');
      setError(requestError instanceof Error ? requestError.message : 'Generation failed.');
    }
  }

  async function handleRepurpose() {
    try {
      await requestPack('/api/repurposeContent', {
        content: sourceContent,
        formats,
        style,
        audience: settings.audience,
        theme: theme.trim() || 'Repurposed operator content',
        apiKey: settings.openaiApiKey,
      });
    } catch (requestError) {
      setRunState('error');
      setError(requestError instanceof Error ? requestError.message : 'Repurpose failed.');
    }
  }

  function openPack(pack: ContentPack) {
    setSelectedPack(pack);
    setSelectedTab('long_post');
  }

  async function copyCurrentTab() {
    if (!selectedPack) return;
    await navigator.clipboard.writeText(getTabText(selectedPack, selectedTab));
  }

  function toggleFormat(key: FormatKey) {
    setFormats((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  if (selectedPack) {
    const activeTab = tabs.find((tab) => tab.key === selectedTab) || tabs[0];
    return (
      <main className="min-h-screen bg-app text-primary-text">
        <section className="mx-auto max-w-4xl px-6 py-8">
          <button type="button" className="icon-link" onClick={() => setSelectedPack(null)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="mt-12">
            <h1 className="text-4xl font-medium tracking-tight text-primary-text">{selectedPack.tool_name}</h1>
            <a className="mt-3 inline-flex items-center gap-2 text-sm text-muted transition hover:text-primary-text" href={selectedPack.source_url} target="_blank" rel="noreferrer">
              {selectedPack.source_url} <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <nav className="mt-10 flex gap-2 overflow-x-auto border-b border-line pb-3">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" className={`tab-button ${selectedTab === tab.key ? 'active' : ''}`} onClick={() => setSelectedTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </nav>

          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm text-muted">{activeTab.instruction}</p>
              <button type="button" className="secondary-button" onClick={copyCurrentTab}>
                <Copy className="h-4 w-4" /> Copy
              </button>
            </div>
            <div className="detail-surface p-6 sm:p-8">
              <ContentBlock pack={selectedPack} tab={selectedTab} />
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app text-primary-text">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <button type="button" className="text-base font-medium tracking-tight text-primary-text" onClick={() => setMode('generate')}>Content OS</button>
        <nav className="mode-switch">
          {(['generate', 'repurpose', 'library'] as Mode[]).map((item) => (
            <button key={item} type="button" className={mode === item ? 'active' : ''} onClick={() => { setMode(item); setRunState('idle'); setError(''); }}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        <button type="button" className="icon-button" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {mode === 'generate' ? (
        <section className={`mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col items-center justify-center px-6 pb-20 text-center ${packs.length ? 'justify-start pt-20' : ''}`}>
          <div className={`w-full transition duration-150 ${runState === 'running' ? 'opacity-45' : 'opacity-100'}`}>
            <p className="text-sm text-muted">Generate a full content pack from a real AI update</p>
            <input className="main-input mt-6" value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="e.g. AI tools for founders" />
            <div className="mt-4 flex justify-center gap-2">
              {styles.map((item) => (
                <button key={item.value} type="button" className={`choice-pill ${style === item.value ? 'active' : ''}`} onClick={() => setStyle(item.value)}>
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" className="primary-button mt-6 w-full" disabled={runState === 'running'} onClick={handleGenerate}>Generate</button>
            <p className="mx-auto mt-4 max-w-lg text-xs leading-5 text-muted">Finds a real AI update, writes a long post, creates X thread, IG caption, carousel, script, and LinkedIn post</p>
          </div>

          {runState === 'running' || runState === 'done' ? <p className={`mt-6 text-sm text-muted ${runState === 'running' ? 'pulse-text' : ''}`}>{progressText}</p> : null}
          {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

          {packs[0] && runState === 'done' ? (
            <div className="mt-12 w-full">
              <PackCard pack={packs[0]} onOpen={openPack} />
            </div>
          ) : null}
        </section>
      ) : null}

      {mode === 'repurpose' ? (
        <section className={`mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center px-6 pb-20 text-center ${packs.length ? 'justify-start pt-16' : ''}`}>
          <div className={`w-full transition duration-150 ${runState === 'running' ? 'opacity-45' : 'opacity-100'}`}>
            <p className="text-sm text-muted">Paste any content and get it in every format</p>
            <textarea className="main-textarea mt-6" value={sourceContent} onChange={(event) => setSourceContent(event.target.value)} placeholder="Paste a blog post, transcript, tweet, or any content..." />
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {formatOptions.map((item) => (
                <label key={item.key} className="check-pill">
                  <input type="checkbox" checked={formats.includes(item.key)} onChange={() => toggleFormat(item.key)} />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            <button type="button" className="primary-button mt-6 w-full" disabled={runState === 'running'} onClick={handleRepurpose}>Repurpose</button>
            <p className="mx-auto mt-4 max-w-lg text-xs leading-5 text-muted">Your content gets rewritten for each platform using your voice and style rules</p>
          </div>

          {runState === 'running' || runState === 'done' ? <p className={`mt-6 text-sm text-muted ${runState === 'running' ? 'pulse-text' : ''}`}>{progressText}</p> : null}
          {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

          {packs[0] && runState === 'done' ? (
            <div className="mt-12 w-full">
              <PackCard pack={packs[0]} onOpen={openPack} />
            </div>
          ) : null}
        </section>
      ) : null}

      {mode === 'library' ? (
        <section className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-center text-sm text-muted">All your content packs</p>
          <input className="main-input mt-6" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search packs..." />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {(['all', 'ai_news', 'workflow', 'system'] as Array<'all' | ContentPack['style']>).map((item) => (
              <button key={item} type="button" className={`choice-pill ${styleFilter === item ? 'active' : ''}`} onClick={() => setStyleFilter(item)}>
                {item === 'all' ? 'All' : styleLabel(item)}
              </button>
            ))}
            <select className="small-select" value={sort} onChange={(event) => setSort(event.target.value as 'date' | 'score')}>
              <option value="date">Sort by date</option>
              <option value="score">Sort by score</option>
            </select>
          </div>
          <div className="mt-8 space-y-4">
            {filteredPacks.map((pack) => <PackCard key={pack.id} pack={pack} onOpen={openPack} />)}
            {!filteredPacks.length ? <p className="py-16 text-center text-sm text-muted">No packs yet.</p> : null}
          </div>
        </section>
      ) : null}

      <aside className={`settings-panel ${settingsOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-primary-text">Settings</h2>
          <button type="button" className="icon-button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <label className="settings-field mt-8">
          <span>OpenAI API Key</span>
          <input type="password" value={settings.openaiApiKey} onChange={(event) => setSettings((current) => ({ ...current, openaiApiKey: event.target.value }))} />
        </label>
        <label className="settings-field">
          <span>Audience</span>
          <input value={settings.audience} onChange={(event) => setSettings((current) => ({ ...current, audience: event.target.value }))} />
        </label>
        <label className="settings-field">
          <span>Default Style</span>
          <select value={settings.defaultStyle} onChange={(event) => {
            const nextStyle = event.target.value as ContentPack['style'];
            setSettings((current) => ({ ...current, defaultStyle: nextStyle }));
            setStyle(nextStyle);
          }}>
            {styles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <button type="button" className="primary-button mt-6 w-full" onClick={() => setSettingsOpen(false)}>Save</button>
        <p className="mt-4 text-xs leading-5 text-muted">Your API key is stored locally and never sent to our servers</p>
      </aside>
      {settingsOpen ? <button type="button" className="settings-backdrop" aria-label="Close settings" onClick={() => setSettingsOpen(false)} /> : null}
    </main>
  );
}
