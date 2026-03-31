import AIInsights from './pages/AIInsights';
import CBAMManager from './pages/CBAMManager';
import Dashboard from './pages/Dashboard';
import Emissions from './pages/Emissions';
import Onboarding from './pages/Onboarding';
import Reports from './pages/Reports';
import Layout from './components/layout/Layout';

export const PAGES: Record<string, React.ComponentType> = {
  AIInsights,
  CBAMManager,
  Dashboard,
  Emissions,
  Onboarding,
  Reports,
};

export const pagesConfig = {
  mainPage: 'Dashboard',
  Pages: PAGES,
  Layout,
};
