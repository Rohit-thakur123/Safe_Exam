// Custom hook for countdown timer with server time sync & clock skew resilience
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerOptions {
  endTime: string | null;
  serverTime?: string | null;
  onTimeUp?: () => void;
  warningThreshold?: number; // seconds before end to show warning
}

interface UseTimerReturn {
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  isWarning: boolean;
  isExpired: boolean;
}

export const useTimer = ({ 
  endTime, 
  serverTime,
  onTimeUp,
  warningThreshold = 300 // 5 minutes warning by default
}: UseTimerOptions): UseTimerReturn => {
  // Calculate offset between server clock and client clock
  const serverOffsetRef = useRef<number>(0);

  useEffect(() => {
    if (serverTime) {
      const serverMs = new Date(serverTime).getTime();
      const clientMs = Date.now();
      if (!isNaN(serverMs)) {
        serverOffsetRef.current = serverMs - clientMs;
      }
    }
  }, [serverTime]);

  const calculateRemaining = useCallback((): number => {
    if (!endTime) return 0;
    const endMs = new Date(endTime).getTime();
    if (isNaN(endMs)) return 0;

    const adjustedNow = Date.now() + serverOffsetRef.current;
    return Math.max(0, Math.floor((endMs - adjustedNow) / 1000));
  }, [endTime]);

  const [timeRemaining, setTimeRemaining] = useState<number>(() => calculateRemaining());
  const [isExpired, setIsExpired] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 0) return '00:00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!endTime) return;

    const initialRemaining = calculateRemaining();
    setTimeRemaining(initialRemaining);

    if (initialRemaining <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);

      if (remaining === 0 && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        setIsExpired(true);
        clearInterval(timer);

        if (onTimeUpRef.current) {
          onTimeUpRef.current();
        }
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [endTime, calculateRemaining]);

  const isWarning = timeRemaining > 0 && timeRemaining <= warningThreshold;

  return { 
    timeRemaining, 
    formatTime, 
    isWarning,
    isExpired 
  };
};