import { useLocation } from 'react-router';

const pageTitles: Record<string, string> = {
  '/': 'AI Content Command Center',
  '/feed': 'Content Packs',
  '/assets': 'Asset Library',
  '/tracker': 'Founder Tracker',
  '/swarm': 'Workflow Pipeline',
  '/settings': 'Settings',
};

export function TopBar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'AI Content Command Center';

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-14 border-b border-[#222222] bg-[#0a0a0a]/95 backdrop-blur-xl lg:left-16">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <h1 className="text-base font-semibold tracking-tight text-white">
          {title}
        </h1>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium uppercase tracking-[0.22em] text-[#666666] sm:inline">LAID OS</span>
          <div className="h-4 w-[2px] bg-[#c9a84c]" />
        </div>
      </div>
    </header>
  );
}
