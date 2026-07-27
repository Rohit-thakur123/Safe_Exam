import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

// Theme-aware color tokens per toast type
const toastConfig: Record<ToastType, {
  icon: React.ReactNode;
  accentVar: string;
  tintVar: string;
}> = {
  success: {
    icon: <CheckCircle2 size={16} />,
    accentVar: 'var(--accent-emerald)',
    tintVar: 'var(--tint-emerald-text)',
  },
  error: {
    icon: <XCircle size={16} />,
    accentVar: 'var(--accent-rose)',
    tintVar: 'var(--tint-rose-text)',
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    accentVar: 'var(--accent-amber)',
    tintVar: 'var(--tint-amber-text)',
  },
  info: {
    icon: <Info size={16} />,
    accentVar: 'var(--accent-indigo)',
    tintVar: 'var(--tint-indigo-text)',
  },
};

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration || 4000;
    const timer = setTimeout(() => { onClose(); }, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const config = toastConfig[toast.type];

  return (
    <div
      className="fixed bottom-6 right-6 z-50"
      style={{ animation: 'fadeSlideIn 0.2s ease forwards' }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
      <div
        className="flex items-start gap-3 max-w-sm p-4 rounded-2xl"
        style={{
          background: 'var(--surface-elevated)',
          border: `1px solid color-mix(in srgb, ${config.accentVar} 30%, var(--border))`,
          boxShadow: `var(--shadow-lg), 0 0 0 1px color-mix(in srgb, ${config.accentVar} 15%, transparent)`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center mt-0.5"
          style={{
            background: `color-mix(in srgb, ${config.accentVar} 15%, transparent)`,
            color: config.tintVar,
          }}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 pt-0.5">
          {toast.title && (
            <h4 className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
              {toast.title}
            </h4>
          )}
          <p className="text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>
            {toast.message}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg transition-all duration-150 icon-btn"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
