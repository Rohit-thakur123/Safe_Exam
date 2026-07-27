// useDevToolsDetection.ts
//
// Standards-compliant DevTools detection for exam proctoring.
//
// BROWSER SECURITY LIMITATION (documented per mandate):
//   There is NO reliable cross-browser API to block or detect DevTools opening.
//   We use the best available heuristics:
//     1. Window size differential: DevTools attached to the window shrinks
//        the viewport; we compare window.outerWidth/Height vs innerWidth/Height.
//     2. console.log timing: some engines slow down if DevTools is open.
//   These methods are imperfect — a detached DevTools window won't be caught by
//   heuristic 1, and heuristic 2 has false positives on slow machines.
//   We log the violation and enforce the teacher's policy. We do NOT block DevTools
//   at the OS level (impossible in a browser).
//
// Usage:
//   useDevToolsDetection({ attemptId, onDetected, enabled });

import { useEffect, useRef, useCallback } from 'react';
import { reportViolation } from '../services/violationService';
import type { ViolationResponse } from '../services/violationService.types';

interface UseDevToolsDetectionOptions {
  attemptId: string | null;
  /** Called every time DevTools is detected with the backend enforcement response */
  onDetected?: (response: ViolationResponse) => void;
  /** Disable the hook (e.g. when exam is terminated) */
  enabled?: boolean;
  /** Poll interval in ms — default 2000 */
  intervalMs?: number;
}

// Threshold: if viewport is more than 200px smaller than outer window, DevTools is likely open.
const SIZE_THRESHOLD = 200;

export const useDevToolsDetection = ({
  attemptId,
  onDetected,
  enabled = true,
  intervalMs = 2000,
}: UseDevToolsDetectionOptions): void => {
  const reportedRef = useRef(false); // prevent hammering backend every tick
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(async () => {
    if (!enabled || !attemptId) return;

    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    const devToolsLikelyOpen = widthDiff > SIZE_THRESHOLD || heightDiff > SIZE_THRESHOLD;

    if (devToolsLikelyOpen && !reportedRef.current) {
      reportedRef.current = true;

      try {
        const response = await reportViolation(attemptId, 'devtools_open', {
          widthDiff,
          heightDiff,
          method: 'size_differential',
        });
        onDetected?.(response);
      } catch {
        // Network failure — violation will retry via queue
      }

      // Cooldown: don't re-report for 8 seconds to avoid flood
      cooldownRef.current = setTimeout(() => {
        reportedRef.current = false;
      }, 8000);
    } else if (!devToolsLikelyOpen) {
      reportedRef.current = false;
    }
  }, [enabled, attemptId, onDetected]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(check, intervalMs);

    return () => {
      clearInterval(interval);
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [check, enabled, intervalMs]);
};
