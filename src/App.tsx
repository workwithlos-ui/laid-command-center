import { Navigate, Route, Routes } from 'react-router';
import { DashboardView } from '@/views/DashboardView';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/library" element={<Navigate to="/" replace />} />
      <Route path="/feed" element={<Navigate to="/" replace />} />
      <Route path="/settings" element={<Navigate to="/" replace />} />
      <Route path="/assets" element={<Navigate to="/" replace />} />
      <Route path="/tracker" element={<Navigate to="/" replace />} />
      <Route path="/swarm" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
