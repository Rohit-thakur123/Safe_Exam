export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
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

export type SecurityAction = "WARNING" | "AUTO_SUBMIT" | "TERMINATE";

export interface SecurityPolicy {
  requireFullscreen: boolean;
  fullscreenExitLimit: number;
  
  tabSwitchLimit: number;
  windowBlurLimit: number;
  
  copyPasteLimit: number;
  rightClickLimit: number;
  devToolsLimit: number;
  
  networkDisconnectLimit: number;
  idleLimitSeconds: number;
  
  cameraRequired: boolean;
  microphoneRequired: boolean;
  screenSharingRequired: boolean;
  
  overallViolationLimit: number;
  action: SecurityAction;
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
  descriptiveQuestions?: string[] | SubjectiveQuestion[];
  /** Optional teacher-assigned marks per MCQ question, keyed by question ID. Questions
   *  without an entry fall back to an even split of the remaining MCQ marks pool. */
  questionMarks?: Record<string, number>;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  status?: 'draft' | 'scheduled' | 'active' | 'completed' | 'evaluated' | 'results_published';
  startDate?: string | Date;
  endDate?: string | Date;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  startDateTimeUTC?: string | Date;
  endDateTimeUTC?: string | Date;
  allowLateEntry?: boolean;
  lateEntryWindowMinutes?: number;
  autoSubmit?: boolean;
  resultPublishDate?: string | Date;
  resultPublishTime?: string;
  resultPublishDateTimeUTC?: string | Date;
  resultsPublished?: boolean;
  securityPolicy?: SecurityPolicy;
  assignedCandidates?: Array<string | { _id?: string; id?: string }>;
  assignedStudents?: string[];
  sendEmailNotification?: boolean;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: Date;
  questionsCount?: number;
}

export interface SubjectiveQuestion {
  _id?: string;
  id?: string;
  type?: 'descriptive';
  title: string;
  description: string;
  instructions?: string;
  maxMarks: number;
  wordLimit?: number;
  minWords?: number;
  referenceAnswer?: string; // teacher only
  rubric?: string;          // teacher only
  teacherNotes?: string;    // teacher only
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  categoryId?: string;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface SubjectiveAnswer {
  _id: string;
  student: string | { _id: string; name: string; email: string };
  exam: string;
  question: string | SubjectiveQuestion;
  answer: string;
  wordCount: number;
  status: 'draft' | 'submitted' | 'evaluated';
  isSubmitted: boolean;
  submittedAt?: string;
  marksAwarded: number;
  feedback: string;
  evaluatedBy?: string;
  evaluatedAt?: string;
}

export type ExamQuestion =
  | (Question & { type?: 'mcq' | 'text' })
  | (CodingQuestion & { id: string; type: 'coding' })
  | (SubjectiveQuestion & { id: string; type: 'descriptive' });


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
  subjectiveStatus?: 'not_applicable' | 'pending_evaluation' | 'evaluated';
  subjectiveScore?: number;
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
  subjectiveStatus?: 'not_applicable' | 'pending_evaluation' | 'evaluated';
  subjectiveScore?: number;
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