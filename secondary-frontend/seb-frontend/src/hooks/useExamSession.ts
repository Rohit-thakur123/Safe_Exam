// Custom hook for managing exam session state
import { useState, useCallback } from 'react';
import { startExamSession, submitExam as apiSubmitExam } from '../services/examService';
import { StorageService } from '../services/storageService';
import type { ExamSession, ExamResult } from '../types/exam.types';

interface UseExamSessionReturn {
  examSession: ExamSession | null;
  loading: boolean;
  error: string | null;
  initializeExam: (examId: string, sessionToken: string) => Promise<void>;
  updateAnswer: (questionId: string, answer: string) => void;
  submitExam: () => Promise<ExamResult>;
}

export const useExamSession = (): UseExamSessionReturn => {
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const initializeExam = useCallback(async (examId: string, sessionToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const session = await startExamSession(examId, sessionToken);
      
      // Load previously saved answers from localStorage
      const savedAnswers = StorageService.loadAnswers(session.attempt.examId);
      if (savedAnswers && Object.keys(savedAnswers).length > 0) {
        session.currentAnswers = { ...session.currentAnswers, ...savedAnswers };
      }
      
      setExamSession(session);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const updateAnswer = useCallback((questionId: string, answer: string) => {
    setExamSession((prev) => {
      if (!prev) return prev;
      
      const updatedAnswers = {
        ...prev.currentAnswers,
        [questionId]: answer
      };
      
      // Save to localStorage immediately for crash recovery
      StorageService.saveAnswers(prev.attempt.examId, updatedAnswers);
      
      return {
        ...prev,
        currentAnswers: updatedAnswers
      };
    });
  }, []);
  
  const submitExam = useCallback(async (): Promise<ExamResult> => {
    if (!examSession) {
      throw new Error('No active exam session');
    }
    
    const timeSpent = Math.floor(
      (new Date().getTime() - new Date(examSession.attempt.startTime).getTime()) / 1000
    );
    
    const result = await apiSubmitExam(
      examSession.attempt.id,
      examSession.currentAnswers,
      timeSpent
    );
    
    // Clear exam data after successful submission
    StorageService.clearExamData(examSession.attempt.examId);
    
    return result;
  }, [examSession]);
  
  return {
    examSession,
    loading,
    error,
    initializeExam,
    updateAnswer,
    submitExam
  };
};