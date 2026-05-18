import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  BrainCircuit,
  Command,
  LibraryBig,
  Lightbulb,
  RadioTower,
  Sparkles,
  Settings,
  Target,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Command Center', icon: Command },
  { path: '/generate', label: 'Generate', icon: Sparkles },
  { path: '/agents', label: 'Agent Studio', icon: BrainCircuit },
  { path: '/memory', label: 'Brand Memory', icon: LibraryBig },
  { path: '/market-radar', label: 'Market Radar', icon: RadioTower },
  { path: '/idea-scoring', label: 'Idea Scoring', icon: Lightbulb },
  { path: '/sales-kit', label: 'Sales Kit', icon: Target },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <aside
        className="fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-white/10 bg-[#050508]/82 shadow-[24px_0_70px_rgba(0,0,0,0.38)] backdrop-blur-2xl transition-all duration-300 lg:flex"
        style={{ width: hovered ? 256 : 72 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex h-16 items-center border-b border-white/10 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#22D3EE] text-sm font-black text-white shadow-[0_0_34px_rgba(168,85,247,0.34)]">
              C
            </div>
            <div className={`transition-all duration-300 ${hovered ? 'w-40 opacity-100' : 'w-0 opacity-0'}`}>
              <div className="whitespace-nowrap text-sm font-semibold tracking-tight text-[#F8FAFC]">Content Command</div>
              <div className="whitespace-nowrap text-[10px] uppercase tracking-[0.24em] text-[#71717A]">Intelligence UI</div>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-2 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-left transition-all duration-300 ${
                  isActive
                    ? 'bg-white/[0.075] text-[#F8FAFC] shadow-[0_0_34px_rgba(168,85,247,0.12)]'
                    : 'text-[#71717A] hover:bg-white/[0.045] hover:text-[#F8FAFC]'
                }`}
              >
                {isActive && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gradient-to-b from-[#A855F7] to-[#22D3EE]" />}
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-all ${isActive ? 'bg-gradient-to-br from-[#A855F7]/24 to-[#22D3EE]/18 text-[#D8B4FE]' : 'bg-white/[0.035] text-[#71717A] group-hover:text-[#22D3EE]'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`whitespace-nowrap text-sm font-medium transition-all duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-8 border-t border-white/10 bg-[#050508]/88 backdrop-blur-2xl lg:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 ${isActive ? 'text-[#A855F7]' : 'text-[#71717A]'}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
