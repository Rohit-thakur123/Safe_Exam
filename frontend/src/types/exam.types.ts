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
  [key: string]: any;
};

export type SubmitResult = {
  passed: boolean;
  score?: number;
  [key: string]: any;
};