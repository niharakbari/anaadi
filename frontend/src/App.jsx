import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import AISearchPage from './pages/AISearch/AISearchPage';
import UploadPage from './pages/Upload/UploadPage';
import CataloguePage from './pages/Catalogue/CataloguePage';
import SearchHistoryPage from './pages/SearchHistory/SearchHistoryPage';
import AIStatusPage from './pages/AIStatus/AIStatusPage';
import SettingsPage from './pages/Settings/SettingsPage';
import DesignSystemPage from './pages/DesignSystem/DesignSystemPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

import { AISearchProvider } from './context/AISearchContext';

export default function App() {
  return (
    <AISearchProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route (No Layout Shell Wrapper) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Main Application Interface (Wrapped in Sidebar/Topbar Shell Layout) */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="search" element={<AISearchPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="catalogue" element={<CataloguePage />} />
            <Route path="history" element={<SearchHistoryPage />} />
            <Route path="status" element={<AIStatusPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Standalone Design System Preview Sandbox */}
          <Route path="/design-system" element={<DesignSystemPage />} />
        </Routes>
      </BrowserRouter>
    </AISearchProvider>
  );
}
