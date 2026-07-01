import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send } from 'lucide-react';
import type { CodingQuestion } from '../../types';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { codingExecutionAPI } from '../../services/api';

interface CodingAnswer {
  language: string;
  code: string;
}

interface CodingAssessmentProps {
  question: CodingQuestion & { id: string };
  answer: string;
  onAnswerChange: (answer: string) => void;
  attemptId: string;
}

const languageIds: Record<string, string> = {
  Python: 'python',
  Java: 'java',
  JavaScript: 'javascript',
  C: 'c',
  'C++': 'cpp'
};

const parseAnswer = (answer: string, question: CodingQuestion): CodingAnswer => {
  if (answer) {
    try {
      const parsed = JSON.parse(answer) as CodingAnswer;
      if (parsed.language && typeof parsed.code === 'string') return parsed;
    } catch {
      // Older plain-text drafts remain usable as code.
      return { language: question.supportedLanguages[0] || 'Python', code: answer };
    }
  }
  return {
    language: question.supportedLanguages[0] || 'Python',
    code: question.starterCode
  };
};

interface RunResult {
  order: number;
  passed: boolean;
  stdout: string;
  stderr: string;
  compileError: string;
  executionTimeMs: number;
  memoryUsageBytes: number;
  timedOut: boolean;
}

const CodingAssessment: React.FC<CodingAssessmentProps> = ({ question, answer, onAnswerChange, attemptId }) => {
  const initialAnswer = parseAnswer(answer, question);
  const [language, setLanguage] = useState(initialAnswer.language);
  const [code, setCode] = useState(initialAnswer.code);
  const [consoleMessage, setConsoleMessage] = useState('Run executes visible samples. Submit Code evaluates hidden testcases.');
  const [runResults, setRunResults] = useState<RunResult[]>([]);
  const [submissionResult, setSubmissionResult] = useState<{
    passedTestCases: number;
    totalTestCases: number;
    score: number;
    totalMarks: number;
    executionTime: number;
    memoryUsage: number;
  } | null>(null);
  const [executing, setExecuting] = useState<'run' | 'submit' | null>(null);

  const saveDraft = (nextLanguage: string, nextCode: string) => {
    onAnswerChange(JSON.stringify({ language: nextLanguage, code: nextCode }));
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);
    saveDraft(nextLanguage, code);
  };

  const handleCodeChange = (value?: string) => {
    const nextCode = value || '';
    setCode(nextCode);
    saveDraft(language, nextCode);
  };

  const handleRun = async () => {
    saveDraft(language, code);
    setExecuting('run');
    setSubmissionResult(null);
    try {
      const response = await codingExecutionAPI.run(question.id, {
        attemptId,
        language,
        sourceCode: code
      });
      setRunResults(response.results || []);
      setConsoleMessage('Visible testcases executed successfully.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      setConsoleMessage(message || 'Unable to execute code.');
      setRunResults([]);
    } finally {
      setExecuting(null);
    }
  };

  const handleSubmitCode = async () => {
    saveDraft(language, code);
    setExecuting('submit');
    try {
      const response = await codingExecutionAPI.submit(question.id, {
        attemptId,
        language,
        sourceCode: code
      });
      setSubmissionResult(response.submission);
      setConsoleMessage('Hidden testcases evaluated and submission stored.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      setConsoleMessage(message || 'Unable to submit code.');
      setSubmissionResult(null);
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(480px,1.25fr)]">
      <Card className="h-fit">
        <CardContent className="space-y-5 p-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-700">{question.difficulty}</span>
              <span className="text-gray-500">{question.marks} marks</span>
              <span className="text-gray-500">{question.timeLimit}s · {question.memoryLimit}MB</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{question.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{question.description}</p>
          </div>

          {[
            ['Constraints', question.constraints],
            ['Input Format', question.inputFormat],
            ['Output Format', question.outputFormat],
            ['Explanation', question.explanation]
          ].map(([label, content]) => (
            <section key={label}>
              <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">{content}</p>
            </section>
          ))}

          <section>
            <h3 className="text-sm font-semibold text-gray-900">Visible sample test cases</h3>
            <div className="mt-2 space-y-3">
              {question.visibleTestCases?.length ? question.visibleTestCases.map((testCase, index) => (
                <div key={`${testCase.order}-${index}`} className="grid gap-3 rounded-lg border bg-gray-50 p-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Input</p>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-sm text-gray-800">{testCase.input}</pre>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Expected output</p>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-sm text-gray-800">{testCase.expectedOutput}</pre>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500">No visible samples were provided.</p>}
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-4">
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                Language
                <select value={language} onChange={handleLanguageChange} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  {question.supportedLanguages.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleRun} disabled={executing !== null}>
                  <Play className="mr-2 h-4 w-4" /> {executing === 'run' ? 'Running...' : 'Run'}
                </Button>
                <Button type="button" onClick={handleSubmitCode} disabled={executing !== null}>
                  <Send className="mr-2 h-4 w-4" /> {executing === 'submit' ? 'Submitting...' : 'Submit Code'}
                </Button>
              </div>
            </div>
            <Editor
              height="520px"
              language={languageIds[language] || 'plaintext'}
              value={code}
              theme="vs-dark"
              onChange={handleCodeChange}
              loading={<div className="flex h-[520px] items-center justify-center bg-gray-900 text-gray-300">Loading editor...</div>}
              options={{
                minimap: { enabled: false },
                quickSuggestions: false,
                suggestOnTriggerCharacters: false,
                wordBasedSuggestions: 'off',
                parameterHints: { enabled: false },
                tabCompletion: 'off',
                formatOnPaste: false,
                formatOnType: false,
                automaticLayout: true,
                fontSize: 14,
                scrollBeyondLastLine: false
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-900">Console</h3>
            <div className="mt-2 min-h-28 rounded-md bg-gray-950 p-3 font-mono text-sm text-gray-300">
              {consoleMessage}
              {runResults.map(result => (
                <div key={result.order} className={`mt-3 border-t border-gray-700 pt-2 ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                  <p>Sample {result.order + 1}: {result.passed ? 'Passed' : 'Failed'}</p>
                  {result.compileError && <pre className="whitespace-pre-wrap">Compilation: {result.compileError}</pre>}
                  {result.stderr && <pre className="whitespace-pre-wrap">Error: {result.stderr}</pre>}
                  {result.stdout && <pre className="whitespace-pre-wrap text-gray-200">Output: {result.stdout}</pre>}
                  <p className="text-gray-400">{result.executionTimeMs} ms · {Math.ceil(result.memoryUsageBytes / 1024)} KB{result.timedOut ? ' · Timed out' : ''}</p>
                </div>
              ))}
              {submissionResult && (
                <div className="mt-3 border-t border-gray-700 pt-2 text-green-400">
                  <p>Passed {submissionResult.passedTestCases} / {submissionResult.totalTestCases}</p>
                  <p>Score: {submissionResult.score} / {submissionResult.totalMarks}</p>
                  <p>{submissionResult.executionTime} ms · {Math.ceil(submissionResult.memoryUsage / 1024)} KB</p>
                </div>
              )}
            </div>
            <div className="mt-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-2 lg:grid-cols-4">
              <span>Compilation errors: —</span>
              <span>Runtime errors: —</span>
              <span>Execution time: —</span>
              <span>Memory usage: —</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CodingAssessment;
