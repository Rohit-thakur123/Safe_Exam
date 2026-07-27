// Error Page — premium enterprise design
// Handles: SESSION_EXPIRED, INVALID_TOKEN, EXAM_NOT_FOUND, and generic errors
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, XCircle, Clock, Lock, RefreshCw, X } from 'lucide-react';

// ── Error config per code ─────────────────────────────────────────────────────

type ErrorConfig = {
  icon: React.ReactNode;
  iconBg: string;
  glow: string;
  title: string;
  detail: string;
  canRetry: boolean;
};

const getConfig = (code: string, message: string): ErrorConfig => {
  switch (code) {
    case 'SESSION_EXPIRED':
      return {
        icon: <Clock size={32} className="text-white" />,
        iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
        glow: 'rgba(245,158,11,0.25)',
        title: 'Session Expired',
        detail: 'Your exam session has expired. This may happen if you took too long or left the exam page. Please contact your instructor for a new session.',
        canRetry: false,
      };
    case 'INVALID_TOKEN':
      return {
        icon: <Lock size={32} className="text-white" />,
        iconBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
        glow: 'rgba(239,68,68,0.25)',
        title: 'Invalid or Expired Link',
        detail: 'The exam link you used is invalid or has already been used. Please check your email for the correct link or contact your instructor.',
        canRetry: false,
      };
    case 'EXAM_NOT_FOUND':
      return {
        icon: <XCircle size={32} className="text-white" />,
        iconBg: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        glow: 'rgba(99,102,241,0.25)',
        title: 'Exam Not Found',
        detail: 'The exam you are trying to access could not be found. It may have been removed or the link is incorrect.',
        canRetry: false,
      };
    default:
      return {
        icon: <AlertTriangle size={32} className="text-white" />,
        iconBg: 'linear-gradient(135deg, #ef4444, #b91c1c)',
        glow: 'rgba(239,68,68,0.25)',
        title: 'Something Went Wrong',
        detail: message || 'An unexpected error occurred. Please try again or contact support if the problem persists.',
        canRetry: true,
      };
  }
};

export const ErrorPage = () => {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'An error occurred';
  const code = searchParams.get('code') || 'UNKNOWN_ERROR';

  const cfg = getConfig(code, message);

  const nextSteps = [
    'Contact your instructor or exam administrator',
    'Provide them with the error code shown below',
    'Check your email for a new or corrected exam link',
    'Ensure you are using the most recent link sent to you',
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(145deg, #0f0f17 0%, #0d0d1a 50%, #0f0f17 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: cfg.glow }}
      />

      <div
        className="relative w-full max-w-lg animate-fade-slide-up"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1.5rem',
          boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 60px ${cfg.glow}`,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 inset-x-0 h-px rounded-t-3xl"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.glow.replace('0.25', '0.7')}, transparent)` }}
        />

        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center"
              style={{ background: cfg.iconBg, boxShadow: `0 0 40px ${cfg.glow}` }}
            >
              {cfg.icon}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-center tracking-tight mb-2" style={{ color: '#f0f0f5' }}>
            {cfg.title}
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: 'rgba(240,240,245,0.55)' }}>
            {cfg.detail}
          </p>

          {/* Error message banner */}
          {message && message !== 'An error occurred' && (
            <div
              className="mb-4 flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertTriangle size={15} style={{ color: '#fca5a5', flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,240,245,0.75)' }}>{message}</p>
            </div>
          )}

          {/* Error code */}
          <div
            className="mb-5 rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-xs" style={{ color: 'rgba(240,240,245,0.4)' }}>Error Code</span>
            <code
              className="text-xs font-bold px-2 py-0.5 rounded-lg font-mono"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,240,245,0.9)' }}
            >
              {code}
            </code>
          </div>

          {/* What to do next */}
          <div
            className="mb-6 rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(240,240,245,0.4)' }}>
              What to do
            </p>
            <ul className="space-y-2">
              {nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: 'rgba(240,240,245,0.65)' }}>
                  <div
                    className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}
                  >
                    {i + 1}
                  </div>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {cfg.canRetry && (
              <button
                onClick={() => window.location.reload()}
                className="flex-1 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-80"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(240,240,245,0.8)',
                }}
              >
                <RefreshCw size={15} /> Try Again
              </button>
            )}
            <button
              onClick={() => window.close()}
              className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ background: cfg.iconBg, boxShadow: `0 4px 20px ${cfg.glow}` }}
            >
              <X size={15} /> Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};