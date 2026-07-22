// =====================================================================================
// SectionCard.tsx
// One card = one exam section. Same four zones always in the same place:
// badge/icon -> title+meta -> status pill -> action (button or lock helper text).
// =====================================================================================

import React from "react";
import { Check, Lock, ArrowRight } from "lucide-react";
import type { SectionStatus } from "../../types/exam.types";

interface SectionCardProps {
  stepNumber: number;
  icon: React.ReactNode;
  title: string;
  itemCountLabel: string;
  marks: number;
  status: SectionStatus;
  /** Shown only when status is "locked" */
  lockedHelperText?: string;
  onPrimaryAction: () => void;
}

const statusPillStyles: Record<SectionStatus, string> = {
  locked: "text-slate-400 bg-white/[0.04] border-white/10",
  not_started: "text-slate-300 bg-white/[0.04] border-white/10",
  in_progress: "text-amber-300 bg-amber-400/10 border-amber-400/25",
  completed: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
};

const statusPillLabel: Record<SectionStatus, string> = {
  locked: "Locked",
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const iconBadgeStyles: Record<SectionStatus, string> = {
  locked: "bg-white/[0.04] text-slate-500",
  not_started: "bg-white/[0.04] text-slate-300",
  in_progress: "bg-amber-400/10 text-amber-300",
  completed: "bg-emerald-400/10 text-emerald-300",
};

const primaryButtonLabel: Record<Exclude<SectionStatus, "locked">, string> = {
  not_started: "Start",
  in_progress: "Continue",
  completed: "Review",
};

const SectionCard: React.FC<SectionCardProps> = ({
  stepNumber,
  icon,
  title,
  itemCountLabel,
  marks,
  status,
  lockedHelperText,
  onPrimaryAction,
}) => {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  
  const handleStart = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch (err) {
    console.error("Fullscreen failed:", err);
  }

  onPrimaryAction();
};

  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-5">
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] ${iconBadgeStyles[status]}`}
      >
        {isLocked ? <Lock size={19} /> : icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Step {stepNumber}
        </p>
        <p className="mb-0.5 text-[15px] font-medium text-slate-100">{title}</p>
        <p className="text-[13px] text-slate-500">
          {itemCountLabel} · {marks} marks
        </p>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-2.5">
        <span
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-medium ${statusPillStyles[status]}`}
        >
          {isCompleted && <Check size={12} />}
          {statusPillLabel[status]}
        </span>

        {isLocked ? (
          <p className="max-w-[180px] text-right text-xs leading-snug text-slate-500">
            {lockedHelperText}
          </p>
        ) : isCompleted ? (
          <button
            type="button"
            onClick={handleStart}
            className="rounded-lg border border-white/15 px-3.5 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.06]"
          >
            {primaryButtonLabel[status]} {title.split(" ")[0]}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            {primaryButtonLabel[status]} {title.split(" ")[0]}
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SectionCard;