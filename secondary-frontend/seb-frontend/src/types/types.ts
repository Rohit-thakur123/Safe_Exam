// =====================================================================================
// types.ts
// Shared type definitions for the Online Coding Assessment Platform.
// -------------------------------------------------------------------------------------
// NOTE: `CodingQuestion` below reflects the fields explicitly listed in the spec.
// If your actual backend model lives elsewhere, just point the imports in the other
// files at your existing type instead of this one — nothing here mutates your backend.
// =====================================================================================

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface SampleTestCase {
  input: string;
  output: string;
  explanation?: string;
}

export interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  marks: number;
  /** Time limit in seconds */
  timeLimit: number;
  /** Memory limit in MB */
  memoryLimit: number;
  /** Map of language identifier -> starter source code */
  starterCode: Record<string, string>;
  constraints: string[];
  inputFormat: string;
  outputFormat: string;
  supportedLanguages: string[];
  visibleTestCases: SampleTestCase[];
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
  customInput?: string;
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
  question: CodingQuestion;
  answer: string;
  onAnswerChange: (answer: string) => void;
  attemptId: string;
}