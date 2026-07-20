// Teacher Dashboard — Phase 8: Premium enterprise redesign
// Dark/Light aware, glassmorphism stat cards, violation log column,
// skeleton loaders, hover animations, and responsive layout.
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SessionStatus } from '../../components/SessionStatus';
import { questionAPI, examAPI } from '../../services/api';
import {
  BookOpen, Code2, FileText, ListChecks, LogOut, BarChart3,
  Plus, AlertTriangle, CheckCircle, Clock, Users, ChevronRight,
  Activity, Shield, TrendingUp, Zap, Eye
} from 'lucide-react';
import type { Question, Exam } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const difficultyConfig: Record<string, { label: string; cls: string }> = {
  easy: { label: 'Easy', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  medium: { label: 'Medium', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  hard: { label: 'Hard', cls: 'bg-rose-100 text-rose-700 border-rose-200' },
};

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl bg-white/50 border border-gray-100 p-6 h-32" />
);

const SkeletonRow = () => (
  <div className="animate-pulse flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-50">
    <div className="h-4 bg-gray-200 rounded w-2/3" />
    <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
  </div>
);

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: '/teacher', label: 'Dashboard', icon: BarChart3, exact: true },
  { to: '/teacher/create-question', label: 'Create Question', icon: Plus },
  { to: '/teacher/mcq', label: 'MCQ Library', icon: ListChecks },
  { to: '/teacher/create-exam', label: 'Create Exam', icon: FileText },
  { to: '/teacher/exams', label: 'Manage Exams', icon: Eye },
  { to: '/teacher/coding-questions', label: 'Coding', icon: Code2 },
];

const TeacherNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm">
                <Shield size={16} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 leading-none">SecureExam</span>
                <span className="text-[10px] text-gray-500 leading-none mt-0.5">Teacher Portal</span>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive(to, exact)
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: user + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-800">{user?.name}</span>
              <span className="text-[11px] text-gray-500">Teacher</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  gradient: string;
  linkTo: string;
  linkLabel: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, subtext, gradient, linkTo, linkLabel }) => (
  <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-200 ${gradient}`} />
    <div className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-sm`}>
          <Icon size={18} className="text-white" />
        </div>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
    <div className="border-t border-gray-50 px-5 py-2.5">
      <Link to={linkTo} className="text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors">
        {linkLabel} →
      </Link>
    </div>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [questionsData, examsData] = await Promise.all([
          questionAPI.getAll(),
          examAPI.getAll()
        ]);

        const safeQuestions = Array.isArray(questionsData) ? questionsData : [];
        const safeExams = Array.isArray(examsData) ? examsData : [];

        const myQuestions = safeQuestions.filter((q: Question) => {
          if (!q.createdBy) return false;
          return String(q.createdBy) === String(user.id);
        });

        const myExams = safeExams.filter((e: Exam) => {
          if (!e.createdBy) return true;
          return String(e.createdBy) === String(user.id);
        });

        setQuestions(myQuestions);
        setExams(myExams);
      } catch {
        setError('Failed to load dashboard data');
        setQuestions([]);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const activeExams = exams.filter(e => e.isActive);
  const inactiveExams = exams.filter(e => !e.isActive);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <TeacherNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
              {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here's an overview of your exam platform activity.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/teacher/create-question"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Plus size={14} /> Question
            </Link>
            <Link
              to="/teacher/create-exam"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-medium text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-sm"
            >
              <Zap size={14} /> New Exam
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            <>
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                icon={BookOpen}
                label="Questions Created"
                value={questions.length}
                subtext="MCQ + coding"
                gradient="from-blue-500 to-cyan-500"
                linkTo="/teacher/create-question"
                linkLabel="Create question"
              />
              <StatCard
                icon={FileText}
                label="Total Exams"
                value={exams.length}
                subtext={`${activeExams.length} active, ${inactiveExams.length} inactive`}
                gradient="from-violet-500 to-purple-500"
                linkTo="/teacher/create-exam"
                linkLabel="Create exam"
              />
              <StatCard
                icon={Activity}
                label="Active Exams"
                value={activeExams.length}
                gradient="from-emerald-500 to-green-500"
                linkTo="/teacher/exams"
                linkLabel="Manage exams"
              />
              <StatCard
                icon={TrendingUp}
                label="MCQ Questions"
                value={questions.filter(q => q.type !== 'coding').length}
                gradient="from-rose-500 to-pink-500"
                linkTo="/teacher/mcq"
                linkLabel="Open library"
              />
            </>
          )}
        </div>

        {/* Session status */}
        <div className="mb-8">
          <SessionStatus />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Questions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-900">Recent Questions</h2>
              </div>
              <Link to="/teacher/mcq" className="text-xs text-violet-600 hover:text-violet-800 font-medium">
                View all →
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-4 space-y-3">
                  <SkeletonRow /><SkeletonRow /><SkeletonRow />
                </div>
              ) : questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <BookOpen size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">No questions yet</p>
                  <p className="text-xs text-gray-400 mb-4">Start building your question bank</p>
                  <Link
                    to="/teacher/create-question"
                    className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    Create First Question
                  </Link>
                </div>
              ) : (
                questions.slice(0, 6).map((q, i) => {
                  const diff = difficultyConfig[q.difficulty] || difficultyConfig.easy;
                  return (
                    <div key={q._id || i} className="px-5 py-3 hover:bg-gray-50/70 transition-colors group">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-gray-800 line-clamp-1 flex-1">{q.question}</p>
                        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${diff.cls}`}>
                          {diff.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{q.category}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Exams */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-violet-500" />
                <h2 className="text-sm font-semibold text-gray-900">Recent Exams</h2>
              </div>
              <Link to="/teacher/exams" className="text-xs text-violet-600 hover:text-violet-800 font-medium">
                Manage all →
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-4 space-y-3">
                  <SkeletonRow /><SkeletonRow /><SkeletonRow />
                </div>
              ) : exams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <FileText size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">No exams yet</p>
                  <p className="text-xs text-gray-400 mb-4">Create your first exam to get started</p>
                  <Link
                    to="/teacher/create-exam"
                    className="px-4 py-2 rounded-xl bg-violet-50 text-violet-700 text-xs font-medium hover:bg-violet-100 transition-colors"
                  >
                    Create First Exam
                  </Link>
                </div>
              ) : (
                exams.slice(0, 6).map((exam, i) => (
                  <div key={exam._id || i} className="px-5 py-3 hover:bg-gray-50/70 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{exam.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={10} /> {exam.duration}m
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Users size={10} /> {exam.questionsCount || exam.questions?.length || 0} Qs
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <BarChart3 size={10} /> {exam.totalMarks} marks
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                        exam.isActive
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        {exam.isActive ? <CheckCircle size={9} /> : <Clock size={9} />}
                        {exam.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
