// Custom hook for detecting tab visibility changes (anti-cheating)
// Phase 2 — now reports violations to backend via violationService.
import { useEffect, useCallback, useRef } from 'react';
import { reportViolation } from '../services/violationService';

interface UseTabVisibilityOptions {
  onTabSwitch?: (isHidden: boolean) => void;
  onFocusLoss?: () => void;
  attemptId?: string | null;
}

export const useTabVisibility = (options: UseTabVisibilityOptions = {}) => {
  const { onTabSwitch, onFocusLoss, attemptId } = options;
  const switchCountRef = useRef(0);
  const blurCountRef = useRef(0);

  const handleVisibilityChange = useCallback(() => {
    const isHidden = document.hidden;

    if (isHidden) {
      switchCountRef.current += 1;

      // Report to backend
      if (attemptId) {
        reportViolation(attemptId, 'tab_switch', {
          count: switchCountRef.current,
        });
      }

      if (onTabSwitch) {
        onTabSwitch(isHidden);
      }
    }
  }, [onTabSwitch, attemptId]);

  const handleBlur = useCallback(() => {
    blurCountRef.current += 1;

    // Report to backend
    if (attemptId) {
      reportViolation(attemptId, 'window_blur', {
        count: blurCountRef.current,
      });
    }

    if (onFocusLoss) {
      onFocusLoss();
    }
  }, [onFocusLoss, attemptId]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleVisibilityChange, handleBlur]);

  return {
    switchCount: switchCountRef.current,
    blurCount: blurCountRef.current,
  };
};