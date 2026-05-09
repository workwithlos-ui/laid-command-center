import { useState } from 'react';
import {
  Video,
  Sparkles,
  ChevronDown,
  Play,
  RotateCcw,
  Check,
  Zap,
  User,
} from 'lucide-react';

/* ── Demo data ── */
const DEMO_AVATARS = [
  { id: '1', name: 'Marcus', gender: 'Male',   age: 32, style: 'Casual entrepreneur',   tags: ['casual', 'confident'] },
  { id: '2', name: 'Priya',  gender: 'Female',  age: 28, style: 'Professional exec',     tags: ['polished', 'authoritative'] },
  { id: '3', name: 'Jordan', gender: 'Neutral', age: 25, style: 'Gen Z creator',         tags: ['energetic', 'trendy'] },
  { id: '4', name: 'Elena',  gender: 'Female',  age: 35, style: 'Thought leader',        tags: ['direct', 'expert'] },
  { id: '5', name: 'Kai',    gender: 'Male',    age: 30, style: 'Relatable founder',     tags: ['authentic', 'raw'] },
  { id: '6', name: 'Aisha',  gender: 'Female',  age: 27, style: 'Lifestyle entrepreneur',tags: ['warm', 'aspirational'] },
];

const DEMO_HOOKS = [
  { id: '1', template: 'How I [achieved result] without [common method]',  score: 94, category: 'outcome' },
  { id: '2', template: 'The [adjective] truth about [topic] nobody shares',score: 89, category: 'secret' },
  { id: '3', template: 'I tried [thing] for 30 days — here\'s the data',   score: 86, category: 'experiment' },
  { id: '4', template: 'Stop doing [bad thing]. Do this instead',           score: 83, category: 'contrast' },
  { id: '5', template: 'Why [common belief] is destroying [desired outcome]',score: 81, category: 'challenge' },
];

const DURATION_OPTIONS = [15, 30, 60, 90];

const CONTENT_TYPES = [
  { id: 'ugc',      label: 'UGC Video',       description: 'Avatar talking-head ad' },
  { id: 'cascade',  label: 'Content Cascade', description: 'Blog + Twitter + LinkedIn' },
  { id: 'short',    label: 'Short Script',    description: '15–60s Reel/Short/TikTok' },
];

/* ── Avatar initials ── */
const avatarColors = ['#d4ff00', '#60a5fa', '#34d399', '#f87171', '#a78bfa', '#fbbf24'];

export function StudioView() {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [contentType, setContentType] = useState('ugc');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const canGenerate = selectedAvatar && topic.trim().length > 0 && selectedHook;

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2200);
  };

  const handleReset = () => {
    setSelectedAvatar(null);
    setTopic('');
    setSelectedHook(null);
    setDuration(30);
    setContentType('ugc');
    setGenerated(false);
  };

  return (
    <div className="fade-in space-y-4 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Create</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Pick an avatar, drop a topic, select a hook — ship.</p>
        </div>
        {generated && (
          <button onClick={handleReset} className="btn-ghost">
            <RotateCcw className="w-3.5 h-3.5" />
            New
          </button>
        )}
      </div>

      {/* Content type selector */}
      <div
        className="rounded-[6px] p-1 flex gap-1"
        style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {CONTENT_TYPES.map((ct) => (
          <button
            key={ct.id}
            onClick={() => setContentType(ct.id)}
            className="flex-1 flex flex-col items-center py-2 rounded-[4px] transition-colors"
            style={{
              background: contentType === ct.id ? 'rgba(212,255,0,0.08)' : 'transparent',
              border: contentType === ct.id ? '1px solid rgba(212,255,0,0.2)' : '1px solid transparent',
            }}
          >
            <span className={`text-[13px] font-medium ${contentType === ct.id ? 'text-[#d4ff00]' : 'text-zinc-400'}`}>
              {ct.label}
            </span>
            <span className="text-[11px] text-zinc-600 mt-0.5">{ct.description}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* ── Step 1: Avatar ── */}
          <div className="surface p-4 rounded-[6px]">
            <div className="section-header">
              <span className="section-title">1 — Avatar</span>
              {selectedAvatar && (
                <span className="badge badge-lime text-[10px]">
                  {DEMO_AVATARS.find((a) => a.id === selectedAvatar)?.name} selected
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
              {DEMO_AVATARS.map((avatar, i) => {
                const isSelected = selectedAvatar === avatar.id;
                const color = avatarColors[i % avatarColors.length];
                return (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className="flex flex-col items-center gap-1.5 rounded-[4px] p-2 transition-all duration-100"
                    style={{
                      background: isSelected ? 'rgba(212,255,0,0.08)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? `1px solid rgba(212,255,0,0.3)` : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Avatar circle */}
                    <div
                      className="avatar-circle"
                      style={{
                        width: 36, height: 36,
                        background: isSelected ? 'rgba(212,255,0,0.15)' : 'rgba(255,255,255,0.05)',
                        borderColor: isSelected ? 'rgba(212,255,0,0.4)' : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#d4ff00' : color,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {avatar.name[0]}
                    </div>
                    <span className={`text-[11px] font-medium ${isSelected ? 'text-[#d4ff00]' : 'text-zinc-400'}`}>
                      {avatar.name}
                    </span>
                    <span className="text-[10px] text-zinc-600 text-center leading-tight">
                      {avatar.style}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-[#d4ff00]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Step 2: Topic ── */}
          <div className="surface p-4 rounded-[6px]">
            <div className="section-header">
              <span className="section-title">2 — Topic</span>
            </div>
            <div className="mt-2">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How solo entrepreneurs can create 30 days of content in one weekend..."
                rows={3}
                className="w-full text-[13px] text-white resize-none rounded-[4px] px-3 py-2.5 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  outline: 'none',
                  color: '#fff',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(212,255,0,0.3)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[11px] text-zinc-600">Be specific — more detail = better scripts</span>
                <span className={`text-[11px] ${topic.length > 200 ? 'text-red-400' : 'text-zinc-600'}`}>
                  {topic.length}/200
                </span>
              </div>
            </div>
          </div>

          {/* ── Step 3: Hook ── */}
          <div className="surface p-4 rounded-[6px]">
            <div className="section-header">
              <span className="section-title">3 — Hook</span>
              {selectedHook && <span className="badge badge-lime text-[10px]">Selected</span>}
            </div>

            <div className="mt-2 space-y-1.5">
              {DEMO_HOOKS.map((hook) => {
                const isSelected = selectedHook === hook.id;
                return (
                  <button
                    key={hook.id}
                    onClick={() => setSelectedHook(hook.id)}
                    className="w-full flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-left transition-all duration-100"
                    style={{
                      background: isSelected ? 'rgba(212,255,0,0.06)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid rgba(212,255,0,0.25)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-[#d4ff00] bg-[#d4ff00]' : 'border-zinc-700'}`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                    </div>
                    <span className={`text-[13px] flex-1 leading-snug ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                      {hook.template}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`stat-pill ${hook.score >= 90 ? 'up' : 'neutral'} text-[10px]`}>
                        {hook.score}
                      </span>
                      <span className="text-[10px] text-zinc-700 capitalize">{hook.category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right panel: config + generate ── */}
        <div className="space-y-3">
          {/* Duration */}
          <div className="surface p-4 rounded-[6px]">
            <div className="section-header">
              <span className="section-title">Duration</span>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className="rounded-[4px] py-1.5 text-[12px] font-medium transition-colors"
                  style={{
                    background: duration === d ? 'rgba(212,255,0,0.1)' : 'rgba(255,255,255,0.03)',
                    border: duration === d ? '1px solid rgba(212,255,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    color: duration === d ? '#d4ff00' : '#71717a',
                  }}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Summary card */}
          <div className="surface p-4 rounded-[6px]">
            <div className="section-title mb-3">Summary</div>
            <div className="space-y-2">
              <SummaryRow icon={User} label="Avatar" value={selectedAvatar ? DEMO_AVATARS.find((a) => a.id === selectedAvatar)?.name ?? '—' : '—'} />
              <SummaryRow icon={Video} label="Duration" value={`${duration}s`} />
              <SummaryRow icon={Sparkles} label="Hook" value={selectedHook ? `#${selectedHook}` : '—'} />
            </div>
          </div>

          {/* Generate button */}
          {!generated ? (
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="w-full rounded-[6px] py-3 flex items-center justify-center gap-2 text-[13px] font-semibold transition-all duration-200"
              style={{
                background: canGenerate ? '#d4ff00' : 'rgba(255,255,255,0.05)',
                color: canGenerate ? '#0a0a0a' : '#3f3f46',
                cursor: canGenerate ? 'pointer' : 'not-allowed',
              }}
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" strokeWidth={2.5} />
                  Generate {contentType === 'ugc' ? 'Video' : contentType === 'cascade' ? 'Cascade' : 'Script'}
                </>
              )}
            </button>
          ) : (
            <div
              className="rounded-[6px] p-4 text-center"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <Check className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <div className="text-[13px] font-semibold text-white">Ready!</div>
              <div className="text-[12px] text-zinc-500 mt-1">Your content is in the Library</div>
              <button
                onClick={() => {}}
                className="flex items-center gap-1.5 mx-auto mt-3 btn-ghost"
              >
                <Play className="w-3 h-3" />
                Preview
              </button>
            </div>
          )}

          {!canGenerate && !generated && (
            <div className="text-[11px] text-zinc-600 text-center leading-relaxed">
              {!selectedAvatar && '• Pick an avatar\n'}
              {!topic.trim() && '• Enter a topic\n'}
              {!selectedHook && '• Select a hook'}
            </div>
          )}

          {/* Cost estimate */}
          <div
            className="rounded-[4px] px-3 py-2.5 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-[11px] text-zinc-600">Est. cost</span>
            <span className="num text-[12px] text-zinc-400">
              ~${contentType === 'ugc' ? '0.12' : contentType === 'cascade' ? '0.04' : '0.02'}
            </span>
          </div>

          <div className="text-[11px] text-zinc-700 text-center">
            <ChevronDown className="w-3 h-3 inline-block mr-1" />
            Advanced options
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <Icon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
      <span className="text-[12px] text-zinc-500 flex-1">{label}</span>
      <span className="text-[12px] text-white font-medium num">{value}</span>
    </div>
  );
}
