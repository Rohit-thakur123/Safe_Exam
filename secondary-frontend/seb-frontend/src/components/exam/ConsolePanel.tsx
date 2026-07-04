// =====================================================================================
// ConsolePanel.tsx
// Bottom panel: custom input, terminal-style output, test case results and verdicts.
// =====================================================================================

import React, { useMemo, useState } from "react";
import {
  Terminal,
  FileInput,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MemoryStick,
  Bug,
  ListTree,
  Trophy,
} from "lucide-react";
import type { RunResult, SubmitResult, TestCaseResult, Verdict } from "../../types/types";

interface ConsolePanelProps {
  customInput: string;
  onCustomInputChange: (value: string) => void;
  runResult: RunResult | null;
  submitResult: SubmitResult | null;
  isRunning: boolean;
  isSubmitting: boolean;
}

type ConsoleTab = "input" | "output" | "result";

const verdictStyles: Record<Verdict, string> = {
  Accepted: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  "Wrong Answer": "text-rose-400 bg-rose-400/10 border-rose-400/30",
  "Time Limit Exceeded": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "Memory Limit Exceeded": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "Runtime Error": "text-rose-400 bg-rose-400/10 border-rose-400/30",
  "Compilation Error": "text-rose-400 bg-rose-400/10 border-rose-400/30",
  Pending: "text-slate-400 bg-slate-400/10 border-slate-400/30",
};

const StatPill: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-white/[0.04] border border-white/10 rounded-full px-2.5 py-1">
    {icon}
    {label}
  </span>
);

const TestCaseRow: React.FC<{ result: TestCaseResult; index: number }> = ({
  result,
  index,
}) => {
  const [expanded, setExpanded] = useState<boolean>(!result.passed);

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        result.passed
          ? "border-emerald-400/20 bg-emerald-400/[0.04]"
          : "border-rose-400/20 bg-rose-400/[0.04]"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-2.5"
      >
        <div className="flex items-center gap-2">
          {result.passed ? (
            <CheckCircle2 size={15} className="text-emerald-400" />
          ) : (
            <XCircle size={15} className="text-rose-400" />
          )}
          <span className="text-sm font-medium text-slate-200">
            Test Case {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {typeof result.executionTime === "number" && (
            <span>{result.executionTime} ms</span>
          )}
          {typeof result.memoryUsed === "number" && (
            <span>{result.memoryUsed} MB</span>
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-3 flex flex-col gap-2 font-mono text-[12.5px]">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              Input
            </p>
            <pre className="whitespace-pre-wrap text-slate-300 bg-black/30 rounded-lg px-3 py-2 overflow-x-auto">
              {result.input}
            </pre>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              Expected Output
            </p>
            <pre className="whitespace-pre-wrap text-sky-300 bg-sky-400/[0.06] rounded-lg px-3 py-2 overflow-x-auto">
              {result.expectedOutput}
            </pre>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              Your Output
            </p>
            <pre
              className={`whitespace-pre-wrap rounded-lg px-3 py-2 overflow-x-auto ${
                result.passed
                  ? "text-emerald-300 bg-emerald-400/[0.06]"
                  : "text-rose-300 bg-rose-400/[0.06]"
              }`}
            >
              {result.actualOutput || "—"}
            </pre>
          </div>
          {result.errorMessage && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Error
              </p>
              <pre className="whitespace-pre-wrap text-rose-300 bg-rose-400/[0.06] rounded-lg px-3 py-2 overflow-x-auto">
                {result.errorMessage}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ConsolePanel: React.FC<ConsolePanelProps> = ({
  customInput,
  onCustomInputChange,
  runResult,
  submitResult,
  isRunning,
  isSubmitting,
}) => {
  const [activeTab, setActiveTab] = useState<ConsoleTab>("input");

  const passedCount = useMemo(() => {
    const results = runResult?.testCaseResults ?? submitResult?.testCaseResults;
    if (!results) return null;
    return results.filter((r) => r.passed).length;
  }, [runResult, submitResult]);

  const totalCount = useMemo(() => {
    const results = runResult?.testCaseResults ?? submitResult?.testCaseResults;
    return results?.length ?? null;
  }, [runResult, submitResult]);

  const tabs: { id: ConsoleTab; label: string; icon: React.ReactNode }[] = [
    { id: "input", label: "Custom Input", icon: <FileInput size={14} /> },
    { id: "output", label: "Run Output", icon: <Terminal size={14} /> },
    { id: "result", label: "Submission", icon: <Trophy size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-white/10 bg-[#0d0d13] shadow-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 pt-3 border-b border-white/10 bg-[#0d0d13]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-t-lg px-3.5 py-2 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab.id
                ? "text-violet-300 border-violet-400 bg-white/[0.03]"
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 pb-2 pr-1">
          {isRunning && (
            <span className="text-[11px] text-amber-300 animate-pulse">
              Running…
            </span>
          )}
          {isSubmitting && (
            <span className="text-[11px] text-violet-300 animate-pulse">
              Submitting…
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {activeTab === "input" && (
          <textarea
            value={customInput}
            onChange={(e) => onCustomInputChange(e.target.value)}
            placeholder="Type custom input for your program here…"
            spellCheck={false}
            className="w-full h-full min-h-[140px] resize-none rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 font-mono text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
          />
        )}

        {activeTab === "output" && (
          <div className="flex flex-col gap-3">
            {!runResult && !isRunning && (
              <div className="flex flex-col items-center justify-center text-center py-10 text-slate-600">
                <Terminal size={28} className="mb-2 opacity-50" />
                <p className="text-sm">
                  Run your code to see the output here.
                </p>
              </div>
            )}

            {isRunning && !runResult && (
              <div className="flex flex-col items-center justify-center text-center py-10 text-slate-500">
                <Terminal size={28} className="mb-2 animate-pulse" />
                <p className="text-sm">Executing your code…</p>
              </div>
            )}

            {runResult && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {runResult.success ? (
                    <StatPill
                      icon={<CheckCircle2 size={13} className="text-emerald-400" />}
                      label="Executed successfully"
                    />
                  ) : (
                    <StatPill
                      icon={<AlertTriangle size={13} className="text-rose-400" />}
                      label="Execution failed"
                    />
                  )}
                  {typeof runResult.executionTime === "number" && (
                    <StatPill
                      icon={<Clock size={13} className="text-violet-400" />}
                      label={`${runResult.executionTime} ms`}
                    />
                  )}
                  {typeof runResult.memoryUsed === "number" && (
                    <StatPill
                      icon={<MemoryStick size={13} className="text-violet-400" />}
                      label={`${runResult.memoryUsed} MB`}
                    />
                  )}
                  {passedCount !== null && totalCount !== null && (
                    <StatPill
                      icon={<ListTree size={13} className="text-sky-400" />}
                      label={`${passedCount}/${totalCount} passed`}
                    />
                  )}
                </div>

                {runResult.compileError && (
                  <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.05] p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-1.5">
                      <Bug size={13} /> Compilation Error
                    </p>
                    <pre className="whitespace-pre-wrap font-mono text-[12.5px] text-rose-200 overflow-x-auto">
                      {runResult.compileError}
                    </pre>
                  </div>
                )}

                {runResult.runtimeError && (
                  <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.05] p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-1.5">
                      <Bug size={13} /> Runtime Error
                    </p>
                    <pre className="whitespace-pre-wrap font-mono text-[12.5px] text-rose-200 overflow-x-auto">
                      {runResult.runtimeError}
                    </pre>
                  </div>
                )}

                {runResult.output && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
                      stdout
                    </p>
                    <pre className="whitespace-pre-wrap font-mono text-[12.5px] text-slate-200 overflow-x-auto">
                      {runResult.output}
                    </pre>
                  </div>
                )}

                {runResult.stderr && (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-amber-400 mb-1.5">
                      stderr
                    </p>
                    <pre className="whitespace-pre-wrap font-mono text-[12.5px] text-amber-200 overflow-x-auto">
                      {runResult.stderr}
                    </pre>
                  </div>
                )}

                {runResult.testCaseResults && runResult.testCaseResults.length > 0 && (
                  <div className="flex flex-col gap-2 mt-1">
                    {runResult.testCaseResults.map((tc, idx) => (
                      <TestCaseRow key={idx} result={tc} index={idx} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "result" && (
          <div className="flex flex-col gap-3">
            {!submitResult && !isSubmitting && (
              <div className="flex flex-col items-center justify-center text-center py-10 text-slate-600">
                <Trophy size={28} className="mb-2 opacity-50" />
                <p className="text-sm">
                  Submit your solution to see the verdict here.
                </p>
              </div>
            )}

            {isSubmitting && !submitResult && (
              <div className="flex flex-col items-center justify-center text-center py-10 text-slate-500">
                <Trophy size={28} className="mb-2 animate-pulse" />
                <p className="text-sm">Judging your submission…</p>
              </div>
            )}

            {submitResult && (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span
                      className={`text-sm font-bold uppercase tracking-wide rounded-full border px-3 py-1 ${verdictStyles[submitResult.verdict]}`}
                    >
                      {submitResult.verdict}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {submitResult.score}
                      <span className="text-sm text-slate-500">
                        {" "}
                        / {submitResult.maxScore}
                      </span>
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                      style={{
                        width: `${
                          submitResult.totalTestCases > 0
                            ? (submitResult.passedTestCases /
                                submitResult.totalTestCases) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatPill
                      icon={<ListTree size={13} className="text-sky-400" />}
                      label={`${submitResult.passedTestCases}/${submitResult.totalTestCases} test cases passed`}
                    />
                    {typeof submitResult.executionTime === "number" && (
                      <StatPill
                        icon={<Clock size={13} className="text-violet-400" />}
                        label={`${submitResult.executionTime} ms`}
                      />
                    )}
                    {typeof submitResult.memoryUsed === "number" && (
                      <StatPill
                        icon={<MemoryStick size={13} className="text-violet-400" />}
                        label={`${submitResult.memoryUsed} MB`}
                      />
                    )}
                  </div>
                </div>

                {submitResult.compileError && (
                  <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.05] p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-1.5">
                      <Bug size={13} /> Compilation Error
                    </p>
                    <pre className="whitespace-pre-wrap font-mono text-[12.5px] text-rose-200 overflow-x-auto">
                      {submitResult.compileError}
                    </pre>
                  </div>
                )}

                {submitResult.testCaseResults && submitResult.testCaseResults.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {submitResult.testCaseResults.map((tc, idx) => (
                      <TestCaseRow key={idx} result={tc} index={idx} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsolePanel;