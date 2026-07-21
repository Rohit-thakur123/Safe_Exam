// =====================================================================================
// ExamDashboard.tsx
// The exam "home base": candidates land here before, between, and after each section.
// Vertical stepper (not side-by-side cards) because the flow is sequential and gated,
// not a parallel choice.
// =====================================================================================

import React from "react";
import { ListChecks, Code2, BookOpen } from "lucide-react";
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
  subjectiveStatus,
  subjectiveMeta,
  onStartMcq,
  onContinueMcq,
  onReviewMcq,
  onStartCoding,
  onContinueCoding,
  onReviewCoding,
  onStartSubjective,
  onContinueSubjective,
  onReviewSubjective,
  onSubmitExam,
}) => {
  const mcqCompleted = mcqStatus === "completed";
  const codingCompleted = codingStatus === "completed";
  const hasSubjective = Boolean(subjectiveMeta && subjectiveStatus);
  const subjectiveCompleted = !hasSubjective || subjectiveStatus === "completed";
  const allCompleted = mcqCompleted && codingCompleted && subjectiveCompleted;

  const handleMcqAction = () => {
    if (mcqStatus === "not_started") onStartMcq();
    else if (mcqStatus === "in_progress") onContinueMcq();
    else onReviewMcq();
  };

  const handleCodingAction = () => {
    if (codingStatus === "not_started") onStartCoding();
    else if (codingStatus === "in_progress") onContinueCoding();
    else if (codingStatus === "completed") onReviewCoding();
  };

  const handleSubjectiveAction = () => {
    if (!onStartSubjective || !onContinueSubjective || !onReviewSubjective) return;
    if (subjectiveStatus === "not_started") onStartSubjective();
    else if (subjectiveStatus === "in_progress") onContinueSubjective();
    else if (subjectiveStatus === "completed") onReviewSubjective();
  };

  const handleTimeExpired = () => {
    onSubmitExam();
  };

  let sectionCounter = 1;
  const mcqStep = sectionCounter++;
  const codingStep = sectionCounter++;
  const subjectiveStep = hasSubjective ? sectionCounter++ : 0;
  const totalSections = hasSubjective ? 3 : 2;

  return (
    <div className="min-h-screen w-full bg-[#0a0a0d] text-slate-100">
      <TopBar
        companyName={companyName}
        examTitle={examTitle}
        candidateName={candidateName}
        timeRemainingSeconds={timeRemainingSeconds}
        onTimeExpired={handleTimeExpired}
      />

      <div className="mx-auto max-w-[640px] px-6 py-14">
        <div className="mb-10 text-center">
          <p className="mb-1.5 text-[19px] font-medium text-slate-50">
            {examTitle}
          </p>
          <p className="text-[13px] text-slate-500">
            {totalSections} sections · {totalMarks} marks total · Candidate ID #{candidateId}
          </p>
        </div>

        <SectionCard
          stepNumber={mcqStep}
          icon={<ListChecks size={20} />}
          title="MCQ Assessment"
          itemCountLabel={mcqMeta.itemCountLabel}
          marks={mcqMeta.marks}
          status={mcqStatus}
          onPrimaryAction={handleMcqAction}
        />

        <div className={`ml-[38px] h-7 w-0.5 ${mcqCompleted ? "bg-emerald-500/40" : "bg-white/10"}`} />

        <SectionCard
          stepNumber={codingStep}
          icon={<Code2 size={20} />}
          title="Coding Assessment"
          itemCountLabel={codingMeta.itemCountLabel}
          marks={codingMeta.marks}
          status={codingStatus}
          lockedHelperText="Unlocks after MCQ is submitted."
          onPrimaryAction={handleCodingAction}
        />

        {hasSubjective && (
          <>
            <div className={`ml-[38px] h-7 w-0.5 ${codingCompleted ? "bg-emerald-500/40" : "bg-white/10"}`} />

            <SectionCard
              stepNumber={subjectiveStep}
              icon={<BookOpen size={20} />}
              title="Subjective Assessment"
              itemCountLabel={subjectiveMeta!.itemCountLabel}
              marks={subjectiveMeta!.marks}
              status={subjectiveStatus!}
              lockedHelperText="Unlocks after Coding section is submitted."
              onPrimaryAction={handleSubjectiveAction}
            />
          </>
        )}

        <SubmitFooter
          isReady={allCompleted}
          mcqCompleted={mcqCompleted}
          codingCompleted={codingCompleted}
          onConfirmSubmit={onSubmitExam}
        />
      </div>
    </div>
  );
};

export default ExamDashboard;