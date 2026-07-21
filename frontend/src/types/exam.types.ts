export type CodingAssessmentProps = {
  question: {
    title?: string;
    starterCode?: string | Record<string, string> | null;
    supportedLanguages?: string[];
    [key: string]: any;
  } | null;
  answer?: string | null;
  onAnswerChange?: (answer: string) => void;
  attemptId?: string | number | null;
};

export type CodingQuestion = {
  title: string;
  starterCode: Record<string, string>;
  supportedLanguages: string[];
  [key: string]: any;
};

export type RunResult = {
  success: boolean;
  output?: string;
  stderr?: string;
  compileError?: string;
  runtimeError?: string;
  executionTime?: number;
  memoryUsed?: number;
  testCaseResults?: TestCaseResult[];
  [key: string]: any;
};

export type SubmitResult = {
  verdict: Verdict;
  passed: boolean;
  score: number;
  maxScore: number;
  totalTestCases: number;
  passedTestCases: number;
  executionTime?: number;
  memoryUsed?: number;
  compileError?: string;
  testCaseResults?: TestCaseResult[];
  [key: string]: any;
};

// =======================================================
// Shared Question Types
// =======================================================

export type QuestionType =
  | "mcq"
  | "text"
  | "descriptive"
  | "file"
  | "coding";

export type Difficulty = "easy" | "medium" | "hard";

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

  // Descriptive Question Support
  maxWords?: number;
  maxCharacters?: number;
  placeholder?: string;

  visibleTestCases?: {
    order: number;
    input: string;
    expectedOutput: string;
  }[];

  hiddenTestCases?: number;
}

// =======================================================
// Coding Types
// =======================================================

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

// =======================================================
// Dashboard Status
// =======================================================

export type McqStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export type CodingStatus =
  | "locked"
  | "not_started"
  | "in_progress"
  | "completed";

export type DescriptiveStatus =
  | "locked"
  | "not_started"
  | "in_progress"
  | "completed";

export type SectionStatus =
  | McqStatus
  | CodingStatus
  | DescriptiveStatus;

// =======================================================
// Dashboard Meta
// =======================================================

export interface SectionMeta {
  itemCountLabel: string;
  marks: number;
}

// =======================================================
// Dashboard Props
// =======================================================

export interface ExamDashboardProps {
  companyName: string;
  examTitle: string;
  totalMarks: number;

  candidateName: string;
  candidateId: string;

  timeRemainingSeconds: number;

  // MCQ
  mcqStatus: McqStatus;
  mcqMeta: SectionMeta;

  // Coding
  codingStatus: CodingStatus;
  codingMeta: SectionMeta;

  // Descriptive
  descriptiveStatus: DescriptiveStatus;
  descriptiveMeta: SectionMeta;

  // MCQ Actions
  onStartMcq: () => void;
  onContinueMcq: () => void;
  onReviewMcq: () => void;

  // Coding Actions
  onStartCoding: () => void;
  onContinueCoding: () => void;
  onReviewCoding: () => void;

  // Descriptive Actions
  onStartDescriptive: () => void;
  onContinueDescriptive: () => void;
  onReviewDescriptive: () => void;

  // Submit
  onSubmitExam: () => void;
}