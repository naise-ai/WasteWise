// ============================================================
// WasteWise — Sidebar Component
// ============================================================
import React from 'react';
import {
  LayoutDashboard, PlusCircle, FileText, BarChart3,
  Lightbulb, UtensilsCrossed, FileBarChart2, Bell,
  Settings, LogOut, Leaf, Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
// styles imported globally via App.tsx

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  section?: string;
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { state, dispatch } = useApp();
  const { currentPage, notifications, user } = state;
  const unread = notifications.filter(n => !n.isRead).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, section: 'MAIN' },
    { id: 'record', label: 'Record Waste', icon: <PlusCircle size={18} />, section: 'MAIN' },
    { id: 'records', label: 'Waste Records', icon: <FileText size={18} />, section: 'MAIN' },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} />, section: 'INSIGHTS' },
    { id: 'recommendations', label: 'Recommendations', icon: <Lightbulb size={18} />, section: 'INSIGHTS' },
    { id: 'fooditems', label: 'Food Items', icon: <UtensilsCrossed size={18} />, section: 'MANAGE' },
    { id: 'reports', label: 'Reports', icon: <FileBarChart2 size={18} />, section: 'MANAGE' },
    { id: 'import', label: 'Bulk Import', icon: <Upload size={18} />, section: 'MANAGE' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: unread || undefined, section: 'MANAGE' },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} />, section: 'ACCOUNT' },
  ];

  const navigate = (id: string) => {
    dispatch({ type: 'SET_PAGE', payload: id });
    onClose();
  };

  const sections = ['MAIN', 'INSIGHTS', 'MANAGE', 'ACCOUNT'];

  const initials = user?.name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD';

  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Leaf size={20} color="white" />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-brand">WasteWise</span>
            <span className="sidebar-tagline">Track. Discover. Serve.</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {sections.map(section => {
            const items = navItems.filter(item => item.section === section);
            return (
              <div key={section}>
                <div className="nav-section-label">{section}</div>
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                    onClick={() => navigate(item.id)}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    <span className="nav-item-label">{item.label}</span>
                    {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                  </div>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate('settings')}>
            <div className="avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Admin User'}</div>
              <div className="sidebar-user-role">{user?.role || 'Administrator'}</div>
            </div>
            <button
              className="sidebar-logout"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'LOGOUT' });
              }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
