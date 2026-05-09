import { Search, PenTool, Package, Rocket } from 'lucide-react';
import { SwarmNode } from '@/components/SwarmNode';

const nodes = [
  {
    icon: Search,
    label: 'Research Agent',
    description: 'Scans 10 AI news sources daily',
    stat: '10 topics queued',
  },
  {
    icon: PenTool,
    label: 'Content Agent',
    description: 'Produces 60 pieces from 10 topics',
    stat: '60 pieces ready',
  },
  {
    icon: Package,
    label: 'Asset Agent',
    description: 'Builds 12 DM deliverables',
    stat: '12 templates live',
  },
  {
    icon: Rocket,
    label: 'Deploy Agent',
    description: 'Schedules across all channels',
    stat: '300 posts/month',
  },
];

export function SwarmView() {
  return (
    <div className="space-y-8">
      <p className="text-sm text-[#a0a0a0]">
        This is the system Los Silva uses to produce 300 pieces of tactical AI content every month , without writing a single post manually.
      </p>

      {/* Desktop horizontal flow */}
      <div className="hidden items-start justify-center gap-2 lg:flex">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex items-center">
            <SwarmNode {...node} />
            {i < nodes.length - 1 && (
              <div className="relative mx-4 w-20">
                <div className="border-t-2 border-dashed border-[#c9a84c]" />
                <div className="absolute top-[-3px] left-0 h-2 w-2 rounded-full bg-[#c9a84c] animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile vertical flow */}
      <div className="flex flex-col items-center gap-6 lg:hidden">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex flex-col items-center">
            <SwarmNode {...node} />
            {i < nodes.length - 1 && (
              <div className="relative my-3 h-12">
                <div className="h-full border-l-2 border-dashed border-[#c9a84c]" />
                <div className="absolute top-0 left-[-3px] h-2 w-2 rounded-full bg-[#c9a84c] animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
