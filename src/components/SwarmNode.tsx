import type { LucideIcon } from 'lucide-react';

interface SwarmNodeProps {
  icon: LucideIcon;
  label: string;
  description: string;
  stat: string;
}

export function SwarmNode({ icon: Icon, label, description, stat }: SwarmNodeProps) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#c9a84c] bg-[#111111]">
        <Icon className="h-7 w-7 text-[#c9a84c]" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-white">{label}</h3>
      <p className="mt-1 max-w-[200px] text-xs text-[#a0a0a0]">{description}</p>
      <div className="mt-2 text-xs font-mono text-[#c9a84c]">{stat}</div>
    </div>
  );
}
