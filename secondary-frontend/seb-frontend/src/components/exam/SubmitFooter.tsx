// =====================================================================================
// SubmitFooter.tsx
// The highest-stakes control on the page. Disabled by default, visually inert (not just
// faded), with dynamic helper copy — and a confirmation dialog before the real submit.
// =====================================================================================

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface SubmitFooterProps {
  isReady: boolean;
  mcqCompleted: boolean;
  codingCompleted: boolean;
  onConfirmSubmit: () => void;
}

const SubmitFooter: React.FC<SubmitFooterProps> = ({
  isReady,
  mcqCompleted,
  codingCompleted,
  onConfirmSubmit,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleSubmitClick = () => {
    if (!isReady) return;
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    setIsDialogOpen(false);
    onConfirmSubmit();
  };

  return (
    <div className="mx-auto mt-8 max-w-[560px] text-center">
      <div className="mb-5 h-px w-full bg-white/10" />

      <p className="mb-3.5 text-[13px] text-slate-500">
        {isReady
          ? "You're ready to submit. This action is final."
          : "Complete both sections to submit your exam"}
      </p>

      <button
        type="button"
        onClick={handleSubmitClick}
        disabled={!isReady}
        className={`w-full rounded-[10px] py-3.5 text-sm font-medium transition-colors ${
          isReady
            ? "bg-violet-600 text-white hover:bg-violet-500"
            : "cursor-not-allowed border border-white/10 bg-white/[0.02] text-slate-600"
        }`}
      >
        Submit final exam
      </button>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#111114] p-6 text-left shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/10">
                  <AlertTriangle size={16} className="text-amber-300" />
                </div>
                <p className="text-[15px] font-medium text-slate-100">
                  Submit final exam?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="text-slate-500 transition-colors hover:text-slate-300"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-slate-400">
              Once you submit, you won't be able to return to the MCQ or
              Coding sections. Make sure you're finished before continuing.
            </p>

            <div className="mb-5 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">MCQ Assessment</span>
                <span className={mcqCompleted ? "text-emerald-300" : "text-slate-500"}>
                  {mcqCompleted ? "Completed" : "Incomplete"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Coding Assessment</span>
                <span className={codingCompleted ? "text-emerald-300" : "text-slate-500"}>
                  {codingCompleted ? "Completed" : "Incomplete"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-500"
              >
                Yes, submit final exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitFooter;