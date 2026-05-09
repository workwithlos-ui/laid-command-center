import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { CommandBar } from '@/components/CommandBar';
import { DashboardView } from '@/views/DashboardView';
import { StudioView } from '@/views/StudioView';
import { LibraryView } from '@/views/LibraryView';
import { AudienceView } from '@/views/AudienceView';
import { CRMView } from '@/views/CRMView';
import { SettingsView } from '@/views/SettingsView';

const SIDEBAR_W = 56; // collapsed sidebar width
const TOPBAR_H  = 44;

export default function App() {
  const [cmdOpen, setCmdOpen] = useState(false);

  // Global ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && cmdOpen) {
        setCmdOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cmdOpen]);

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a]">
      {/* Sidebar */}
      <Sidebar />

      {/* Top bar */}
      <TopBar onCommandOpen={() => setCmdOpen(true)} />

      {/* Command bar modal */}
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Main content — offset for sidebar + topbar */}
      <main
        style={{
          paddingLeft: SIDEBAR_W,
          paddingTop: TOPBAR_H,
          minHeight: '100dvh',
        }}
        className="pb-16 lg:pb-0"
      >
        <div className="px-5 py-5 mx-auto max-w-[1400px]">
          <Routes>
            <Route path="/"         element={<DashboardView />} />
            <Route path="/studio"   element={<StudioView />} />
            <Route path="/library"  element={<LibraryView />} />
            <Route path="/audience" element={<AudienceView />} />
            <Route path="/crm"      element={<CRMView />} />
            <Route path="/settings" element={<SettingsView />} />

            {/* Legacy route aliases — redirect to new paths */}
            <Route path="/feed"    element={<Navigate to="/studio"  replace />} />
            <Route path="/assets"  element={<Navigate to="/library" replace />} />
            <Route path="/tracker" element={<Navigate to="/crm"     replace />} />
            <Route path="/swarm"   element={<Navigate to="/studio"  replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
