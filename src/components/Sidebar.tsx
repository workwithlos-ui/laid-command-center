import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Video,
  Library,
  Users,
  BarChart2,
  Settings,
  ChevronRight,
  Zap,
} from 'lucide-react';

const navItems = [
  { path: '/',         label: 'Dashboard', icon: LayoutDashboard, shortcut: '1' },
  { path: '/studio',   label: 'Studio',    icon: Video,           shortcut: '2' },
  { path: '/library',  label: 'Library',   icon: Library,         shortcut: '3' },
  { path: '/audience', label: 'Audience',  icon: Users,           shortcut: '4' },
  { path: '/crm',      label: 'CRM',       icon: BarChart2,       shortcut: '5' },
];

const bottomItems = [
  { path: '/settings', label: 'Settings', icon: Settings, shortcut: null },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const width = expanded ? 220 : 56;

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="fixed left-0 top-0 z-40 hidden lg:flex flex-col h-full transition-[width] duration-200 ease-out"
        style={{
          width,
          background: '#0d0d0d',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo / Brand */}
        <div
          className="flex items-center shrink-0 overflow-hidden"
          style={{
            height: 44,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            paddingLeft: expanded ? 16 : 0,
            justifyContent: expanded ? 'flex-start' : 'center',
            transition: 'padding 0.2s ease, justify-content 0.2s ease',
          }}
        >
          {/* Icon mark */}
          <div className="flex items-center justify-center w-7 h-7 rounded-[4px] bg-[#d4ff00] shrink-0">
            <Zap className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
          </div>

          {expanded && (
            <div className="ml-2.5 overflow-hidden whitespace-nowrap">
              <span className="text-[13px] font-bold tracking-tight text-white">LAID</span>
              <span className="ml-1.5 text-[10px] text-zinc-600 font-medium">Command Center</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col flex-1 gap-0.5 p-2 pt-3">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={!expanded ? item.label : undefined}
                className="relative flex items-center gap-2.5 rounded-[4px] transition-colors duration-100 group"
                style={{
                  height: 32,
                  paddingLeft: expanded ? 10 : 0,
                  justifyContent: expanded ? 'flex-start' : 'center',
                  background: active ? 'rgba(212, 255, 0, 0.08)' : 'transparent',
                  color: active ? '#d4ff00' : '#71717a',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = '#1a1a1a';
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#71717a';
                }}
              >
                {/* Active indicator */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-[#d4ff00]"
                  />
                )}

                <Icon
                  className="shrink-0"
                  style={{ width: 15, height: 15, marginLeft: active ? 6 : (expanded ? 6 : 0) }}
                  strokeWidth={active ? 2.2 : 1.8}
                />

                {expanded && (
                  <span className="text-[13px] font-medium whitespace-nowrap">{item.label}</span>
                )}

                {/* Keyboard shortcut hint */}
                {expanded && (
                  <kbd className="ml-auto mr-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-2 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {bottomItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={!expanded ? item.label : undefined}
                className="relative flex items-center gap-2.5 rounded-[4px] w-full transition-colors duration-100"
                style={{
                  height: 32,
                  paddingLeft: expanded ? 10 : 0,
                  justifyContent: expanded ? 'flex-start' : 'center',
                  background: active ? 'rgba(212, 255, 0, 0.08)' : 'transparent',
                  color: active ? '#d4ff00' : '#52525b',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = '#1a1a1a';
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#52525b';
                }}
              >
                <Icon className="shrink-0" style={{ width: 15, height: 15 }} strokeWidth={1.8} />
                {expanded && (
                  <span className="text-[13px] font-medium whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}

          {/* Collapse toggle */}
          {expanded && (
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-2.5 rounded-[4px] w-full mt-1 transition-colors duration-100"
              style={{ height: 28, paddingLeft: 10, color: '#3f3f46' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#71717a'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#3f3f46'; }}
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              <span className="text-[12px]">Collapse</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around lg:hidden"
        style={{
          background: '#0d0d0d',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {[...navItems, ...bottomItems].map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-3"
              style={{ color: active ? '#d4ff00' : '#52525b' }}
            >
              <Icon style={{ width: 18, height: 18 }} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
