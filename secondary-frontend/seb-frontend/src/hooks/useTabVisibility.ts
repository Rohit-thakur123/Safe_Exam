// useTabVisibility.ts
// Detects and reports two distinct violation types:
//   1. tab_switch  — document.visibilitychange fires (tab backgrounded / other app opens)
//   2. window_blur — window blur fires (clicking out of the window WITHOUT hiding the tab)
// These are separate violation types with separate limits in the teacher's security policy.
// Both report to the backend and return the enforcement response.

import { useEffect, useCallback, useRef } from 'react';
import { reportViolation } from '../services/violationService';
import type { ViolationResponse } from '../services/violationService.types';

interface UseTabVisibilityOptions {
  /** Called on tab switch (visibilitychange hidden) with the backend response */
  onTabSwitch?: (response: ViolationResponse) => void;
  /** Called on window blur (window lost focus but tab still visible) with the backend response */
  onWindowBlur?: (response: ViolationResponse) => void;
  /** Legacy: called on any focus loss (kept for backward-compat) */
  onFocusLoss?: () => void;
  attemptId?: string | null;
}

export const useTabVisibility = (options: UseTabVisibilityOptions = {}) => {
  const { onTabSwitch, onWindowBlur, onFocusLoss, attemptId } = options;
  const switchCountRef = useRef(0);
  const blurCountRef = useRef(0);

  // Track whether the tab was already hidden when blur fired, to avoid double-counting:
  // When a user Alt+Tabs away, BOTH visibilitychange AND blur fire. We treat visibilitychange
  // as the canonical tab_switch event; window blur only fires for same-machine focus losses
  // that don't background the tab (e.g. clicking a different window while tab is visible).
  const tabHiddenRef = useRef(false);

  const handleVisibilityChange = useCallback(async () => {
    const isHidden = document.hidden;
    tabHiddenRef.current = isHidden;

    if (!isHidden) return; // Only act on hide, not restore

    switchCountRef.current += 1;

    if (attemptId) {
      try {
        const response = await reportViolation(attemptId, 'tab_switch', {
          count: switchCountRef.current,
        });
        onTabSwitch?.(response);
      } catch {
        // Network failure — violation queued
        onTabSwitch?.({ success: false, action: 'WARNING' });
      }
    }
  }, [onTabSwitch, attemptId]);

  const handleBlur = useCallback(async () => {
    // If the tab is hidden, visibilitychange already fired for this event — skip
    if (tabHiddenRef.current) return;

    blurCountRef.current += 1;

    if (attemptId) {
      try {
        const response = await reportViolation(attemptId, 'window_blur', {
          count: blurCountRef.current,
        });
        onWindowBlur?.(response);
      } catch {
        // Network failure — violation queued
        onWindowBlur?.({ success: false, action: 'WARNING' });
      }
    }

    // Legacy callback
    onFocusLoss?.();
  }, [onWindowBlur, onFocusLoss, attemptId]);

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