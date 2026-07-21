// =====================================================================================
// ExamDashboard.tsx
// Exam dashboard with three sections:
// 1. MCQ
// 2. Coding
// 3. Descriptive
// =====================================================================================

import React, { useMemo } from "react";
import { ListChecks, Code2, FileText } from "lucide-react";
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

  // MCQ
  mcqStatus,
  mcqMeta,

  // Coding
  codingStatus,
  codingMeta,

  // Descriptive
  descriptiveStatus,
  descriptiveMeta,

  // MCQ Actions
  onStartMcq,
  onContinueMcq,
  onReviewMcq,

  // Coding Actions
  onStartCoding,
  onContinueCoding,
  onReviewCoding,

  // Descriptive Actions
  onStartDescriptive,
  onContinueDescriptive,
  onReviewDescriptive,

  // Final Submit
  onSubmitExam,
}) => {
  const mcqCompleted = mcqStatus === "completed";
  const codingCompleted = codingStatus === "completed";
  const descriptiveCompleted = descriptiveStatus === "completed";

  const allCompleted =
    mcqCompleted &&
    codingCompleted &&
    descriptiveCompleted;

  const connectorColorClass = useMemo(
    () => (mcqCompleted ? "bg-emerald-500/40" : "bg-white/10"),
    [mcqCompleted]
  );

  const connectorColorClass2 = useMemo(
    () => (codingCompleted ? "bg-emerald-500/40" : "bg-white/10"),
    [codingCompleted]
  );

  // ---------------- MCQ ----------------

  const handleMcqAction = () => {
    if (mcqStatus === "not_started") onStartMcq();
    else if (mcqStatus === "in_progress") onContinueMcq();
    else onReviewMcq();
  };

  // ---------------- Coding ----------------

  const handleCodingAction = () => {
    if (codingStatus === "not_started") onStartCoding();
    else if (codingStatus === "in_progress") onContinueCoding();
    else if (codingStatus === "completed") onReviewCoding();
  };

  // ---------------- Descriptive ----------------

  const handleDescriptiveAction = () => {
    if (descriptiveStatus === "not_started") onStartDescriptive();
    else if (descriptiveStatus === "in_progress")
      onContinueDescriptive();
    else if (descriptiveStatus === "completed")
      onReviewDescriptive();
  };

  // ---------------- Timer ----------------

  const handleTimeExpired = () => {
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
            3 Sections · {totalMarks} Marks · Candidate ID #{candidateId}
          </p>
        </div>

        {/* ================= MCQ ================= */}

        <SectionCard
          stepNumber={1}
          icon={<ListChecks size={20} />}
          title="MCQ Assessment"
          itemCountLabel={mcqMeta.itemCountLabel}
          marks={mcqMeta.marks}
          status={mcqStatus}
          onPrimaryAction={handleMcqAction}
        />

        <div
          className={`ml-[38px] h-7 w-0.5 ${connectorColorClass}`}
        />

        {/* ================= Coding ================= */}

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

        <div
          className={`ml-[38px] h-7 w-0.5 ${connectorColorClass2}`}
        />

        {/* ================= Descriptive ================= */}

        <SectionCard
          stepNumber={3}
          icon={<FileText size={20} />}
          title="Descriptive Assessment"
          itemCountLabel={descriptiveMeta.itemCountLabel}
          marks={descriptiveMeta.marks}
          status={descriptiveStatus}
          lockedHelperText="Unlocks after Coding is submitted."
          onPrimaryAction={handleDescriptiveAction}
        />

        {/* ================= Submit ================= */}

        <SubmitFooter
          isReady={allCompleted}
          mcqCompleted={mcqCompleted}
          codingCompleted={codingCompleted}
          descriptiveCompleted={descriptiveCompleted}
          onConfirmSubmit={onSubmitExam}
        />
      </div>
    </div>
  );
};

export default ExamDashboard;