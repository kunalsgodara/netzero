import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/hooks/useQueryClient';
import { pagesConfig } from './pages.config';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import PageNotFound from '@/components/ui/PageNotFound';
import Benchmarking from './pages/Benchmarking';
import ScenarioPlanner from './pages/ScenarioPlanner';
import Landing from './pages/Landing';

const { Pages, Layout } = pagesConfig;

const LayoutWrapper = ({ children, currentPageName }: { children: React.ReactNode; currentPageName: string }) =>
  Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>;

function AuthenticatedApp() {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/Landing" element={<Landing />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={<LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>}
        />
      ))}
      <Route path="/Benchmarking" element={<LayoutWrapper currentPageName="Benchmarking"><Benchmarking /></LayoutWrapper>} />
      <Route path="/ScenarioPlanner" element={<LayoutWrapper currentPageName="ScenarioPlanner"><ScenarioPlanner /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
