// Custom hook for sending heartbeat to keep session alive
import { useEffect, useRef } from 'react';
import { sendHeartbeat } from '../services/examService';

interface UseHeartbeatOptions {
  attemptId: string | null;
  interval?: number;
  enabled?: boolean;
}

export const useHeartbeat = (
  attemptId: string | null,
  options: Omit<UseHeartbeatOptions, 'attemptId'> = {}
) => {
  const { 
    interval = 60000, // Default 60 seconds
    enabled = true 
  } = options;
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  useEffect(() => {
    if (!enabled || !attemptId) return;

    // Do NOT send an immediate heartbeat here — in React StrictMode (dev), effects
    // fire twice on mount, which would send two heartbeats in rapid succession.
    // The interval below handles the first heartbeat after `interval` milliseconds.
    intervalRef.current = setInterval(async () => {
      try {
        await sendHeartbeat(attemptId);

        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
          console.log('[Heartbeat] Sent at:', new Date().toISOString());
        }
      } catch (error) {
        console.error('[Heartbeat] Failed:', error);
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [attemptId, interval, enabled]);
};