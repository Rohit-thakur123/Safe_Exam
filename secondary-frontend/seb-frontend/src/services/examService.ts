// API service functions for exam operations
import { apiClient } from './api';
import type {
  ExamSession,
  ExamResult
} from '../types/exam.types';
import type {
  StartExamRequest,
  StartExamResponse,
  SaveAnswersRequest,
  SaveAnswersResponse,
  SubmitExamRequest,
  SubmitExamResponse,
  HeartbeatRequest,
  HeartbeatResponse
} from '../types/api.types';

/**
 * Start a new exam session with the provided session token
 */
export const startExamSession = async (
  examId: string,
  sessionToken: string
): Promise<ExamSession> => {
  try {
    // Store token in localStorage for subsequent requests
    localStorage.setItem('seb_session_token', sessionToken);

    const request: StartExamRequest = { examId };
    const response = await apiClient.post<StartExamResponse>('/api/exam-attempt/start-seb', request);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to start exam');
    }

    const attemptData = response.data.attempt;

    return {
      attempt: {
        id: attemptData.id,
        examId: attemptData.examId,
        studentId: attemptData.studentId,
        startTime: attemptData.startTime,
        endTime: attemptData.endTime,
        status: attemptData.status as 'in_progress' | 'completed' | 'expired',
        currentAnswers: attemptData.currentAnswers
      },
      exam: {
        id: attemptData.exam.title,
        title: attemptData.exam.title,
        description: attemptData.exam.description,
        duration: attemptData.exam.duration,
        totalMarks: attemptData.exam.totalMarks,
        passingMarks: attemptData.exam.passingMarks,
        totalQuestions: attemptData.exam.totalQuestions,
        questions: attemptData.exam.questions.map((q: any) => ({
          id: q.id,
          title: q.title,
          question: q.question || q.description || "",
          description: q.description,
          type: q.type,
          options: q.options || [],
          marks: q.marks,
          difficulty: q.difficulty,
          category: q.category,

          constraints: q.constraints,

          inputFormat: q.inputFormat,

          outputFormat: q.outputFormat,

          explanation: q.explanation,

          starterCode: q.starterCode,

          supportedLanguages: q.supportedLanguages || [],

          timeLimit: q.timeLimit,

          memoryLimit: q.memoryLimit,

          visibleTestCases: q.visibleTestCases || []
        }))
      },
      student: {
        id: attemptData.student.id,
        name: attemptData.student.name,
        email: attemptData.student.email
      },
      currentAnswers: attemptData.currentAnswers
    };
  } catch (error: any) {
    console.error('Error starting exam:', error);
    throw new Error(
      error.response?.data?.error ||
      error.message ||
      'Failed to start exam session'
    );
  }
};

/**
 * Auto-save answers to the server
 */
export const saveAnswers = async (
  attemptId: string,
  answers: Record<string, string>
): Promise<void> => {
  try {
    const request: SaveAnswersRequest = {
      attemptId,
      answers,
      lastSavedAt: new Date().toISOString()
    };

    await apiClient.patch<SaveAnswersResponse>('/api/exam-attempt/save-answers', request);
  } catch (error) {
    console.error('Auto-save failed:', error);
    // Don't throw - auto-save should fail silently and retry
  }
};

/**
 * Submit the exam for final evaluation
 */
export const submitExam = async (
  attemptId: string,
  answers: Record<string, string>,
  timeSpent: number
): Promise<ExamResult> => {
  try {
    const request: SubmitExamRequest = {
      attemptId,
      answers,
      timeSpent,
      submittedAt: new Date().toISOString()
    };

    const response = await apiClient.post<SubmitExamResponse>('/api/exam-attempt/submit-seb', request);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to submit exam');
    }

    // Clear session data after successful submission
    localStorage.removeItem('seb_session_token');
    localStorage.removeItem(`exam_${attemptId}_answers`);

    return response.data.result;
  } catch (error: any) {
    console.error('Error submitting exam:', error);
    throw new Error(
      error.response?.data?.error ||
      error.message ||
      'Failed to submit exam'
    );
  }
};

/**
 * Send heartbeat to keep session alive
 */
export const sendHeartbeat = async (attemptId: string): Promise<void> => {
  try {
    const request: HeartbeatRequest = {
      attemptId,
      timestamp: new Date().toISOString()
    };

    await apiClient.post<HeartbeatResponse>('/api/exam-attempt/heartbeat', request);
  } catch (error) {
    console.error('Heartbeat failed:', error);
    // Don't throw - heartbeat failures should be logged but not break the app
  }
};