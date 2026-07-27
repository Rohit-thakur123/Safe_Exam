import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { codingExecutionAPI } from '../../services/api';
import { ArrowLeft, Code2, Search, User } from 'lucide-react';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';

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

const CodingSubmissions: React.FC = () => {
  const { examId = '' } = useParams<{ examId: string }>();
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    codingExecutionAPI.getExamSubmissions(examId)
      .then(setSubmissions)
      .catch((err: any) => {
        setToast({
          id: Date.now().toString(),
          type: 'error',
          message: err.response?.data?.error || 'Failed to load coding submissions'
        });
      })
      .finally(() => setLoading(false));
  }, [examId]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const q = searchQuery.toLowerCase();
      const studentName = sub.studentId?.name || '';
      const studentEmail = sub.studentId?.email || '';
      const questionTitle = sub.codingQuestionId?.title || '';
      return !q || studentName.toLowerCase().includes(q) || studentEmail.toLowerCase().includes(q) || questionTitle.toLowerCase().includes(q);
    });
  }, [submissions, searchQuery]);

  return (
    <div className="min-h-screen" style={{background:"var(--bg-primary)"">
      <TeacherNavbar />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link to="/teacher/exams" className="inline-flex items-center text-xs font-semibold text-violet-600 hover:text-violet-800 mb-2">
              <ArrowLeft size={14} className="mr-1" /> Back to Assessments
            </Link>
            <h1 className="text-2xl font-bold" style={{color:"var(--text-heading)" tracking-tight">Coding Submissions Review</h1>
            <p className="text-sm text-muted mt-1">Review source code, execution logs, and testcase pass/fail ratios</p>
          </div>

          <Link
            to={`/teacher/exams/${examId}/results`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors shadow-xs"
          >
            View Full Candidate Scorecards →
          </Link>
        </div>

        {/* Search Toolbar */}
        <div className="card-surface p-4 mb-6 shadow-xs flex justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search by student name, email, or problem..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
          <span className="text-xs text-muted font-medium">{filteredSubmissions.length} submissions</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-sm text-muted">Loading code submissions...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="card-surface" style={{padding:"3rem",textAlign:"center"">
            <Code2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-heading">No coding submissions found</h3>
            <p className="text-xs text-muted mt-1">When students submit code for this assessment, their source code will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSubmissions.map(sub => (
              <div key={sub._id} className="card-surface" style={{padding:"1.5rem" hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                      {sub.studentId?.name?.slice(0, 2).toUpperCase() || <User size={16} />}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-heading">{sub.codingQuestionId?.title || 'Coding Challenge'}</h3>
                      <p className="text-xs text-muted">
                        {sub.studentId?.name || 'Candidate'} · {sub.studentId?.email || 'N/A'} · {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Score: {sub.score} / {sub.totalMarks}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs mb-4 p-3 /70 rounded-xl border">
                  <div>
                    <span className="text-muted block text-[10px]">Language</span>
                    <span className="font-bold text-heading">{sub.language}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Passed Cases</span>
                    <span className="font-bold text-emerald-600">{sub.passedTestCases}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Failed Cases</span>
                    <span className="font-bold text-rose-600">{sub.failedTestCases}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Execution Time</span>
                    <span className="font-bold text-heading">{sub.executionTime} ms</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Memory Usage</span>
                    <span className="font-bold text-heading">{Math.ceil(sub.memoryUsage / 1024)} KB</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Ratio</span>
                    <span className="font-bold text-violet-700">
                      {Math.round((sub.passedTestCases / (sub.passedTestCases + sub.failedTestCases || 1)) * 100)}%
                    </span>
                  </div>
                </div>

                <pre className="p-4 bg-gray-950 text-gray-100 text-xs rounded-xl overflow-x-auto font-mono max-h-96 shadow-inner">
                  {sub.sourceCode}
                </pre>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CodingSubmissions;
