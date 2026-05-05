import { Routes, Route, Navigate } from 'react-router';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { DashboardView } from '@/views/DashboardView';
import { FeedView } from '@/views/FeedView';
import { AssetsView } from '@/views/AssetsView';
import { TrackerView } from '@/views/TrackerView';
import { SwarmView } from '@/views/SwarmView';
import { SettingsView } from '@/views/SettingsView';

export default function App() {
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a]">
      <Sidebar />
      <TopBar />
      <main className="pt-14 pb-20 px-4 lg:pb-8 lg:pl-16">
        <div className="mx-auto max-w-[1400px] py-6">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/feed" element={<FeedView />} />
            <Route path="/assets" element={<AssetsView />} />
            <Route path="/tracker" element={<TrackerView />} />
            <Route path="/swarm" element={<SwarmView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
