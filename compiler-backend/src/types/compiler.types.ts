export type Language = 'python' | 'javascript' | 'java' | 'c' | 'cpp';

export interface ExecutionRequest {
  language: Language;
  code: string;
  stdin?: string;
}

export interface LanguageConfig {
  image: string;
  fileName: string;
  command: string[];
  extension: string;
  compileCommand?: string[];
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  compileError?: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsageBytes: number;
}
