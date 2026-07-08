// =====================================================================================
// ExamDashboard.tsx
// The exam "home base": candidates land here before, between, and after each section.
// Vertical stepper (not side-by-side cards) because the flow is sequential and gated,
// not a parallel choice.
// =====================================================================================

import React, { useMemo } from "react";
import { ListChecks, Code2 } from "lucide-react";
import TopBar from "./ExamHeader";
import SectionCard from "./AssessmentCard";
import SubmitFooter from "./SubmitFooter";
import type { ExamDashboardProps } from "../../types/exam.types";

const ExamDashboard: React.FC<ExamDashboardProps> = ({
  companyName,
  examTitle,
  totalMarks,
  candidateName,
  candidateId,
  timeRemainingSeconds,
  mcqStatus,
  mcqMeta,
  codingStatus,
  codingMeta,
  onStartMcq,
  onContinueMcq,
  onReviewMcq,
  onStartCoding,
  onContinueCoding,
  onReviewCoding,
  onSubmitExam,
}) => {
  const mcqCompleted = mcqStatus === "completed";
  const codingCompleted = codingStatus === "completed";
  const bothCompleted = mcqCompleted && codingCompleted;

  const connectorColorClass = useMemo(
    () => (mcqCompleted ? "bg-emerald-500/40" : "bg-white/10"),
    [mcqCompleted]
  );

  const handleMcqAction = () => {
    if (mcqStatus === "not_started") onStartMcq();
    else if (mcqStatus === "in_progress") onContinueMcq();
    else onReviewMcq();
  };

  const handleCodingAction = () => {
    if (codingStatus === "not_started") onStartCoding();
    else if (codingStatus === "in_progress") onContinueCoding();
    else if (codingStatus === "completed") onReviewCoding();
    // "locked" renders no button, so this is never called in that state
  };

  const handleTimeExpired = () => {
    // The dashboard owns the global clock. When it hits zero, whatever the
    // candidate was doing should already have been auto-submitted by the
    // section screens; this is the final safety net that locks the exam here.
    onSubmitExam();
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0d] text-slate-100">
      <TopBar
        companyName={companyName}
        examTitle={examTitle}
        candidateName={candidateName}
        initialSecondsRemaining={timeRemainingSeconds}
        onTimeExpired={handleTimeExpired}
      />

      <div className="mx-auto max-w-[640px] px-6 py-14">
        <div className="mb-10 text-center">
          <p className="mb-1.5 text-[19px] font-medium text-slate-50">
            {examTitle}
          </p>
          <p className="text-[13px] text-slate-500">
            2 sections · {totalMarks} marks total · Candidate ID #{candidateId}
          </p>
        </div>

        <SectionCard
          stepNumber={1}
          icon={<ListChecks size={20} />}
          title="MCQ Assessment"
          itemCountLabel={mcqMeta.itemCountLabel}
          marks={mcqMeta.marks}
          status={mcqStatus}
          onPrimaryAction={handleMcqAction}
        />

        <div className={`ml-[38px] h-7 w-0.5 ${connectorColorClass}`} />

        <SectionCard
          stepNumber={2}
          icon={<Code2 size={20} />}
          title="Coding Assessment"
          itemCountLabel={codingMeta.itemCountLabel}
          marks={codingMeta.marks}
          status={codingStatus}
          lockedHelperText="Unlocks after MCQ is submitted."
          onPrimaryAction={handleCodingAction}
        />

        <SubmitFooter
          isReady={bothCompleted}
          mcqCompleted={mcqCompleted}
          codingCompleted={codingCompleted}
          onConfirmSubmit={onSubmitExam}
        />
      </div>
    </div>
  );
};

export default ExamDashboard;