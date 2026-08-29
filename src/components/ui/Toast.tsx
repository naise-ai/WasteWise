// ============================================================
// WasteWise — Toast Notification System
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const icons = {
  success: <CheckCircle2 size={18} color="#16a34a" />,
  error: <XCircle size={18} color="#dc2626" />,
  warning: <AlertTriangle size={18} color="#ca8a04" />,
  info: <Info size={18} color="#0284c7" />,
};

function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div className={`toast ${toast.type}`}>
      {icons[toast.type]}
      <div style={{ flex: 1 }}>
        <div className="toast-title">{toast.title}</div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <button className="btn btn-ghost btn-icon" onClick={() => onRemove(toast.id)} style={{ padding: 4 }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────
let globalAddToast: ((t: Omit<ToastMessage, 'id'>) => void) | null = null;

export function showToast(t: Omit<ToastMessage, 'id'>) {
  if (globalAddToast) globalAddToast(t);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => { globalAddToast = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => <Toast key={t.id} toast={t} onRemove={removeToast} />)}
    </div>
  );
}
