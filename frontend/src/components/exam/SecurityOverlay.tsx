import React from 'react';
import { ShieldAlert, AlertTriangle, XCircle, X } from 'lucide-react';
import type { SecurityState } from '../../hooks/useSecurityManager';

interface SecurityOverlayProps {
  securityState: SecurityState;
  onDismissWarning: (index: number) => void;
  requireFullscreen?: boolean;
}

export const SecurityOverlay: React.FC<SecurityOverlayProps> = ({ securityState, onDismissWarning, requireFullscreen }) => {
  if (securityState.terminated) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-t-4 border-red-500 transform animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center text-gray-900 mb-2">Exam Terminated</h2>
          <p className="text-center text-gray-600 mb-6">
            Your exam has been automatically terminated due to a security policy violation.
          </p>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
            <h3 className="text-sm font-bold text-red-800 mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Termination Reason
            </h3>
            <p className="text-sm text-red-700">
              {securityState.terminationReason || 'Multiple security violations detected.'}
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/student'}
            className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (requireFullscreen && !securityState.isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-t-4 border-amber-500 transform animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center text-gray-900 mb-2">Fullscreen Required</h2>
          <p className="text-center text-gray-600 mb-6">
            This exam requires you to remain in fullscreen mode. Please return to fullscreen to continue your exam.
          </p>
          <button 
            onClick={() => {
              document.documentElement.requestFullscreen().catch(err => {
                console.error("Error attempting to enable fullscreen:", err);
              });
            }}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
          >
            Re-enter Fullscreen
          </button>
        </div>
      </div>
    );
  }

  if (securityState.warnings.length > 0) {
    return (
      <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
        {securityState.warnings.map((warning, index) => (
          <div 
            key={index}
            className="pointer-events-auto w-full max-w-md bg-amber-500 text-white p-4 rounded-xl shadow-lg border border-amber-600 flex items-start gap-3 transform animate-in slide-in-from-top-4 fade-in duration-300"
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
