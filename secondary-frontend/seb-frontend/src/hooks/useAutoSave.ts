// Custom hook for auto-saving exam answers
// Phase 4: sendBeacon now puts token in the request body (Blob), never in the URL.
import { useEffect, useRef, useState, useCallback } from 'react';
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

  // Use a ref for answers to avoid stale closures in the interval callback
  const answersRef = useRef<Record<string, string>>(answers);
  const previousAnswersRef = useRef<Record<string, string>>({});
  const attemptIdRef = useRef<string | null>(attemptId);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);

  const doSave = useCallback(async () => {
    const currentAnswers = answersRef.current;
    const currentAttemptId = attemptIdRef.current;

    if (!currentAttemptId || Object.keys(currentAnswers).length === 0) return;

    const hasChanges = JSON.stringify(currentAnswers) !== JSON.stringify(previousAnswersRef.current);
    if (!hasChanges) return;

    setSaving(true);
    setError(null);

    try {
      await saveAnswers(currentAttemptId, currentAnswers);
      previousAnswersRef.current = { ...currentAnswers };
      setLastSaved(new Date());
    } catch (err: any) {
      setError(err.message || 'Auto-save failed');
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !attemptId) return;

    const autoSaveInterval = setInterval(doSave, interval);

    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [enabled, attemptId, interval, doSave]);

  // Phase 4: Save on unmount via sendBeacon — token in body, NOT in URL
  useEffect(() => {
    return () => {
      const currentAnswers = answersRef.current;
      const currentAttemptId = attemptIdRef.current;
      if (!currentAttemptId || Object.keys(currentAnswers).length === 0) return;

      const hasChanges = JSON.stringify(currentAnswers) !== JSON.stringify(previousAnswersRef.current);
      if (!hasChanges) return;

      if (navigator.sendBeacon) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const token = localStorage.getItem('seb_session_token') || '';
        const url = `${baseUrl}/api/exam-attempts/save-answers`;

        // Token goes in the body as JSON — never in the URL query string
        const data = JSON.stringify({
          attemptId: currentAttemptId,
          answers: currentAnswers,
          token,
          lastSavedAt: new Date().toISOString()
        });

        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      }
    };
  }, []); // Empty deps: only runs on component unmount

  return { saving, lastSaved, error };
};