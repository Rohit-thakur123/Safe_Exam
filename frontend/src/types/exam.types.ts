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

// ---- Shared UI types used by exam components ----

export type QuestionType = "mcq" | "text" | "file" | "coding";
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
  visibleTestCases?: {
    order: number;
    input: string;
    expectedOutput: string;
  }[];
  hiddenTestCases?: number;
}

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

// ---- Exam Dashboard types ----

export type McqStatus = "not_started" | "in_progress" | "completed";
export type CodingStatus = "locked" | "not_started" | "in_progress" | "completed";
export type SectionStatus = McqStatus | CodingStatus;

export interface SectionMeta {
  itemCountLabel: string;
  marks: number;
}

export interface ExamDashboardProps {
  companyName: string;
  examTitle: string;
  totalMarks: number;
  candidateName: string;
  candidateId: string;
  timeRemainingSeconds: number;
  mcqStatus: McqStatus;
  mcqMeta: SectionMeta;
  codingStatus: CodingStatus;
  codingMeta: SectionMeta;
  onStartMcq: () => void;
  onContinueMcq: () => void;
  onReviewMcq: () => void;
  onStartCoding: () => void;
  onContinueCoding: () => void;
  onReviewCoding: () => void;
  onSubmitExam: () => void;
}