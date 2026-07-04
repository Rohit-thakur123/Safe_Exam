export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
}

export interface ExamAttemptSummary {
  examId: string;
  examTitle: string;
  attemptId: string;
  status: 'in_progress' | 'completed' | 'abandoned' | 'expired';
  score: number;
  percentage: number;
  passed: boolean;
  totalMarks: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface UserProfile extends User {
  isActive: boolean;
  createdAt: Date;
  examAttempts: ExamAttemptSummary[];
}

export interface Question {
  _id?: string;
  id?: string; // For compatibility
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  categoryId?: string | Category;
  createdBy?: string;
  createdAt?: Date;
}

export interface VisibleTestCase {
  input: string;
  expectedOutput: string;
  order: number;
}

export interface CodingExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface CodingQuestion {
  _id?: string;
  id?: string;
  type?: 'coding';
  title: string;
  description: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  explanation: string;
  examples?: CodingExample[];
  tags?: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  timeLimit: number;
  memoryLimit: number;
  /** Per-language starter code map: { Python: '...', Java: '...' } */
  starterCode: Record<string, string>;
  supportedLanguages: string[];
  isActive?: boolean;
  visibleTestCases?: VisibleTestCase[];
  visibleTestCaseCount?: number;
  hiddenTestCaseCount?: number;
  createdAt?: string;
}

export interface Category {
  _id?: string;
  id?: string;
  name: string;
}

export interface Exam {
  _id?: string;
  id?: string; // For compatibility
  title: string;
  description?: string;
  questions: string[]; // Array of Question IDs
  codingQuestions?: string[] | CodingQuestion[];
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  startDate?: string | Date;
  endDate?: string | Date;
  startTime?: string;
  endTime?: string;
  assignedCandidates?: Array<string | { _id?: string; id?: string }>;
  assignedStudents?: string[];
  sendEmailNotification?: boolean;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: Date;
  questionsCount?: number;
}

export type ExamQuestion =
  | (Question & { type?: 'mcq' | 'text' })
  | (CodingQuestion & { id: string; type: 'coding' });

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<string, string>;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
  startTime: Date;
  endTime?: Date;
  timeSpent?: number; // in seconds
  status: 'in_progress' | 'completed' | 'abandoned';
  createdAt?: Date;
  exam?: Omit<Exam, 'questions'> & { questions: ExamQuestion[] };
}

export interface ExamResult {
  attemptId: string;
  examTitle?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  submittedAt: Date;
  detailed_results: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  marks: number;
}

export interface ExamStatistics {
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'teacher' | 'student') => Promise<void>;
  register: (name: string, email: string, password: string, role: 'teacher' | 'student') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
