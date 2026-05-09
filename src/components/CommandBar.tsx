import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Video,
  Library,
  Users,
  BarChart2,
  Settings,
  Search,
  Play,
  FileText,
  Zap,
  X,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  group: string;
  action: () => void;
  keywords?: string;
}

interface CommandBarProps {
  open: boolean;
  onClose: () => void;
}

export function CommandBar({ open, onClose }: CommandBarProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const go = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose]
  );

  const items: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Dashboard', sublabel: 'Overview & stats', icon: LayoutDashboard, group: 'Navigate', action: () => go('/'), keywords: 'home overview stats' },
    { id: 'nav-studio', label: 'Studio', sublabel: 'Create avatar videos', icon: Video, group: 'Navigate', action: () => go('/studio'), keywords: 'create video avatar hook' },
    { id: 'nav-library', label: 'Library', sublabel: 'Videos & content assets', icon: Library, group: 'Navigate', action: () => go('/library'), keywords: 'videos assets content' },
    { id: 'nav-audience', label: 'Audience', sublabel: 'Reddit intel & insights', icon: Users, group: 'Navigate', action: () => go('/audience'), keywords: 'reddit audience insights pain points' },
    { id: 'nav-crm', label: 'CRM', sublabel: 'Prospect pipeline', icon: BarChart2, group: 'Navigate', action: () => go('/crm'), keywords: 'prospects pipeline crm tracker' },
    { id: 'nav-settings', label: 'Settings', sublabel: 'Workspace & account', icon: Settings, group: 'Navigate', action: () => go('/settings'), keywords: 'settings config' },

    // Quick actions
    { id: 'action-new-video', label: 'New Video', sublabel: 'Open Studio → create video', icon: Play, group: 'Actions', action: () => go('/studio'), keywords: 'create generate video' },
    { id: 'action-new-content', label: 'New Content Asset', sublabel: 'Open Studio → content cascade', icon: FileText, group: 'Actions', action: () => go('/studio'), keywords: 'blog post thread linkedin email' },
    { id: 'action-run-swarm', label: 'Run AI Swarm', sublabel: 'Generate content in bulk', icon: Zap, group: 'Actions', action: () => go('/studio'), keywords: 'swarm batch generate bulk' },
  ];

  // Reset search on close
  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-[540px] mx-4 fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className="rounded-lg overflow-hidden shadow-2xl"
          style={{
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
          shouldFilter={true}
        >
          {/* Input row */}
          <div className="flex items-center gap-2.5 px-4 border-b border-white/[0.06] h-11">
            <Search className="w-4 h-4 text-zinc-500 shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search views, avatars, videos, prospects..."
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-white placeholder:text-zinc-600 caret-[#d4ff00]"
              autoFocus
            />
            <div className="flex items-center gap-1 shrink-0">
              <kbd>esc</kbd>
              <button
                onClick={onClose}
                className="text-zinc-600 hover:text-zinc-400 transition-colors ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <Command.List className="max-h-[360px] overflow-y-auto p-1">
            <Command.Empty className="py-8 text-center text-[13px] text-zinc-600">
              No results for &ldquo;{search}&rdquo;
            </Command.Empty>

            {/* Navigation group */}
            <Command.Group heading="Navigate">
              {items
                .filter((i) => i.group === 'Navigate')
                .map((item) => (
                  <CommandItem key={item.id} item={item} />
                ))}
            </Command.Group>

            <Command.Separator />

            {/* Actions group */}
            <Command.Group heading="Actions">
              {items
                .filter((i) => i.group === 'Actions')
                .map((item) => (
                  <CommandItem key={item.id} item={item} />
                ))}
            </Command.Group>
          </Command.List>

          {/* Footer hint */}
          <div className="flex items-center gap-3 px-4 py-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-1 text-[11px] text-zinc-600">
              <kbd>↑↓</kbd><span>navigate</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-600">
              <kbd>↵</kbd><span>select</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-600">
              <kbd>esc</kbd><span>close</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}

function CommandItem({ item }: { item: { id: string; label: string; sublabel?: string; icon: React.ElementType; action: () => void; keywords?: string } }) {
  const Icon = item.icon;
  return (
    <Command.Item
      key={item.id}
      value={`${item.label} ${item.sublabel ?? ''} ${item.keywords ?? ''}`}
      onSelect={item.action}
      className="flex items-center gap-2.5 rounded-[4px] px-3 h-9 cursor-pointer text-[13px] transition-colors"
      style={{ color: 'var(--text-secondary)' }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
      <span className="text-white">{item.label}</span>
      {item.sublabel && (
        <span className="text-zinc-600 text-[12px] ml-0.5">{item.sublabel}</span>
      )}
      <div className="ml-auto flex items-center">
        <kbd className="text-[10px]">↵</kbd>
      </div>
    </Command.Item>
  );
}
