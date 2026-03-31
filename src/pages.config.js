import AIInsights from './pages/AIInsights';
import CBAMManager from './pages/CBAMManager';
import Dashboard from './pages/Dashboard';
import Emissions from './pages/Emissions';
import Onboarding from './pages/Onboarding';
import Reports from './pages/Reports';
import __Layout from './Layout.jsx';

export const PAGES = {
    "AIInsights": AIInsights,
    "CBAMManager": CBAMManager,
    "Dashboard": Dashboard,
    "Emissions": Emissions,
    "Onboarding": Onboarding,
    "Reports": Reports,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
