// ============================================================
// WasteWise — Header Component
// ============================================================
import { Menu, Bell, Sun, Moon, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';

interface HeaderProps {
  onMenuClick: () => void;
}

const pageGreetings: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Here\'s how your canteen is performing today.' },
  record: { title: 'Record Waste', subtitle: 'Log today\'s food preparation and waste data.' },
  records: { title: 'Waste Records', subtitle: 'Browse and manage all recorded waste data.' },
  analytics: { title: 'Analytics', subtitle: 'Advanced insights from your waste data.' },
  recommendations: { title: 'Smart Recommendations', subtitle: 'Actionable insights to help your canteen waste less.' },
  fooditems: { title: 'Food Items', subtitle: 'Manage your canteen\'s food catalog.' },
  reports: { title: 'Reports', subtitle: 'Generate and export waste reports.' },
  notifications: { title: 'Notifications', subtitle: 'Stay updated with alerts and insights.' },
  settings: { title: 'Settings', subtitle: 'Manage your profile and preferences.' },
  import: { title: 'Bulk Import', subtitle: 'Import multiple waste records at once via CSV.' },
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { state, dispatch } = useApp();
  const { settings, notifications, currentPage } = state;
  const unread = notifications.filter(n => !n.isRead).length;
  const isDark = settings.theme === 'dark';
  const info = pageGreetings[currentPage] || pageGreetings.dashboard;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const toggleTheme = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: isDark ? 'light' : 'dark' } });
  };

  const initials = state.user?.name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD';

  return (
    <header className="header">
      <button className="header-hamburger" onClick={onMenuClick}>
        <Menu size={20} />
      </button>

      <div className="header-greeting">
        {currentPage === 'dashboard' ? (
          <>
            <h2>{greeting}, {state.user?.name?.split(' ')[0] || 'Admin'} 👋</h2>
            <p>{info.subtitle}</p>
          </>
        ) : (
          <>
            <h2>{info.title}</h2>
            <p>{info.subtitle}</p>
          </>
        )}
      </div>

      <div className="header-actions">
        <span className="header-date">
          <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
          {format(now, 'dd MMM yyyy')}
        </span>

        <button className="header-icon-btn" onClick={toggleTheme} title="Toggle theme">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          className="header-icon-btn"
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'notifications' })}
          title="Notifications"
        >
          <Bell size={16} />
          {unread > 0 && <span className="notif-dot">{unread}</span>}
        </button>

        <div
          className="avatar"
          style={{ cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'settings' })}
          title="Profile"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
