import { Routes, Route, Navigate } from 'react-router';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { DashboardView } from '@/views/DashboardView';
import { GenerateView } from '@/views/GenerateView';
import { AgentStudioView } from '@/views/AgentStudioView';
import { BrandMemoryView } from '@/views/BrandMemoryView';
import { Settings } from '@/views/Settings';

export default function App() {
  return (
    <div className="obsidian-shell min-h-[100dvh]">
      <Sidebar />
      <TopBar />
      <main className="px-4 pb-24 pt-20 lg:pb-10 lg:pl-24 lg:pr-8">
        <div className="mx-auto max-w-[1480px] py-5">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/generate" element={<GenerateView />} />
            <Route path="/agents" element={<AgentStudioView />} />
            <Route path="/memory" element={<BrandMemoryView />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
