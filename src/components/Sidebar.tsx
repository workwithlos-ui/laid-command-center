import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Zap,
  Newspaper,
  Package,
  Users,
  GitBranch,
  Image,
  Settings,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/daily', label: 'Daily', icon: Zap },
  { path: '/feed', label: 'Feed', icon: Newspaper },
  { path: '/assets', label: 'Assets', icon: Package },
  { path: '/tracker', label: 'Tracker', icon: Users },
  { path: '/swarm', label: 'Swarm', icon: GitBranch },
  { path: '/carousels', label: 'Carousels', icon: Image },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-[#222222] bg-[#0a0a0a] transition-all duration-200 lg:flex"
        style={{ width: hovered ? 240 : 64 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex h-14 items-center justify-center border-b border-[#222222]">
          <span className={`font-bold text-[#c9a84c] transition-opacity ${hovered ? 'text-lg' : 'text-sm'}`}>
            {hovered ? 'LAID' : 'L'}
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 rounded-md px-3 py-3 text-left transition-all ${
                  isActive
                    ? 'border-l-[3px] border-l-[#c9a84c] bg-[#1a1a1a] text-[#c9a84c]'
                    : 'border-l-[3px] border-l-transparent text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {hovered && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-[#222222] bg-[#0a0a0a] lg:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 ${
                isActive ? 'text-[#c9a84c]' : 'text-[#666666]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
