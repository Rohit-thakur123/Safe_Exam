// Custom hook for detecting tab visibility changes (potential cheating)
import { useEffect, useCallback, useRef } from 'react';

interface UseTabVisibilityOptions {
  onTabSwitch?: (isHidden: boolean) => void;
  onFocusLoss?: () => void;
  logToBackend?: boolean;
}

export const useTabVisibility = (options: UseTabVisibilityOptions = {}) => {
  const { onTabSwitch, onFocusLoss, logToBackend = false } = options;
  const switchCountRef = useRef(0);
  
  const handleVisibilityChange = useCallback(() => {
    const isHidden = document.hidden;
    
    if (isHidden) {
      switchCountRef.current += 1;
      console.warn(`[Security] Tab switched away (Count: ${switchCountRef.current})`);
      
      if (onTabSwitch) {
        onTabSwitch(isHidden);
      }
      
      // TODO: Log to backend if enabled
      if (logToBackend) {
        // Send tab switch event to backend
        console.log('[Security] Would log to backend:', {
          event: 'tab_switch',
          count: switchCountRef.current,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, [onTabSwitch, logToBackend]);
  
  const handleBlur = useCallback(() => {
    console.warn('[Security] Window lost focus');
    
    if (onFocusLoss) {
      onFocusLoss();
    }
  }, [onFocusLoss]);
  
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleVisibilityChange, handleBlur]);
  
  return {
    switchCount: switchCountRef.current
  };
};