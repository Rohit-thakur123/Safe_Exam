// Custom hook for auto-saving exam answers
import { useEffect, useRef, useState } from 'react';
import { saveAnswers } from '../services/examService';

interface UseAutoSaveOptions {
  attemptId: string | null;
  answers: Record<string, string>;
  enabled: boolean;
  interval?: number;
}

interface UseAutoSaveReturn {
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export const useAutoSave = ({
  attemptId,
  answers,
  enabled,
  interval = parseInt(import.meta.env.VITE_AUTOSAVE_INTERVAL) || 30000 // Default 30 seconds
}: UseAutoSaveOptions): UseAutoSaveReturn => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousAnswers = useRef<Record<string, string>>({});
  const saveTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  useEffect(() => {
    if (!enabled || !attemptId) return;
    
    const autoSaveInterval = setInterval(async () => {
      const hasChanges = JSON.stringify(answers) !== JSON.stringify(previousAnswers.current);
      
      if (hasChanges && Object.keys(answers).length > 0) {
        setSaving(true);
        setError(null);
        
        try {
          await saveAnswers(attemptId, answers);
          previousAnswers.current = { ...answers };
          setLastSaved(new Date());
        } catch (err: any) {
          console.error('Auto-save failed:', err);
          setError(err.message || 'Auto-save failed');
        } finally {
          setSaving(false);
        }
      }
    }, interval);
    
    // Cleanup
    return () => {
      clearInterval(autoSaveInterval);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [attemptId, answers, enabled, interval]);
  
  // Save immediately on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (attemptId && Object.keys(answers).length > 0) {
        const hasChanges = JSON.stringify(answers) !== JSON.stringify(previousAnswers.current);
        if (hasChanges) {
          // Use sendBeacon for guaranteed delivery on page unload
          const data = JSON.stringify({
            attemptId,
            answers,
            lastSavedAt: new Date().toISOString()
          });
          
          const blob = new Blob([data], { type: 'application/json' });
          
          
          if (navigator.sendBeacon) {
            const url = `${import.meta.env.VITE_API_BASE_URL}/api/exam-attempts/save-answers`;
            navigator.sendBeacon(url, blob);
          }
        }
      }
    };
  }, [attemptId, answers]);
  
  return { saving, lastSaved, error };
};