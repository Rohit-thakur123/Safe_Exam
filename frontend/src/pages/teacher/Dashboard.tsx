import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { questionAPI, examAPI, codingQuestionAPI } from '../../services/api';
import {
  Code2, FileText, ListChecks, BarChart3, Shield, Eye,
  Plus, ChevronRight, Activity, Zap, CheckCircle2, RefreshCw
} from 'lucide-react';
import type { Question, Exam, CodingQuestion } from '../../types';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl bg-white border border-gray-100 p-6 h-36 shadow-xs" />
);

const SkeletonRow = () => (
  <div className="animate-pulse flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-50">
    <div className="h-4 bg-gray-200 rounded w-2/3" />
    <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
  </div>
);

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  gradient: string;
  linkTo: string;
  linkLabel: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, subtext, badge, gradient, linkTo, linkLabel }) => (
  <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-sm text-white`}>
          <Icon size={20} />
        </div>
        {badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            {badge}
          </span>
        )}
      </div>
      <p className="text-3xl font-extrabold text-gray-900 tabular-nums tracking-tight">{value}</p>
      <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
      {subtext && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
    </div>
    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-2.5 flex items-center justify-between">
      <Link to={linkTo} className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-1">
        {linkLabel}
        <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [mcqQuestions, setMcqQuestions] = useState<Question[]>([]);
  const [codingQuestions, setCodingQuestions] = useState<CodingQuestion[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [mcqData, codingData, examsData] = await Promise.all([
        questionAPI.getAll().catch(() => []),
        codingQuestionAPI.getAll({ limit: 100 }).then(res => res.questions).catch(() => []),
        examAPI.getAll().catch(() => [])
      ]);

      const myMcqs = (Array.isArray(mcqData) ? mcqData : []).filter((q: Question) =>
        !q.createdBy || String(q.createdBy) === String(user.id)
      );

      const myExams = (Array.isArray(examsData) ? examsData : []).filter((e: Exam) =>
        !e.createdBy || String(e.createdBy) === String(user.id)
      );

      setMcqQuestions(myMcqs);
      setCodingQuestions(codingData || []);
      setExams(myExams);
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error Loading Dashboard',
        message: err.message || 'Failed to fetch assessment metrics'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const activeExams = exams.filter(e => e.isActive);

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans">
      <TeacherNavbar />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
                {user?.name?.split(' ')[0] || 'Teacher'} 👋
              </h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-white transition-all"
                title="Refresh Metrics"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin text-violet-600' : ''} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Enterprise Assessment Control Center · Real-time overview of active exams & question bank
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/teacher/create-question"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs"
            >
              <Plus size={16} className="text-violet-600" />
              New MCQ
            </Link>
            <Link
              to="/teacher/coding-questions/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs"
            >
              <Code2 size={16} className="text-indigo-600" />
              New Coding Challenge
            </Link>
            <Link
              to="/teacher/create-exam"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-sm"
            >
              <Zap size={16} />
              Create Assessment
            </Link>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {loading ? (
            <>
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                icon={FileText}
                label="Total Exams"
                value={exams.length}
                subtext={`${activeExams.length} active assessments`}
                gradient="from-violet-600 to-indigo-600"
                linkTo="/teacher/exams"
                linkLabel="Manage all exams"
              />
              <StatCard
                icon={Activity}
                label="Active Exams"
                value={activeExams.length}
                badge={activeExams.length > 0 ? 'Live Now' : 'Idle'}
                subtext="Currently accessible by candidates"
                gradient="from-emerald-500 to-teal-600"
                linkTo="/teacher/exams"
                linkLabel="View live status"
              />
              <StatCard
                icon={ListChecks}
                label="MCQ Questions"
                value={mcqQuestions.length}
                subtext="Multiple choice question bank"
                gradient="from-blue-500 to-cyan-600"
                linkTo="/teacher/mcq"
                linkLabel="Open MCQ library"
              />
              <StatCard
                icon={Code2}
                label="Coding Challenges"
                value={codingQuestions.length}
                subtext="Algorithm & programming tasks"
                gradient="from-indigo-500 to-purple-600"
                linkTo="/teacher/coding-questions"
                linkLabel="Open coding library"
              />
            </>
          )}
        </div>

        {/* Active Exams Monitor & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Assessments Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base font-semibold text-gray-900">Active Exam Monitor</h2>
              </div>
              <Link to="/teacher/exams" className="text-xs font-semibold text-violet-600 hover:text-violet-800">
                View all ({exams.length}) →
              </Link>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-3">
                  <SkeletonRow /><SkeletonRow /><SkeletonRow />
                </div>
              ) : activeExams.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">No active exams right now</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Activate an existing exam or create a new assessment to begin inviting students.
                  </p>
                  <Link
                    to="/teacher/create-exam"
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                  >
                    <Plus size={14} /> Create New Exam
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeExams.slice(0, 5).map((exam) => (
                    <div
                      key={exam._id || exam.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-violet-200 hover:bg-violet-50/30 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{exam.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>⏱ {exam.duration} mins</span>
                            <span>🎯 {exam.totalMarks} total marks</span>
                            <span>📋 {exam.questionsCount || exam.questions?.length || 0} questions</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/teacher/exams/${exam._id || exam.id}/results`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors shadow-xs"
                        >
                          <BarChart3 size={13} /> Results & Live Analytics
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Question Stats Side Card */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-violet-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md">
              <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Shield size={14} /> Enterprise SEB Security
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Safe Exam Browser Traps Active</h3>
              <p className="text-xs text-violet-200/90 leading-relaxed mb-4">
                All assigned candidate attempts enforce strict full-screen locks, browser back-button traps, tab-switch logging, and copy-paste detection.
              </p>
              <Link
                to="/teacher/exams"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl border border-white/20 transition-all"
              >
                Configure Security Policies →
              </Link>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Assessment Quick Tools</h3>
              <div className="space-y-2">
                <Link
                  to="/teacher/mcq"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <ListChecks size={16} className="text-blue-500" /> MCQ Question Library
                  </span>
                  <span className="text-xs text-gray-400">{mcqQuestions.length} items</span>
                </Link>
                <Link
                  to="/teacher/coding-questions"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Code2 size={16} className="text-indigo-500" /> Coding Challenges
                  </span>
                  <span className="text-xs text-gray-400">{codingQuestions.length} items</span>
                </Link>
                <Link
                  to="/teacher/exams"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Eye size={16} className="text-emerald-500" /> Manage & Assign Exams
                  </span>
                  <span className="text-xs text-gray-400">{exams.length} items</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
