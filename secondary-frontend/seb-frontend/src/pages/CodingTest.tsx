// =====================================================================================
// CodingTest.tsx
// Multi-problem coding section: left-side problem pills for navigation, per-problem
// code + submitted-state kept in memory so switching problems never loses work.
// =====================================================================================

import { useState } from "react";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import CodeEditor from "../components/codeEditor";
import type { CodingQuestion, SubmitResult } from "../types/exam.types";

interface CodingTestProps {
  questions: CodingQuestion[];
  attemptId: string;
  onFinish: () => void;
}

export default function CodingTest({ questions, attemptId, onFinish }: CodingTestProps) {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

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

  const handleAnswerChange = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleSubmitSuccess = (_result: SubmitResult) => {
    setSubmitted((prev) => ({ ...prev, [currentQuestion.id]: true }));
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#08080c]">
      {/* Top bar: back + problem pills */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-white/10 bg-[#0a0a0f] overflow-x-auto">
        <button
          type="button"
          onClick={onFinish}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
          Dashboard
        </button>

        <div className="h-5 w-px bg-white/10 shrink-0" />

        <div className="flex items-center gap-2">
          {questions.map((q, index) => {
            const isActive = index === currentProblemIndex;
            const isSubmitted = submitted[q.id];
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentProblemIndex(index)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
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

        <div className="ml-auto shrink-0">
          <button
            type="button"
            onClick={onFinish}
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
          onSubmitSuccess={handleSubmitSuccess}
        />
      </div>
    </div>
  );
}
