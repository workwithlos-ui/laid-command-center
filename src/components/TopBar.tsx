import { useLocation } from 'react-router';

const pageTitles: Record<string, { title: string; eyebrow: string }> = {
  '/': { title: 'Command Center', eyebrow: 'AI content intelligence' },
  '/generate': { title: 'Generate', eyebrow: 'Six-agent content sprint' },
  '/agents': { title: 'Agent Studio', eyebrow: 'Your autonomous content team' },
  '/memory': { title: 'Brand Memory', eyebrow: 'Voice, hooks, objections, phrases' },
};

export function TopBar() {
  const location = useLocation();
  const meta = pageTitles[location.pathname] || pageTitles['/'];

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-white/10 bg-[#050508]/72 backdrop-blur-2xl lg:left-[72px]">
      <div className="flex h-full items-center justify-between px-4 lg:px-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-[#71717A]">{meta.eyebrow}</p>
          <h1 className="text-base font-semibold tracking-tight text-[#F8FAFC]">{meta.title}</h1>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-[#A1A1AA] shadow-[0_0_28px_rgba(34,211,238,0.05)]">
            Content Command
          </div>
          <div className="h-8 w-[1px] bg-gradient-to-b from-[#A855F7] to-[#22D3EE]" />
        </div>
      </div>
    </header>
  );
}
