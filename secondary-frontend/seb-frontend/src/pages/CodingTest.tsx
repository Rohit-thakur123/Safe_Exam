// =====================================================================================
// CodingTest.tsx
// Multi-problem coding section: left-side problem pills for navigation, per-problem
// code + submitted-state kept in memory AND in localStorage (Phase 1 persistence).
// Phase 3: Confirmation dialog before leaving and before finishing.
// =====================================================================================

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, ChevronLeft, AlertCircle } from "lucide-react";
import CodeEditor from "../components/codeEditor";
import type { CodingQuestion, SubmitResult } from "../types/exam.types";
import { StorageService } from "../services/storageService";

interface CodingTestProps {
  questions: CodingQuestion[];
  attemptId: string;
  examId: string;
  onFinish: () => void;
}

export default function CodingTest({ questions, attemptId, examId, onFinish }: CodingTestProps) {
  // Phase 1: Restore state from localStorage on mount
  const [currentProblemIndex, setCurrentProblemIndexRaw] = useState(() =>
    StorageService.loadCodingProblemIndex(examId)
  );
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    StorageService.loadCodingAnswers(examId)
  );
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  // Phase 3: Confirmation state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const setCurrentProblemIndex = useCallback((idx: number) => {
    setCurrentProblemIndexRaw(idx);
    StorageService.saveCodingProblemIndex(examId, idx);
  }, [examId]);

  if (questions.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#08080c] text-slate-300">
        <div className="text-center">
          <p className="mb-4">No coding problems in this exam.</p>
          <button
            type="button"
            onClick={onFinish}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentProblemIndex];
  const submittedCount = Object.values(submitted).filter(Boolean).length;
  const canFinish = submittedCount > 0;
  const unsubmittedCount = questions.length - submittedCount;

  const handleAnswerChange = (answer: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [currentQuestion.id]: answer };
      StorageService.saveCodingAnswers(examId, next); // Phase 1: persist immediately
      return next;
    });
  };

  const handleSubmitSuccess = (_result: SubmitResult) => {
    setSubmitted((prev) => ({ ...prev, [currentQuestion.id]: true }));
  };

  // Phase 3: Leave section confirmation
  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    onFinish();
  };

  const cancelLeave = () => {
    setShowLeaveConfirm(false);
  };

  // Phase 3: Finish coding confirmation
  const handleFinishClick = () => {
    setShowFinishConfirm(true);
  };

  const confirmFinish = () => {
    setShowFinishConfirm(false);
    onFinish();
  };

  const cancelFinish = () => {
    setShowFinishConfirm(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#08080c]">
      {/* Phase 3: Leave Section Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#15151d] border border-white/10 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-slate-100 mb-1">Leave Coding Section?</h2>
                <p className="text-sm text-slate-400">
                  Your code drafts are saved. You can return to this section from the dashboard before final submission.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelLeave}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.08] transition-colors"
              >
                Stay Here
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 3: Finish Coding Modal */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#15151d] border border-white/10 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-slate-100 mb-1">Finish Coding?</h2>
                {unsubmittedCount > 0 ? (
                  <p className="text-sm text-amber-400">
                    Warning: {unsubmittedCount} problem{unsubmittedCount > 1 ? 's' : ''} not submitted yet. You will return to the dashboard but can come back.
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">
                    All {questions.length} problem{questions.length > 1 ? 's' : ''} submitted. You will return to the dashboard for final exam submission.
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelFinish}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.08] transition-colors"
              >
                Keep Coding
              </button>
              <button
                type="button"
                onClick={confirmFinish}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                Finish Coding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar: back + problem pills */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-white/10 bg-[#0a0a0f] overflow-x-auto shrink-0">
        <button
          type="button"
          onClick={handleLeaveClick}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
          Dashboard
        </button>

        <div className="h-5 w-px bg-white/10 shrink-0" />

        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {questions.map((q, index) => {
            const isActive = index === currentProblemIndex;
            const isSubmitted = submitted[q.id];
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentProblemIndex(index)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                  isActive
                    ? "bg-violet-600 text-white"
                    : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200"
                }`}
              >
                {isSubmitted && <CheckCircle2 size={13} className="text-emerald-400" />}
                Problem {index + 1}
              </button>
            );
          })}
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={canFinish ? handleFinishClick : undefined}
            disabled={!canFinish}
            title={!canFinish ? "Submit at least one problem before finishing" : undefined}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
              canFinish
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "cursor-not-allowed border border-white/10 bg-white/[0.02] text-slate-600"
            }`}
          >
            Finish Coding ({submittedCount}/{questions.length} submitted)
          </button>
        </div>
      </div>

      {/* Editor for the currently selected problem */}
      <div className="flex-1 min-h-0">
        <CodeEditor
          key={currentQuestion.id}
          question={currentQuestion}
          answer={answers[currentQuestion.id] ?? ""}
          onAnswerChange={handleAnswerChange}
          attemptId={attemptId}
          examId={examId}
          onSubmitSuccess={handleSubmitSuccess}
        />
      </div>
    </div>
  );
}
