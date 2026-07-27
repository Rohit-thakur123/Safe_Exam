// =====================================================================================
// types.ts
// Single source of truth for the Online Exam Platform.
// -------------------------------------------------------------------------------------
// Section 1: mirrors the backend's exam.types.ts exactly (Question, Exam, ExamSession,
//            ExamResult, CodingQuestion, etc.) — do not change these shapes here, edit
//            the backend file and re-sync instead.
// Section 2: coding-execution / editor-side types that don't exist on the backend model
//            (RunResult, SubmitResult, the CodingExecutionAPI contract, component props).
// Section 3: Exam Dashboard types (MCQ/Coding status machine, dashboard props).
// =====================================================================================

// =====================================================================================
// SECTION 1 — Backend-aligned core types (from exam.types.ts)
// =====================================================================================

export type QuestionType = "mcq" | "text" | "file" | "coding" | "descriptive";
export type Difficulty = "easy" | "medium" | "hard";

// ---- Security Policy (mirrors backend exam.securityPolicy schema) ----
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
  /** Enforcement action when ANY limit is exceeded */
  action: SecurityAction;
}

/** Default policy used when the backend omits securityPolicy (fail-safe) */
export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  requireFullscreen: true,
  fullscreenExitLimit: 2,
  tabSwitchLimit: 3,
  windowBlurLimit: 3,
  copyPasteLimit: 2,
  rightClickLimit: 2,
  devToolsLimit: 1,
  networkDisconnectLimit: 5,
  idleLimitSeconds: 300,
  cameraRequired: false,
  microphoneRequired: false,
  screenSharingRequired: false,
  overallViolationLimit: 8,
  action: "TERMINATE",
};

export interface SampleTestCase {
  input: string;
  output: string;
}

export interface Question {
  id: string;
  title?: string;
  question: string;
  description?: string;
  type: QuestionType;
  options?: string[];
  marks: number;
  difficulty: Difficulty;
  category: string;
  constraints?: string | string[];
  inputFormat?: string;
  outputFormat?: string;
  explanation?: string;
  starterCode?: string | Record<string, string>;
  supportedLanguages?: string[];
  timeLimit?: number;
  memoryLimit?: number;
  visibleTestCases?: {
    order: number;
    input: string;
    expectedOutput: string;
  }[];
  hiddenTestCases?: number;
}

export interface SubjectiveQuestion {
  id: string;
  type: "descriptive";
  title: string;
  description: string;
  instructions?: string;
  maxMarks: number;
  wordLimit?: number;
  minWords?: number;
  difficulty?: Difficulty;
  category?: string;
}

export interface CodingQuestion extends Question {
  title: string;
  description: string;
  constraints: string | string[];
  inputFormat: string;
  outputFormat: string;
  explanation: string;
  supportedLanguages: string[];
  starterCode: Record<string, string>;
  timeLimit: number;
  memoryLimit: number;
  visibleTestCases: {
    order: number;
    input: string;
    expectedOutput: string;
  }[];
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
  descriptiveQuestions?: SubjectiveQuestion[];
  /** Teacher-configured security policy — always present (backend sends defaults if not set) */
  securityPolicy: SecurityPolicy;
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
  status: "in_progress" | "completed" | "expired";
  currentAnswers: Record<string, string>;
}

export interface ExamSession {
  serverTime?: string;
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
  subjectiveStatus?: 'not_applicable' | 'pending_evaluation' | 'evaluated';
  subjectiveScore?: number;
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

// =====================================================================================
// SECTION 2 — Coding execution / editor-side types (app-only, not on backend model)
// =====================================================================================

export type Verdict =
  | "Accepted"
  | "Wrong Answer"
  | "Time Limit Exceeded"
  | "Memory Limit Exceeded"
  | "Runtime Error"
  | "Compilation Error"
  | "Pending";

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime?: number;
  memoryUsed?: number;
  errorMessage?: string;
}

export interface RunResult {
  success: boolean;
  output?: string;
  stderr?: string;
  compileError?: string;
  runtimeError?: string;
  executionTime?: number;
  memoryUsed?: number;
  testCaseResults?: TestCaseResult[];
}

export interface SubmitResult {
  verdict: Verdict;
  totalTestCases: number;
  passedTestCases: number;
  score: number;
  maxScore: number;
  executionTime?: number;
  memoryUsed?: number;
  compileError?: string;
  testCaseResults?: TestCaseResult[];
}

export interface RunPayload {
  attemptId: string;
  language: string;
  sourceCode: string;
}

export interface SubmitPayload {
  attemptId: string;
  language: string;
  sourceCode: string;
}

export interface CodingExecutionAPI {
  run: (questionId: string, payload: RunPayload) => Promise<RunResult>;
  submit: (questionId: string, payload: SubmitPayload) => Promise<SubmitResult>;
}

export interface CodingAssessmentProps {
  question: Question;
  answer: string;
  onAnswerChange: (answer: string) => void;
  attemptId: string;
  /** Phase 1: examId for localStorage persistence (language, answers) */
  examId?: string;
  /** Called after a successful submit, e.g. so a parent can mark this problem as done */
  onSubmitSuccess?: (result: SubmitResult) => void;
}
// =====================================================================================
// SECTION 3 — Exam Dashboard types
// =====================================================================================

export type McqStatus = "not_started" | "in_progress" | "completed";
export type CodingStatus = "locked" | "not_started" | "in_progress" | "completed";
export type SubjectiveStatus = "locked" | "not_started" | "in_progress" | "completed";
export type SectionStatus = McqStatus | CodingStatus | SubjectiveStatus;

export interface SectionMeta {
  /** e.g. "20 questions" or "3 problems" */
  itemCountLabel: string;
  marks: number;
}

export interface ExamDashboardProps {
  companyName: string;
  examTitle: string;
  totalMarks: number;
  candidateName: string;
  candidateId: string;
  /** Seconds remaining in the overall exam window */
  timeRemainingSeconds: number;

  mcqStatus: McqStatus;
  mcqMeta: SectionMeta;
  codingStatus: CodingStatus;
  codingMeta: SectionMeta;
  subjectiveStatus?: SubjectiveStatus;
  subjectiveMeta?: SectionMeta;

  onStartMcq: () => void;
  onContinueMcq: () => void;
  onReviewMcq: () => void;

  onStartCoding: () => void;
  onContinueCoding: () => void;
  onReviewCoding: () => void;

  onStartSubjective?: () => void;
  onContinueSubjective?: () => void;
  onReviewSubjective?: () => void;

  /** Called only after the candidate confirms in the submit dialog */
  onSubmitExam: () => void;
}