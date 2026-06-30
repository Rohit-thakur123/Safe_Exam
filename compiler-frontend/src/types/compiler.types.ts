export type Language = 'python' | 'javascript' | 'java' | 'c' | 'cpp';

export interface CompilerRequest {
  language: Language;
  code: string;
  stdin: string;
}

export interface CompilerResponse {
  status: 'success' | 'error';
  data: {
    stdout: string;
    stderr: string;
    compileError?: string | null;
    exitCode: number;
    executionTimeMs: number;
    memoryUsageBytes: number;
  };
}
