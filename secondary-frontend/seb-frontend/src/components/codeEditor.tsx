// =====================================================================================
// codeEditor.tsx
// Top-level orchestrator: responsive 2-column layout, state management, API integration.
// -------------------------------------------------------------------------------------
// NOTE: `CodingAssessmentProps["question"]` is typed as the loose `Question` upstream
// (title/starterCode/supportedLanguages/etc. all optional), but QuestionPanel and
// EditorPanel require the strict `CodingQuestion`. `normalizeCodingQuestion` below
// fills every optional field with a safe default exactly once, so nothing downstream
// has to deal with `undefined` or the `string | Record<string,string>` union again.
// =====================================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, X, Sparkles } from "lucide-react";
import QuestionPanel from "./exam/QuestionPanel";
import EditorPanel from "./exam/EditorPanel";
import ConsolePanel from "./exam/ConsolePanel";
import type {
  CodingAssessmentProps,
  CodingQuestion,
  RunResult,
  SubmitResult,
} from "../types/exam.types";
import { compilerAPI, codingExecutionAPI } from "../services/api";

type SaveStatus = "idle" | "saving" | "saved";

const AUTO_SAVE_DEBOUNCE_MS = 600;
const DEFAULT_LANGUAGE_FALLBACK = "javascript";

/**
 * Fills in every field that's optional on `Question` but required on `CodingQuestion`,
 * so the rest of the component (and QuestionPanel/EditorPanel) can rely on a fully
 * populated shape instead of guarding against `undefined` at every use site.
 */
const normalizeCodingQuestion = (
  question: CodingAssessmentProps["question"]
): CodingQuestion => {
  const starterCode: Record<string, string> =
    typeof question.starterCode === "object" && question.starterCode !== null
      ? question.starterCode
      : {};

  const supportedLanguages =
    question.supportedLanguages && question.supportedLanguages.length > 0
      ? question.supportedLanguages
      : [DEFAULT_LANGUAGE_FALLBACK];

  return {
    ...question,
    title: question.title ?? "Untitled Problem",
    description: question.description ?? "",
    constraints: question.constraints ?? "",
    inputFormat: question.inputFormat ?? "",
    outputFormat: question.outputFormat ?? "",
    explanation: question.explanation ?? "",
    supportedLanguages,
    starterCode,
    timeLimit: question.timeLimit ?? 5,
    memoryLimit: question.memoryLimit ?? 256,
    visibleTestCases: question.visibleTestCases ?? [],
  };
};

const codeEditor: React.FC<CodingAssessmentProps> = ({
  question: rawQuestion,
  answer,
  onAnswerChange,
  attemptId,
  onSubmitSuccess,
}) => {
  // Normalize once per incoming question; every reference below uses this,
  // never `rawQuestion` directly.
  const question = useMemo(() => normalizeCodingQuestion(rawQuestion), [rawQuestion]);

  const defaultLanguage = question.supportedLanguages[0] ?? DEFAULT_LANGUAGE_FALLBACK;

  // Per-language code cache kept in-memory for the session so switching languages
  // back and forth does not discard work, even though only one `answer` string
  // is persisted upstream at any given time.
  const codeCacheRef = useRef<Record<string, string>>({
    ...question.starterCode,
    [defaultLanguage]: answer?.trim() ? answer : question.starterCode[defaultLanguage] ?? "",
  });

  const [language, setLanguage] = useState<string>(defaultLanguage);
  const [sourceCode, setSourceCode] = useState<string>(
    codeCacheRef.current[defaultLanguage] ?? ""
  );
  const [customInput, setCustomInput] = useState<string>("");

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const saveTimeoutRef = useRef<number | null>(null);

  // ---- Auto-save draft (debounced) --------------------------------------------------
  useEffect(() => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      onAnswerChange(sourceCode);
      setSaveStatus("saved");
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceCode]);

  // ---- Handlers ----------------------------------------------------------------------
  const handleCodeChange = useCallback(
    (code: string) => {
      setSourceCode(code);
      codeCacheRef.current[language] = code;
    },
    [language]
  );

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      if (newLanguage === language) return;
      // Persist current buffer for this language before switching away.
      codeCacheRef.current[language] = sourceCode;

      const cached = codeCacheRef.current[newLanguage];
      const nextCode = cached ?? question.starterCode[newLanguage] ?? "";
      codeCacheRef.current[newLanguage] = nextCode;

      setLanguage(newLanguage);
      setSourceCode(nextCode);
      setRunResult(null);
      setSubmitResult(null);
      setApiError(null);
    },
    [language, sourceCode, question.starterCode]
  );

  const handleReset = useCallback(() => {
    const starter = question.starterCode[language] ?? "";
    codeCacheRef.current[language] = starter;
    setSourceCode(starter);
    setRunResult(null);
    setSubmitResult(null);
    setApiError(null);
  }, [language, question.starterCode]);

  const handleRun = useCallback(async () => {
    if (isRunning || isSubmitting) return;

    setIsRunning(true);
    setApiError(null);
    setRunResult(null);

    try {
      const result = await compilerAPI.execute({
        language,
        code: sourceCode,
        input: customInput,
      });

      setRunResult({
        success: result.success,
        output: result.output,
        compileError:
          result.type === "Compilation Error" ? result.message : undefined,
        runtimeError: result.type === "Runtime Error" ? result.message : undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to connect to compiler.";
      setApiError(message);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, isSubmitting, language, sourceCode, customInput]);

  const handleSubmit = useCallback(async () => {
    if (isRunning || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    setSubmitResult(null);

    try {
      const data = await codingExecutionAPI.submit(question.id, {
        attemptId,
        language,
        sourceCode,
      });

      const submission = data.submission;
      const allPassed = submission.failedTestCases === 0;

      const result: SubmitResult = {
        verdict: allPassed ? "Accepted" : "Wrong Answer",
        totalTestCases: submission.totalTestCases,
        passedTestCases: submission.passedTestCases,
        score: submission.score,
        maxScore: submission.totalMarks,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsage,
      };

      setSubmitResult(result);
      onSubmitSuccess?.(result);
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        (error instanceof Error ? error.message : "Failed to submit solution.");
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [isRunning, isSubmitting, attemptId, question.id, language, sourceCode, onSubmitSuccess]);

  // Keep the "Submission" tab useful by switching focus there implicitly via ConsolePanel
  // state; no extra wiring required since ConsolePanel manages its own active tab.

  const marksLabel = useMemo(
    () => `${question.marks} ${question.marks === 1 ? "mark" : "marks"}`,
    [question.marks]
  );

  return (
    <div className="h-full w-full bg-[#08080c] text-slate-100 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0a0f]">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-slate-200">
            {question.title}
          </span>
          <span className="hidden sm:inline text-xs text-slate-500">
            · {marksLabel}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {apiError && (
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-rose-500/10 border-b border-rose-400/20 text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            className="text-rose-300 hover:text-rose-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main responsive layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(320px,420px)_1fr] gap-4 p-4">
        {/* Left: Question panel */}
        <div className="min-h-[280px] lg:min-h-0 rounded-2xl border border-white/10 bg-[#0a0a0f] shadow-xl overflow-hidden">
          <QuestionPanel question={question} />
        </div>

        {/* Right: Editor + Console */}
        <div className="min-h-0 flex flex-col gap-4">
          <div className="flex-[3] min-h-[280px]">
            <EditorPanel
              supportedLanguages={question.supportedLanguages}
              language={language}
              sourceCode={sourceCode}
              onLanguageChange={handleLanguageChange}
              onCodeChange={handleCodeChange}
              onRun={handleRun}
              onSubmit={handleSubmit}
              onReset={handleReset}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              saveStatus={saveStatus}
            />
          </div>
          <div className="flex-[2] min-h-[220px]">
            <ConsolePanel
              customInput={customInput}
              onCustomInputChange={setCustomInput}
              runResult={runResult}
              submitResult={submitResult}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default codeEditor;