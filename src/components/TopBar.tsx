import { useLocation } from 'react-router';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/feed': 'Content Feed',
  '/assets': 'Assets',
  '/tracker': 'Prospect Tracker',
  '/swarm': 'Swarm Pipeline',
  '/settings': 'Settings',
};

export function TopBar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'LAID';

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-14 border-b border-[#222222] bg-[#0a0a0a] lg:left-16">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <h1 className="text-base font-semibold tracking-tight text-white">
          {title}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#666666]">LAID</span>
          <div className="h-4 w-[2px] bg-[#c9a84c]" />
        </div>
      </div>
    </header>
  );
}
