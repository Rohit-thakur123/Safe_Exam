// Student Dashboard — Phase 8: Premium enterprise redesign
// Glassmorphism stat cards, skeleton loaders, exam cards with pill badges,
// results table with pass/fail indicators, responsive layout.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SessionStatus } from '../../components/SessionStatus';
import { examAPI, examAttemptAPI } from '../../services/api';
import {
  LogOut, BookOpen, Clock, Award, Shield, ChevronRight,
  CheckCircle2, XCircle, Mail, BarChart3, TrendingUp, AlertCircle
} from 'lucide-react';
import type { Exam, ExamAttempt } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl bg-white/50 border border-gray-100 p-6 h-28" />
);

const SkeletonRow = () => (
  <div className="animate-pulse flex items-center gap-4 px-4 py-3.5 rounded-xl bg-gray-50 mb-2">
    <div className="h-4 bg-gray-200 rounded w-1/3" />
    <div className="h-4 bg-gray-100 rounded w-20 ml-auto" />
    <div className="h-4 bg-gray-100 rounded w-16" />
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [examsResponse, attemptsResponse] = await Promise.all([
          examAPI.getAll(),
          examAttemptAPI.getByStudent(user.id)
        ]);
        setExams(Array.isArray(examsResponse) ? examsResponse : []);
        setAttempts(Array.isArray(attemptsResponse?.attempts) ? attemptsResponse.attempts : []);
      } catch {
        setError('Failed to load dashboard data');
        setExams([]);
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const completedAttempts = attempts.filter(a => a.status === 'completed');
  const activeExams = exams.filter(e => e.isActive);
  const totalScore = completedAttempts.reduce((s, a) => s + (a.score || 0), 0);
  const avgScore = completedAttempts.length > 0
    ? Math.round(totalScore / completedAttempts.length)
    : null;
  const passRate = completedAttempts.length > 0
    ? Math.round((completedAttempts.filter(a => a.passed).length / completedAttempts.length) * 100)
    : null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                <Shield size={16} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 leading-none">SecureExam</span>
                <span className="text-[10px] text-gray-500 leading-none mt-0.5">Student Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-800">{user?.name}</span>
                <span className="text-[11px] text-gray-500">Student</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your exams and performance below.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : (
            <>
              {/* Available Exams */}
              <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm mb-4">
                  <BookOpen size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{activeExams.length}</p>
                <p className="text-sm text-gray-600 mt-0.5">Available Exams</p>
                <p className="text-xs text-gray-400 mt-1">Check email for secure links</p>
              </div>

              {/* Completed */}
              <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-sm mb-4">
                  <CheckCircle2 size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{completedAttempts.length}</p>
                <p className="text-sm text-gray-600 mt-0.5">Completed Exams</p>
                {passRate !== null && (
                  <p className="text-xs text-gray-400 mt-1">{passRate}% pass rate</p>
                )}
              </div>

              {/* Average Score */}
              <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm mb-4">
                  <Award size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
                  {avgScore !== null ? `${avgScore}` : '—'}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">Avg Score</p>
                <p className="text-xs text-gray-400 mt-1">Across all completed exams</p>
              </div>

              {/* Pass Rate */}
              <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm mb-4">
                  <TrendingUp size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
                  {passRate !== null ? `${passRate}%` : '—'}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">Pass Rate</p>
                <p className="text-xs text-gray-400 mt-1">
                  {completedAttempts.filter(a => a.passed).length} of {completedAttempts.length} passed
                </p>
              </div>
            </>
          )}
        </div>

        {/* Session status */}
        <div className="mb-8">
          <SessionStatus />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Available Exams (wider) ── */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-900">Available Exams</h2>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                {activeExams.length} active
              </span>
            </div>

            {loading ? (
              <div className="p-4">
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </div>
            ) : activeExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <BookOpen size={20} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">No exams available yet</p>
                <p className="text-xs text-gray-400">Your teacher will notify you when an exam is ready.</p>
              </div>
            ) : (
              <>
                {/* Instructions Banner */}
                <div className="mx-4 mt-4 mb-3 flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                  <Mail size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800">How to start an exam</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      You'll receive a unique secure link via email. Open it in Safe Exam Browser to begin.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {activeExams.map((exam) => {
                    const completed = completedAttempts.find(a => a.examId === (exam.id || exam._id));
                    return (
                      <div key={exam.id || exam._id} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{exam.title}</p>
                            {exam.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{exam.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={10} /> {exam.duration}m
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <BarChart3 size={10} /> {exam.totalMarks} marks
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <BookOpen size={10} /> {exam.questions?.length || 0} questions
                              </span>
                            </div>
                          </div>
                          {completed ? (
                            <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={9} /> Submitted
                            </span>
                          ) : (
                            <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                              <Mail size={9} /> Check Email
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* ── Recent Results (narrower) ── */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-violet-500" />
                <h2 className="text-sm font-semibold text-gray-900">Recent Results</h2>
              </div>
            </div>

            {loading ? (
              <div className="p-4">
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </div>
            ) : completedAttempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <Award size={20} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">No results yet</p>
                <p className="text-xs text-gray-400">Complete an exam to see your scores here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {completedAttempts.slice(0, 8).map((attempt) => {
                  const exam = exams.find(e => (e.id || e._id) === attempt.examId);
                  return (
                    <button
                      key={attempt.id}
                      onClick={() => navigate(`/student/result/${attempt.id}`)}
                      className="w-full px-5 py-3.5 hover:bg-gray-50/70 transition-colors text-left group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {exam?.title || 'Exam'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                            {attempt.score}/{attempt.totalMarks} · {attempt.percentage}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            attempt.passed
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}>
                            {attempt.passed ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                            {attempt.passed ? 'Pass' : 'Fail'}
                          </span>
                          <ChevronRight size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
