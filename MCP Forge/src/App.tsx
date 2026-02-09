import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Layout } from '@/components/ui/Layout';
import { Projects } from '@/pages/Projects';
import { Dashboard } from '@/pages/Dashboard';
import { Build } from '@/pages/Build';
import { Test } from '@/pages/Test';
import { Templates } from '@/pages/Templates';
import { Settings } from '@/pages/Settings';
import { ServerDetail } from '@/pages/ServerDetail';
import { Fleet } from '@/pages/Fleet';
import { CreatorDashboard } from '@/pages/CreatorDashboard';
import { AlertTriangle } from 'lucide-react';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-14 h-14 rounded-full bg-forge-surface border border-forge-border flex items-center justify-center mb-5">
        <AlertTriangle className="w-6 h-6 text-forge-text-muted" />
      </div>
      <p className="text-sm text-forge-text-muted mb-6">
        This page doesn't exist.
      </p>
      <Link to="/" className="forge-btn-ghost text-sm">
        Back to Projects
      </Link>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Projects />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/creator" element={<CreatorDashboard />} />
          <Route path="/build" element={<Build />} />
          <Route path="/build/:templateName" element={<Build />} />
          <Route path="/test" element={<Test />} />
          <Route path="/test/:serverName" element={<Test />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/server/:serverName" element={<ServerDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
