// ============================================================
// WasteWise — Root App Component
// ============================================================
import React, { useEffect, useState } from 'react';
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
import './styles/cursor-depth.css';

const DEPTH_SURFACE_SELECTOR = [
  '.login-card',
  '.login-mini-card',
  '.login-stat',
  '.card',
  '.kpi-card',
  '.goal-card',
  '.rec-card',
  '.insight-card',
  '.table-container',
  '.import-dropzone',
  '.quick-action-btn',
  '.form-control',
  '.btn:not(:disabled)',
  '.demo-btn:not(:disabled)',
  '.header-icon-btn:not(:disabled)',
  'button:not(:disabled):not(.password-toggle)',
  '.nav-item',
  '.sidebar-user',
  '.login-brand-icon',
].join(',');

function AppContent() {
  const { isAuthenticated, currentPage } = useAppState();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasFinePointer || prefersReducedMotion) return;

    let activeSurface: HTMLElement | null = null;
    let lastPointerEvent: PointerEvent | null = null;
    let frameId = 0;

    const clearActiveSurface = () => {
      if (!activeSurface) return;
      activeSurface.classList.remove('depth-active');
      activeSurface.style.removeProperty('--depth-rotate-x');
      activeSurface.style.removeProperty('--depth-rotate-y');
      activeSurface.style.removeProperty('--pointer-x');
      activeSurface.style.removeProperty('--pointer-y');
      activeSurface = null;
    };

    const updatePointerDepth = () => {
      frameId = 0;
      const pointerEvent = lastPointerEvent;
      if (!pointerEvent) return;

      const candidate = pointerEvent.target instanceof Element
        ? pointerEvent.target.closest(DEPTH_SURFACE_SELECTOR)
        : null;
      const surface = candidate instanceof HTMLElement ? candidate : null;

      if (surface !== activeSurface) {
        clearActiveSurface();
        activeSurface = surface;
      }
      if (!surface) return;

      const bounds = surface.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      const x = Math.max(-1, Math.min(1, ((pointerEvent.clientX - bounds.left) / bounds.width) * 2 - 1));
      const y = Math.max(-1, Math.min(1, ((pointerEvent.clientY - bounds.top) / bounds.height) * 2 - 1));
      const isFormField = surface.matches('.form-control');
      const isControl = surface.matches(
        'button, .btn, .demo-btn, .header-icon-btn, .nav-item, .sidebar-user, .login-brand-icon'
      );
      const tiltLimit = isFormField ? 1 : isControl ? 1.8 : 4.2;

      surface.classList.add('depth-surface', 'depth-active');
      surface.style.setProperty('--depth-rotate-x', `${-y * tiltLimit}deg`);
      surface.style.setProperty('--depth-rotate-y', `${x * tiltLimit}deg`);
      surface.style.setProperty('--pointer-x', `${((x + 1) / 2) * 100}%`);
      surface.style.setProperty('--pointer-y', `${((y + 1) / 2) * 100}%`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      lastPointerEvent = event;
      if (!frameId) frameId = window.requestAnimationFrame(updatePointerDepth);
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      lastPointerEvent = null;
      clearActiveSurface();
    };

    const handleWindowBlur = () => {
      lastPointerEvent = null;
      clearActiveSurface();
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerout', handlePointerOut);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('blur', handleWindowBlur);
      if (frameId) window.cancelAnimationFrame(frameId);
      clearActiveSurface();
      document.querySelectorAll('.depth-surface').forEach(surface => {
        surface.classList.remove('depth-surface', 'depth-active');
      });
    };
  }, []);

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
