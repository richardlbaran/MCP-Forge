import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
