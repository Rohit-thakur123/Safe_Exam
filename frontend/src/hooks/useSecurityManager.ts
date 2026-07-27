import { useState, useEffect, useCallback, useRef } from 'react';
import { examAttemptAPI } from '../services/api';
import type { SecurityPolicy } from '../types';

export interface SecurityState {
  warnings: string[];
  terminated: boolean;
  terminationReason?: string;
  isFullscreen: boolean;
  showFullscreenOverlay: boolean;
  fullscreenViolationCount: number;
}

export function useSecurityManager(attemptId: string | null, policy?: SecurityPolicy) {
  const [securityState, setSecurityState] = useState<SecurityState>({
    warnings: [],
    terminated: false,
    isFullscreen: !!document.fullscreenElement,
    showFullscreenOverlay: false,
    fullscreenViolationCount: 0,
  });

  // Track in-flight termination to avoid double-submits
  const terminatedRef = useRef(false);
  // Suppress window blur events when a fullscreen change is happening
  // (exiting fullscreen causes blur to fire BEFORE fullscreenchange)
  const fullscreenChangePendingRef = useRef(false);

  const reportViolation = useCallback(async (violationType: string, details?: string) => {
    if (!attemptId || terminatedRef.current) return null;

    try {
      const response = await examAttemptAPI.reportViolation(attemptId, violationType, details);

      if (response.action === 'TERMINATE' || response.action === 'AUTO_SUBMIT') {
        terminatedRef.current = true;
        setSecurityState(prev => ({
          ...prev,
          terminated: true,
          showFullscreenOverlay: false,
          terminationReason: response.reason || `Policy violation: ${violationType} limit exceeded.`,
        }));
      } else if (response.action === 'WARNING') {
        const msg = response.message || `Security violation: ${violationType.replace(/_/g, ' ')}.`;
        setSecurityState(prev => ({
          ...prev,
          warnings: [...prev.warnings, msg],
        }));
      }
      return response;
    } catch (err) {
      console.error('Failed to report violation', err);
      return null;
    }
  }, [attemptId]);

  // ── Fullscreen enforcement ──────────────────────────────────────────────────
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const nowFullscreen = !!document.fullscreenElement;

      // Mark that a fullscreen change just happened (suppresses the blur event)
      fullscreenChangePendingRef.current = true;
      setTimeout(() => { fullscreenChangePendingRef.current = false; }, 300);

      setSecurityState(prev => ({ ...prev, isFullscreen: nowFullscreen }));

      if (!nowFullscreen) {
        // Student exited fullscreen
        if (!policy?.requireFullscreen) return;

        setSecurityState(prev => ({
          ...prev,
          showFullscreenOverlay: true,
          fullscreenViolationCount: prev.fullscreenViolationCount + 1,
        }));

        const response = await reportViolation('FULLSCREEN_EXIT', 'Exited fullscreen mode');

        // If backend says terminate, the reportViolation handler already set terminated.
        // If warning, overlay stays until student clicks Resume.
        if (response?.action === 'WARNING') {
          // Keep overlay shown; it clears when student re-enters fullscreen
        }
      } else {
        // Student returned to fullscreen — hide overlay
        setSecurityState(prev => ({ ...prev, showFullscreenOverlay: false }));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [reportViolation, policy?.requireFullscreen]);

  // ── Tab switch / Blur detection ─────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('TAB_SWITCH', 'User switched tabs or minimized the browser');
      }
    };

    const handleBlur = () => {
      // Suppress blur if a fullscreen change is in progress — exiting fullscreen
      // triggers blur BEFORE fullscreenchange fires. Without this, the exit would
      // count as both a window_blur AND a fullscreen_exit.
      if (fullscreenChangePendingRef.current) return;
      reportViolation('WINDOW_BLUR', 'Window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [reportViolation]);

  // ── Clipboard detection ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation('COPY_ATTEMPT', 'Copy action prevented');
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation('PASTE_ATTEMPT', 'Paste action prevented');
    };
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation('CUT_ATTEMPT', 'Cut action prevented');
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, [reportViolation]);

  // ── Right click ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation('RIGHT_CLICK', 'Right click prevented');
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [reportViolation]);

  // ── Network disconnect ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleOffline = () => {
      reportViolation('OFFLINE', 'Network connection lost');
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [reportViolation]);

  // ── Keyboard shortcut / DevTools detection ──────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        reportViolation('DEVTOOLS_OPEN', 'F12 Developer Tools prevented');
        return;
      }
      // Ctrl+Shift+I / Cmd+Option+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        reportViolation('DEVTOOLS_OPEN', 'Ctrl+Shift+I Developer Tools prevented');
        return;
      }
      // Ctrl+Shift+J
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        reportViolation('DEVTOOLS_OPEN', 'Ctrl+Shift+J Developer Tools prevented');
        return;
      }
      // Ctrl+Shift+C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        reportViolation('DEVTOOLS_OPEN', 'Ctrl+Shift+C element inspector prevented');
        return;
      }
      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        reportViolation('DEVTOOLS_OPEN', 'View Source prevented');
        return;
      }
      // Ctrl+R / Ctrl+Shift+R (Refresh)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        return;
      }
      // Ctrl+C / Ctrl+V / Ctrl+X (handled by clipboard events above, but catch here too)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [reportViolation]);

  const requestFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen().catch(err => {
      console.error('requestFullscreen failed:', err);
    });
  }, []);

  return {
    securityState,
    reportViolation,
    requestFullscreen,
    dismissWarning: (index: number) => {
      setSecurityState(prev => {
        const newWarnings = [...prev.warnings];
        newWarnings.splice(index, 1);
        return { ...prev, warnings: newWarnings };
      });
    },
  };
}
