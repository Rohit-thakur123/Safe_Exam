import React from 'react';
import { ShieldAlert, AlertTriangle, XCircle, X, Maximize2 } from 'lucide-react';
import type { SecurityState } from '../../hooks/useSecurityManager';

interface SecurityOverlayProps {
  securityState: SecurityState;
  onDismissWarning: (index: number) => void;
  onRequestFullscreen?: () => void;
  requireFullscreen?: boolean;
}

export const SecurityOverlay: React.FC<SecurityOverlayProps> = ({
  securityState,
  onDismissWarning,
  onRequestFullscreen,
  requireFullscreen,
}) => {
  // ── Terminated — hard block, no interaction ─────────────────────────────────
  if (securityState.terminated) {
    return (
      <div
        className="fixed inset-0 z-[200] bg-gray-900/95 backdrop-blur-md flex items-center justify-center p-4"
        style={{ pointerEvents: 'all' }}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="card-surface rounded-2xl p-10 max-w-md w-full shadow-2xl border-t-4 border-red-600 text-center">
          <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-heading mb-2">Exam Terminated</h2>
          <p className="text-gray-600 mb-6">
            Your exam has been automatically terminated due to a security policy violation.
          </p>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-6 text-left">
            <h3 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Termination Reason
            </h3>
            <p className="text-sm text-red-800">
              {securityState.terminationReason || 'Multiple security violations detected.'}
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/student')}
            className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Fullscreen required overlay — blocks all exam interaction ───────────────
  if (requireFullscreen && securityState.showFullscreenOverlay) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-md flex items-center justify-center p-4"
        style={{ pointerEvents: 'all' }}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="card-surface rounded-2xl p-10 max-w-md w-full shadow-2xl border-t-4 border-amber-500 text-center">
          <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Maximize2 className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black text-heading mb-2">Fullscreen Required</h2>
          <p className="text-gray-600 mb-2">
            You exited fullscreen mode. This exam must be taken in fullscreen.
          </p>
          {securityState.fullscreenViolationCount > 0 && (
            <p className="text-sm text-amber-700 font-semibold mb-6">
              Violation {securityState.fullscreenViolationCount} recorded.
            </p>
          )}
          <button
            onClick={onRequestFullscreen}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors"
          >
            Resume Exam
          </button>
          <p className="mt-4 text-xs text-gray-400">
            You cannot interact with the exam until you return to fullscreen.
          </p>
        </div>
      </div>
    );
  }

  // ── Warning toasts — non-blocking, stacked at top ───────────────────────────
  if (securityState.warnings.length > 0) {
    return (
      <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
        {securityState.warnings.map((warning, index) => (
          <div
            key={index}
            className="pointer-events-auto w-full max-w-md bg-amber-500 text-white p-4 rounded-xl shadow-lg border border-amber-600 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm">Security Warning</h4>
              <p className="text-sm opacity-90">{warning}</p>
            </div>
            <button
              onClick={() => onDismissWarning(index)}
              className="p-1 hover:bg-amber-600 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return null;
};
