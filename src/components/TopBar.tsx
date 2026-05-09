import { useLocation } from 'react-router';
import { Search, ChevronDown, Bell } from 'lucide-react';
import { FoundingSeatCounter } from './FoundingSeatCounter';

const pageMeta: Record<string, { title: string; description?: string }> = {
  '/':         { title: 'Dashboard',  description: 'Overview' },
  '/studio':   { title: 'Studio',     description: 'Create avatar videos & content' },
  '/library':  { title: 'Library',    description: 'Your videos & content assets' },
  '/audience': { title: 'Audience',   description: 'Reddit intel & pain points' },
  '/crm':      { title: 'CRM',        description: 'Prospect pipeline' },
  '/settings': { title: 'Settings',   description: 'Workspace & account' },
};

interface TopBarProps {
  onCommandOpen: () => void;
}

export function TopBar({ onCommandOpen }: TopBarProps) {
  const location = useLocation();
  const meta = pageMeta[location.pathname] ?? { title: 'LAID' };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center"
      style={{
        left: 56,   // matches collapsed sidebar width
        height: 44,
        background: '#0a0a0a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Left: page title */}
      <div className="flex items-center gap-2 px-4">
        <span className="text-[13px] font-semibold text-white tracking-tight">{meta.title}</span>
        {meta.description && (
          <>
            <span className="text-zinc-700 text-[13px]">/</span>
            <span className="text-[12px] text-zinc-500">{meta.description}</span>
          </>
        )}
      </div>

      {/* Center: command bar trigger */}
      <div className="flex-1 flex justify-center px-4">
        <button
          onClick={onCommandOpen}
          className="hidden sm:flex items-center gap-2 rounded-[4px] px-3 h-7 text-[12px] text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-zinc-400"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            maxWidth: 320,
            width: '100%',
          }}
        >
          <Search className="w-3 h-3 shrink-0" />
          <span className="flex-1 text-left">Search everything...</span>
          <kbd className="ml-auto">⌘K</kbd>
        </button>
      </div>

      {/* Right: founding counter + workspace + user */}
      <div className="flex items-center gap-3 px-4">
        {/* Founding seat counter */}
        <div
          className="hidden md:flex items-center gap-2 rounded-[4px] px-2.5 py-1"
          style={{
            background: 'rgba(212, 255, 0, 0.05)',
            border: '1px solid rgba(212, 255, 0, 0.15)',
          }}
        >
          <span className="text-[11px] font-medium text-zinc-500">Founding</span>
          <FoundingSeatCounter />
        </div>

        {/* Notifications */}
        <button
          className="relative flex items-center justify-center w-7 h-7 rounded-[4px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          {/* Unread dot */}
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#d4ff00]" />
        </button>

        {/* Workspace / user menu */}
        <button
          className="flex items-center gap-1.5 rounded-[4px] px-2 h-7 text-[12px] text-zinc-400 hover:bg-white/[0.05] hover:text-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Avatar */}
          <div className="w-4.5 h-4.5 rounded-full bg-[#d4ff00] flex items-center justify-center shrink-0"
            style={{ width: 18, height: 18 }}
          >
            <span className="text-[9px] font-bold text-black">L</span>
          </div>
          <span className="hidden sm:block">Workspace</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
}
