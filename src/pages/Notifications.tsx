// ============================================================
// WasteWise — Notifications Page (Connected to REST API)
// ============================================================
import { Bell, AlertCircle, CheckCircle2, Info, AlertTriangle, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Notification, NotificationPriority } from '../types';
import { notificationService } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { showToast } from '../components/ui/Toast';

const iconMap: Record<NotificationPriority, React.ReactNode> = {
  high: <AlertCircle size={18} color="#dc2626" />,
  medium: <AlertTriangle size={18} color="#ca8a04" />,
  success: <CheckCircle2 size={18} color="#16a34a" />,
  low: <Info size={18} color="#0284c7" />,
};

const bgMap: Record<NotificationPriority, string> = {
  high: '#fee2e2',
  medium: '#fef9c3',
  success: '#dcfce7',
  low: '#e0f2fe',
};

const emojiMap: Record<NotificationPriority, string> = {
  high: '🔴',
  medium: '🟡',
  success: '🟢',
  low: '🔵',
};

export default function Notifications() {
  const { state, dispatch } = useApp();
  const { notifications } = state;
  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ_LOCAL' });
      showToast({ type: 'success', title: 'All marked as read' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to update', message: err.message });
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {unread.length} unread notification{unread.length !== 1 ? 's' : ''}
        </div>
        {unread.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            <Check size={14} /> Mark all as read
          </button>
        )}
      </div>

      {/* Unread */}
      {unread.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Unread
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unread.map(n => <NotifCard key={n.id} n={n} dispatch={dispatch} />)}
          </div>
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Earlier
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {read.map(n => <NotifCard key={n.id} n={n} dispatch={dispatch} />)}
          </div>
        </div>
      )}

      {notifications.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><Bell size={24} /></div>
          <h3>All caught up!</h3>
          <p>You have no notifications at the moment.</p>
        </div>
      )}
    </div>
  );
}

function NotifCard({ n, dispatch }: { n: Notification; dispatch: any }) {
  const handleMarkRead = async () => {
    try {
      await notificationService.markAsRead(n.id);
      dispatch({ type: 'MARK_NOTIFICATION_READ_LOCAL', payload: n.id });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await notificationService.deleteNotification(n.id);
      dispatch({ type: 'DISMISS_NOTIFICATION_LOCAL', payload: n.id });
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div
      className="card animate-in"
      style={{
        padding: '14px 16px',
        borderLeft: `4px solid ${n.type === 'high' ? '#dc2626' : n.type === 'medium' ? '#ca8a04' : n.type === 'success' ? '#16a34a' : '#0284c7'}`,
        opacity: n.isRead ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: bgMap[n.type] || bgMap.low,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {iconMap[n.type] || iconMap.low}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{emojiMap[n.type] || '🔵'} {n.title}</span>
            {!n.isRead && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 4 }}>{n.message}</p>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {!n.isRead && (
            <button className="btn btn-ghost btn-icon" title="Mark as read" onClick={handleMarkRead}>
              <Check size={14} />
            </button>
          )}
          <button className="btn btn-ghost btn-icon" title="Dismiss"
            style={{ color: 'var(--text-tertiary)' }}
            onClick={handleDelete}>
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
