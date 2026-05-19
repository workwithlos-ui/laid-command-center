import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { readOpenAIKeyVerification, readStoredOpenAIKey, verifyOpenAIKey } from '@/lib/openaiKeyVerification';

const DashboardView = lazy(() => import('@/views/DashboardView').then((module) => ({ default: module.DashboardView })));
const GenerateView = lazy(() => import('@/views/GenerateView').then((module) => ({ default: module.GenerateView })));
const AgentStudioView = lazy(() => import('@/views/AgentStudioView').then((module) => ({ default: module.AgentStudioView })));
const BrandMemoryView = lazy(() => import('@/views/BrandMemoryView').then((module) => ({ default: module.BrandMemoryView })));
const MarketRadarView = lazy(() => import('@/views/MarketRadarView').then((module) => ({ default: module.MarketRadarView })));
const IdeaScoringView = lazy(() => import('@/views/IdeaScoringView').then((module) => ({ default: module.IdeaScoringView })));
const SalesKitView = lazy(() => import('@/views/SalesKitView').then((module) => ({ default: module.SalesKitView })));
const Settings = lazy(() => import('@/views/Settings').then((module) => ({ default: module.Settings })));

function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-[#A1A1AA]">Loading command surface...</div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const apiKey = readStoredOpenAIKey();
    if (apiKey.trim() && readOpenAIKeyVerification(apiKey).status === 'unknown') {
      void verifyOpenAIKey(apiKey);
    }
  }, []);

  return (
    <div className="obsidian-shell min-h-[100dvh]">
      <Sidebar />
      <TopBar />
      <main className="px-4 pb-24 pt-20 lg:pb-10 lg:pl-24 lg:pr-8">
        <div className="mx-auto max-w-[1480px] py-5">
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/generate" element={<GenerateView />} />
              <Route path="/agents" element={<AgentStudioView />} />
              <Route path="/memory" element={<BrandMemoryView />} />
              <Route path="/market-radar" element={<MarketRadarView />} />
              <Route path="/idea-scoring" element={<IdeaScoringView />} />
              <Route path="/sales-kit" element={<SalesKitView />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
