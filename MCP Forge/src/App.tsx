import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Layout } from '@/components/ui/Layout';
import { Toaster } from '@/components/ui/Toaster';
import { Projects } from '@/pages/Projects';
import { Settings } from '@/pages/Settings';
import { ServerDetail } from '@/pages/ServerDetail';
import { AlertTriangle } from 'lucide-react';

// Lazy-load content-heavy pages
const Build = lazy(() => import('@/pages/Build').then(m => ({ default: m.Build })));
const Test = lazy(() => import('@/pages/Test').then(m => ({ default: m.Test })));
const Templates = lazy(() => import('@/pages/Templates').then(m => ({ default: m.Templates })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-6 h-6 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Projects />} />
            <Route path="/projects" element={<Navigate to="/" replace />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/fleet" element={<Navigate to="/" replace />} />
            <Route path="/creator" element={<Navigate to="/" replace />} />
            <Route path="/build" element={<Build />} />
            <Route path="/build/:templateName" element={<Build />} />
            <Route path="/test" element={<Test />} />
            <Route path="/test/:serverName" element={<Test />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/server/:serverName" element={<ServerDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
      <Toaster />
    </BrowserRouter>
  );
}
