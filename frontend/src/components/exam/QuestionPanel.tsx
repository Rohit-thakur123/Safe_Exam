// =====================================================================================
// QuestionPanel.tsx
// Left-hand panel: problem statement, metadata badges, and collapsible detail sections.
// =====================================================================================

import React, { useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronDown,
  Clock,
  MemoryStick,
  Award,
  FileText,
  ListChecks,
  ArrowRightToLine,
  ArrowLeftFromLine,
  FlaskConical,
  CheckCircle2,
} from "lucide-react";
import type { CodingQuestion, Difficulty } from "../../types/exam.types";

interface QuestionPanelProps {
  question: CodingQuestion;
}

const difficultyStyles: Record<Difficulty, string> = {
  easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  hard: "text-rose-400 bg-rose-400/10 border-rose-400/30",
};

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

interface CollapsibleSectionProps {
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  count?: number;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = true,
  children,
  count,
}) => {
  const [open, setOpen] = useState<boolean>(defaultOpen);

  return (
    <div className="rounded-2xl border border-white/10 card-surface/[0.03] backdrop-blur-sm overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 group hover:card-surface/[0.04] transition-colors duration-200"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-violet-400">{icon}</span>
          <span className="text-sm font-semibold tracking-wide text-slate-200 group-hover:text-white transition-colors">
            {title}
          </span>
          {typeof count === "number" && (
            <span className="text-xs font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-500 transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0 text-sm leading-relaxed text-slate-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetaStat: React.FC<{ icon: ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 card-surface/[0.03] px-3.5 py-2.5">
    <span className="text-violet-400">{icon}</span>
    <div className="flex flex-col leading-tight">
      <span className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-100">{value}</span>
    </div>
  </div>
);

const QuestionPanel: React.FC<QuestionPanelProps> = ({ question }) => {
  const formattedTimeLimit =
    question.timeLimit >= 60
      ? `${(question.timeLimit / 60).toFixed(1)} min`
      : `${question.timeLimit}s`;

  // Backend sends this as either a single (possibly multi-line) string or an
  // array of strings — normalize both shapes into one flat list of lines.
  const rawConstraints: string | string[] = question.constraints ?? "";
  const constraintLines: string[] = Array.isArray(rawConstraints)
    ? rawConstraints
        .map((line: string) => line.trim().replace(/^[-*•]\s*/, ""))
        .filter((line: string) => line.length > 0)
    : rawConstraints
        .split("\n")
        .map((line: string) => line.trim().replace(/^[-*•]\s*/, ""))
        .filter((line: string) => line.length > 0);

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar bg-[#0a0a0f] px-5 py-6 lg:px-6">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.25);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.45);
        }
      `}</style>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`text-xs font-bold uppercase tracking-wider rounded-full border px-2.5 py-1 ${difficultyStyles[question.difficulty as Difficulty]}`}
          >
            {capitalize(question.difficulty as Difficulty)}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-slate-400 card-surface/5 border border-white/10 rounded-full px-2.5 py-1">
            <Award size={12} className="text-violet-400" />
            {question.marks} marks
          </span>
        </div>
        <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-snug">
          {question.title}
        </h1>
      </div>

      {/* Meta stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetaStat
          icon={<Clock size={16} />}
          label="Time Limit"
          value={formattedTimeLimit}
        />
        <MetaStat
          icon={<MemoryStick size={16} />}
          label="Memory Limit"
          value={`${question.memoryLimit} MB`}
        />
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">
        <CollapsibleSection
          title="Description"
          icon={<FileText size={16} />}
          defaultOpen
        >
          <p className="whitespace-pre-wrap">{question.description}</p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Input Format"
          icon={<ArrowRightToLine size={16} />}
          defaultOpen
        >
          <p className="whitespace-pre-wrap">{question.inputFormat}</p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Output Format"
          icon={<ArrowLeftFromLine size={16} />}
          defaultOpen
        >
          <p className="whitespace-pre-wrap">{question.outputFormat}</p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Constraints"
          icon={<ListChecks size={16} />}
          defaultOpen={false}
          count={constraintLines.length}
        >
          <ul className="list-disc list-inside space-y-1.5 marker:text-violet-400">
            {constraintLines.map((constraint, idx) => (
              <li key={idx} className="font-mono text-[13px] text-slate-300">
                {constraint}
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        <CollapsibleSection
          title="Sample Test Cases"
          icon={<FlaskConical size={16} />}
          defaultOpen
          count={question.visibleTestCases.length}
        >
          <div className="flex flex-col gap-3">
            {question.visibleTestCases.map((testCase: { order: number; input: string; expectedOutput: string }, idx: number) => (
              <div
                key={idx}
                className="rounded-xl border border-white/10 bg-black/30 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 card-surface/[0.02]">
                  <CheckCircle2 size={13} className="text-violet-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Example {idx + 1}
                  </span>
                </div>
                <div className="px-4 py-3 flex flex-col gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                      Input
                    </p>
                    <pre className="font-mono text-[13px] text-emerald-300 bg-emerald-400/[0.06] border border-emerald-400/10 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap">
                      {testCase.input}
                    </pre>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                      Output
                    </p>
                    <pre className="font-mono text-[13px] text-sky-300 bg-sky-400/[0.06] border border-sky-400/10 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap">
                      {testCase.expectedOutput}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default QuestionPanel;