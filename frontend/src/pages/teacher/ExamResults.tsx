import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { Button } from '../../components/ui/Button';
import { examAPI, examAttemptAPI, codingExecutionAPI } from '../../services/api';
import {
  ArrowLeft, BarChart3, AlertTriangle, Shield, Download,
  Search, Eye, Code2
} from 'lucide-react';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';

interface CandidateAttempt {
  id: string;
  status: string;
  subjectiveStatus?: 'not_applicable' | 'pending_evaluation' | 'evaluated';
  subjectiveScore?: number;
  student: {
    id: string;
    name: string;
    email: string;
  };
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  startTime?: string;
  timeSpent: number;
  violationSummary: {
    tabSwitches: number;
    windowBlurs: number;
    copyAttempts: number;
    pasteAttempts: number;
    devToolsAttempts: number;
    totalViolations: number;
  };
  violations?: Array<{ type: string; timestamp: string; details?: string }>;
}

interface CodingSubmission {
  _id: string;
  studentId?: { name: string; email: string };
  codingQuestionId?: { title: string; difficulty?: string; points?: number };
  language: string;
  sourceCode: string;
  executionTime: number;
  memoryUsage: number;
  passedTestCases: number;
  failedTestCases: number;
  score: number;
  totalMarks: number;
  submittedAt: string;
}

export const ExamResults: React.FC = () => {
  const { examId = '' } = useParams<{ examId: string }>();

  const [exam, setExam] = useState<any>(null);
  const [attempts, setAttempts] = useState<CandidateAttempt[]>([]);
  const [codingSubmissions, setCodingSubmissions] = useState<CodingSubmission[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAttempt | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (examId) {
      fetchData();
    }
  }, [examId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examData, attemptsRes, submissionsRes] = await Promise.all([
        examAPI.getById(examId).catch(() => null),
        examAttemptAPI.getByExam(examId).catch(() => ({ attempts: [], statistics: null })),
        codingExecutionAPI.getExamSubmissions(examId).catch(() => [])
      ]);

      setExam(examData);
      setAttempts(attemptsRes.attempts || []);
      setStats(attemptsRes.statistics || null);
      setCodingSubmissions(submissionsRes || []);
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.message || 'Failed to load exam results'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAttempts = useMemo(() => {
    return attempts.filter(a => {
      const query = searchQuery.toLowerCase();
      return !query || a.student.name.toLowerCase().includes(query) || a.student.email.toLowerCase().includes(query);
    });
  }, [attempts, searchQuery]);

  const candidateSubmissions = useMemo(() => {
    if (!selectedCandidate) return [];
    return codingSubmissions.filter(sub => {
      return sub.studentId?.email === selectedCandidate.student.email ||
        (sub.studentId as any)?._id === selectedCandidate.student.id;
    });
  }, [selectedCandidate, codingSubmissions]);

  const exportToCSV = () => {
    if (attempts.length === 0) return;
    const headers = ['Candidate Name', 'Candidate Email', 'Status', 'Score', 'Total Marks', 'Percentage', 'Passed', 'Violations', 'Submitted Date'];
    const rows = attempts.map(a => [
      `"${a.student.name}"`,
      `"${a.student.email}"`,
      a.status,
      a.score,
      a.totalMarks,
      `${a.percentage}%`,
      a.passed ? 'PASSED' : 'FAILED',
      a.violationSummary?.totalViolations || 0,
      `"${new Date(a.submittedAt).toLocaleString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exam?.title || 'exam'}_results_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({
      id: Date.now().toString(),
      type: 'success',
      message: 'Results report exported to CSV'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans">
      <TeacherNavbar />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link to="/teacher/exams" className="inline-flex items-center text-xs font-semibold text-violet-600 hover:text-violet-800 mb-2">
              <ArrowLeft size={14} className="mr-1" /> Back to Assessments
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {exam?.title || 'Assessment Results & Analytics'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Candidate scorecards, MCQ responses, coding challenge executions, and anti-cheat audit logs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/teacher/exams/${examId}/grade-subjective`}>
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
                <BarChart3 size={14} className="mr-1.5" /> Grade Subjective Questions
              </Button>
            </Link>
            <Button onClick={exportToCSV} disabled={attempts.length === 0} variant="outline">
              <Download size={14} className="mr-1.5" /> Export Report (CSV)
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <p className="text-xs font-semibold text-gray-500">Total Candidates Attempted</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats?.totalAttempts || attempts.length}</p>
            <p className="text-xs text-gray-400 mt-1">{stats?.completedAttempts || 0} completed attempts</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <p className="text-xs font-semibold text-gray-500">Average Candidate Score</p>
            <p className="text-3xl font-extrabold text-violet-600 mt-1">{stats?.averageScore || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Out of {exam?.totalMarks || 100} marks</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <p className="text-xs font-semibold text-gray-500">Pass Rate</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{stats?.passRate || 0}%</p>
            <p className="text-xs text-gray-400 mt-1">Passing threshold: {exam?.passingMarks || 40}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <p className="text-xs font-semibold text-gray-500">Highest Score</p>
            <p className="text-3xl font-extrabold text-indigo-600 mt-1">{stats?.highestScore || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Lowest: {stats?.lowestScore || 0}</p>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-xs flex justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">{filteredAttempts.length} candidates</span>
        </div>

        {/* Candidate Attempts Table */}
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading candidate scorecards...</div>
        ) : filteredAttempts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No attempts submitted yet</h3>
            <p className="text-xs text-gray-500 mt-1">When students complete this exam, their scorecards will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Candidate</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Score</th>
                    <th className="px-6 py-3.5">Percentage</th>
                    <th className="px-6 py-3.5">Violations</th>
                    <th className="px-6 py-3.5">Submitted Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttempts.map((attempt) => {
                    const isCompleted = attempt.status === 'completed';
                    const violationsCount = attempt.violationSummary?.totalViolations || 0;
                    return (
                      <tr key={attempt.id} className="hover:bg-violet-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                              {attempt.student.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-xs">{attempt.student.name}</p>
                              <p className="text-[11px] text-gray-500">{attempt.student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold w-fit ${
                              isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {isCompleted ? 'Completed' : 'In Progress'}
                            </span>
                            {attempt.subjectiveStatus === 'pending_evaluation' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 w-fit">
                                Subjective Pending
                              </span>
                            )}
                            {attempt.subjectiveStatus === 'evaluated' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                                Subjective Graded (+{attempt.subjectiveScore || 0})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 text-xs">
                          {attempt.score} / {attempt.totalMarks}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${attempt.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {attempt.percentage}% ({attempt.passed ? 'PASSED' : 'FAILED'})
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {violationsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle size={12} /> {violationsCount} Flagged
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium text-[11px]">0 Violations</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(attempt.submittedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedCandidate(attempt)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                          >
                            <Eye size={13} /> View Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Candidate Detail Drawer */}
        {selectedCandidate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50">
            <div className="bg-white max-w-2xl w-full h-full shadow-2xl overflow-y-auto p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedCandidate.student.name}</h3>
                    <p className="text-xs text-gray-500">{selectedCandidate.student.email}</p>
                  </div>
                  <button onClick={() => setSelectedCandidate(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
                </div>

                {/* Score Overview */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-100">
                    <p className="text-xs text-gray-500">Total Marks Achieved</p>
                    <p className="text-2xl font-bold text-violet-700 mt-1">{selectedCandidate.score} / {selectedCandidate.totalMarks}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${selectedCandidate.passed ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' : 'bg-rose-50/50 border-rose-100 text-rose-900'}`}>
                    <p className="text-xs opacity-75">Evaluation Result</p>
                    <p className="text-2xl font-bold mt-1">{selectedCandidate.percentage}% ({selectedCandidate.passed ? 'PASSED' : 'FAILED'})</p>
                  </div>
                </div>

                {/* Anti-Cheat Violations */}
                <div className="mb-6 border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Shield size={14} className="text-rose-500" /> Security Violation Log
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="font-bold text-gray-900">{selectedCandidate.violationSummary?.tabSwitches || 0}</p>
                      <p className="text-[10px] text-gray-500">Tab Switches</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="font-bold text-gray-900">{selectedCandidate.violationSummary?.copyAttempts || 0}</p>
                      <p className="text-[10px] text-gray-500">Copy Attempts</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="font-bold text-gray-900">{selectedCandidate.violationSummary?.devToolsAttempts || 0}</p>
                      <p className="text-[10px] text-gray-500">DevTools Locks</p>
                    </div>
                  </div>
                </div>

                {/* Coding Submissions Code Viewer */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Code2 size={14} className="text-indigo-500" /> Coding Challenge Submissions
                  </h4>

                  {candidateSubmissions.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No coding challenges submitted for this candidate.</p>
                  ) : (
                    <div className="space-y-4">
                      {candidateSubmissions.map(sub => (
                        <div key={sub._id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-900">{sub.codingQuestionId?.title || 'Coding Challenge'}</span>
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Passed {sub.passedTestCases}/{sub.passedTestCases + sub.failedTestCases} testcases
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-gray-500">
                            <span>Lang: {sub.language}</span>
                            <span>Time: {sub.executionTime} ms</span>
                            <span>Memory: {Math.ceil(sub.memoryUsage / 1024)} KB</span>
                          </div>
                          <pre className="p-3 bg-gray-950 text-gray-100 text-xs rounded-xl overflow-x-auto font-mono max-h-48">
                            {sub.sourceCode}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedCandidate(null)}>Close Scorecard</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExamResults;
