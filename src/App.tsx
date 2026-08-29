// ============================================================
// WasteWise — Root App Component
// ============================================================
import React, { useState } from 'react';
import { AppProvider, useAppState } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { ToastContainer } from './components/ui/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WasteRecording from './pages/WasteRecording';
import WasteRecords from './pages/WasteRecords';
import Analytics from './pages/Analytics';
import Recommendations from './pages/Recommendations';
import FoodItems from './pages/FoodItems';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import BulkImport from './pages/BulkImport';
import './styles/globals.css';
import './styles/layout.css';
import './styles/login.css';

function AppContent() {
  const { isAuthenticated, currentPage } = useAppState();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) return <Login />;

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    record: <WasteRecording />,
    records: <WasteRecords />,
    analytics: <Analytics />,
    recommendations: <Recommendations />,
    fooditems: <FoodItems />,
    reports: <Reports />,
    notifications: <Notifications />,
    settings: <Settings />,
    import: <BulkImport />,
  };

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-content">
          <div key={currentPage} className="page-enter">
            {pages[currentPage] || <Dashboard />}
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
