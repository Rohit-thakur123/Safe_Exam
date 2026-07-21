// TypeScript interfaces for API requests and responses

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface StartExamRequest {
  examId: string;
}

export interface StartExamResponse extends ApiResponse {
  serverTime?: string;
  attempt: {
    id: string;
    examId: string;
    studentId: string;
    startTime: string;
    endTime: string;
    status: string;
    currentAnswers: Record<string, string>;
    exam: {
      title: string;
      description: string;
      duration: number;
      totalMarks: number;
      passingMarks: number;
      totalQuestions: number;
      questions: Array<{
        id: string;
        question: string;
        type: string;
        options?: string[];
        marks: number;
        difficulty: string;
        category: string;
      }>;
    };
    student: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface SaveAnswersRequest {
  attemptId: string;
  answers: Record<string, string>;
  lastSavedAt: string;
}

export interface SaveAnswersResponse extends ApiResponse {
  data: {
    savedAt: string;
    answersCount: number;
    attemptId: string;
  };
}

export interface SubmitExamRequest {
  attemptId: string;
  answers: Record<string, string>;
  timeSpent: number;
  submittedAt: string;
}

export interface SubmitExamResponse extends ApiResponse {
  result: {
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
    timeSpent: number;
    submittedAt: string;
    evaluatedAt: string;
    feedback: string;
    breakdown: {
      easy: { correct: number; total: number };
      medium: { correct: number; total: number };
      hard: { correct: number; total: number };
    };
  };
}

export interface HeartbeatRequest {
  attemptId: string;
  timestamp: string;
}

export interface HeartbeatResponse extends ApiResponse {
  data: {
    sessionActive: boolean;
    timeRemaining: number;
    serverTime: string;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}