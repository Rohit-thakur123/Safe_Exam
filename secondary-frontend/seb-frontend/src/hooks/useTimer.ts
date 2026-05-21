// Custom hook for countdown timer with auto-submit
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerOptions {
  endTime: string | null;
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
  onTimeUp,
  warningThreshold = 300 // 5 minutes warning by default
}: UseTimerOptions): UseTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);
  const hasTriggeredRef = useRef(false);
  
  // Update ref when callback changes
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
    
    const calculateTimeRemaining = (): number => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      return Math.max(0, Math.floor((end - now) / 1000));
    };
    
    // Set initial time
    setTimeRemaining(calculateTimeRemaining());
    
    // Update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
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
  }, [endTime]);
  
  const isWarning = timeRemaining > 0 && timeRemaining <= warningThreshold;
  
  return { 
    timeRemaining, 
    formatTime, 
    isWarning,
    isExpired 
  };
};