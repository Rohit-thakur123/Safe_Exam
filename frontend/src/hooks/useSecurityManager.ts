import { useState, useEffect, useCallback, useRef } from 'react';
import { examAttemptAPI } from '../services/api';
import type { SecurityPolicy } from '../types';

export interface SecurityState {
  warnings: string[];
  terminated: boolean;
  terminationReason?: string;
  isFullscreen: boolean;
}

export function useSecurityManager(attemptId: string | null, policy?: SecurityPolicy) {
  const [securityState, setSecurityState] = useState<SecurityState>({
    warnings: [],
    terminated: false,
    isFullscreen: true, // Assume true initially or track actual state
  });



  const reportViolation = useCallback(async (violationType: string, details?: string) => {
    if (!attemptId || securityState.terminated) return;
    
    try {
      const response = await examAttemptAPI.reportViolation(attemptId, violationType, details);
      
      if (response.action === 'TERMINATE' || response.action === 'AUTO_SUBMIT') {
        setSecurityState(prev => ({ ...prev, terminated: true, terminationReason: `Policy violation: ${violationType} limit exceeded.` }));
      } else if (response.action === 'WARNING') {
        setSecurityState(prev => ({
          ...prev,
          warnings: [...prev.warnings, response.message || `Warning: ${violationType} detected.`]
        }));
      }
    } catch (err) {
      console.error('Failed to report violation', err);
    }
  }, [attemptId, securityState.terminated]);

  // Tab switch / Blur detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('TAB_SWITCH', 'User switched tabs or minimized the browser');
      }
    };
    const handleBlur = () => {
      reportViolation('WINDOW_BLUR', 'Window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [reportViolation]);

  // Copy/Paste detection
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation('COPY_PASTE', 'Copy action prevented');
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation('COPY_PASTE', 'Paste action prevented');
    };
    
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [reportViolation]);

  // Right click detection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation('RIGHT_CLICK', 'Right click prevented');
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [reportViolation]);
  
  // Fullscreen exit detection
  useEffect(() => {
    // Initial check
    if (document.fullscreenElement) {
      setSecurityState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      setSecurityState(prev => ({ ...prev, isFullscreen: false }));
    }

    const handleFullscreenChange = () => {
      const currentlyFullscreen = !!document.fullscreenElement;
      setSecurityState(prev => ({ ...prev, isFullscreen: currentlyFullscreen }));

      if (!currentlyFullscreen && policy?.requireFullscreen) {
        reportViolation('FULLSCREEN_EXIT', 'Exited fullscreen mode');
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [reportViolation, policy?.requireFullscreen]);

  // Network disconnect detection
  useEffect(() => {
    const handleOffline = () => {
      reportViolation('NETWORK_DISCONNECT', 'Network connection lost');
    };
    
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, [reportViolation]);

  // DevTools detection (Keyboard shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        reportViolation('DEVTOOLS_OPEN', 'F12 Developer Tools prevented');
      }
      // Ctrl+Shift+I / Cmd+Option+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
        e.preventDefault();
        reportViolation('DEVTOOLS_OPEN', 'Ctrl+Shift+I Developer Tools prevented');
      }
      // Ctrl+Shift+J / Cmd+Option+J
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
        e.preventDefault();
        reportViolation('DEVTOOLS_OPEN', 'Ctrl+Shift+J Developer Tools prevented');
      }
      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
        e.preventDefault();
        reportViolation('DEVTOOLS_OPEN', 'View Source prevented');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [reportViolation]);

  return {
    securityState,
    reportViolation,
    dismissWarning: (index: number) => {
      setSecurityState(prev => {
        const newWarnings = [...prev.warnings];
        newWarnings.splice(index, 1);
        return { ...prev, warnings: newWarnings };
      });
    }
  };
}
