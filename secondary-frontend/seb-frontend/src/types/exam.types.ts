// TypeScript interfaces for exam-related data structures

export interface Question {
  id: string;
  question: string;
  type: 'mcq' | 'text' | 'file';
  options?: string[];
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  totalQuestions: number;
  questions: Question[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  startTime: string;
  endTime: string;
  status: 'in_progress' | 'completed' | 'expired';
  currentAnswers: Record<string, string>;
}

export interface ExamSession {
  attempt: ExamAttempt;
  exam: Exam;
  student: Student;
  currentAnswers: Record<string, string>;
}

export interface ExamResult {
  attemptId: string;
  examId: string;
  studentId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  timeSpent: number; // in seconds
  submittedAt: string;
  evaluatedAt: string;
  feedback: string;
  breakdown: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
}

export interface AutoSaveStatus {
  saving: boolean;
  lastSaved: Date | null;
  error?: string;
}

export interface TimerState {
  timeRemaining: number; // in seconds
  isExpired: boolean;
  formattedTime: string;
}

export interface ExamContextType {
  examSession: ExamSession | null;
  loading: boolean;
  error: string | null;
  currentQuestionIndex: number;
  autoSaveStatus: AutoSaveStatus;
  timerState: TimerState;
  
  // Actions
  initializeExam: (examId: string, sessionToken: string) => Promise<void>;
  updateAnswer: (questionId: string, answer: string) => void;
  navigateToQuestion: (index: number) => void;
  submitExam: () => Promise<ExamResult>;
}