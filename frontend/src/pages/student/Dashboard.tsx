// Student Dashboard — Full theme-aware implementation
// All colors driven by CSS variables — works correctly in both light and dark mode.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SessionStatus } from '../../components/SessionStatus';
import { examAPI, examAttemptAPI } from '../../services/api';
import {
  LogOut, BookOpen, Clock, Award, Shield, ChevronRight,
  CheckCircle2, XCircle, Mail, BarChart3, TrendingUp, AlertCircle,
  Sun, Moon, RefreshCw
} from 'lucide-react';
import type { Exam, ExamAttempt } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="skeleton rounded-2xl h-32" style={{ border: '1px solid var(--border)' }} />
);

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl skeleton mb-2" />
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const [examsResponse, attemptsResponse] = await Promise.all([
        examAPI.getAll(),
        examAttemptAPI.getByStudent(user.id)
      ]);
      const rawExams = Array.isArray(examsResponse) ? examsResponse : ((examsResponse as any)?.data || []);
      const uniqueExamsMap = new Map();
      rawExams.forEach((e: Exam) => {
        const id = e._id || e.id;
        if (id && !uniqueExamsMap.has(id)) uniqueExamsMap.set(id, e);
      });
      setExams(Array.from(uniqueExamsMap.values()));
      const attRes = attemptsResponse as any;
      setAttempts(Array.isArray(attRes?.attempts) ? attRes.attempts : (Array.isArray(attRes?.data) ? attRes.data : (Array.isArray(attRes) ? attRes : [])));
    } catch {
      setError('Failed to load dashboard data');
      setExams([]);
      setAttempts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const completedAttempts = attempts.filter(a => a.status === 'completed');
  const activeExams = exams.filter(e => e.isActive);
  const totalScore = completedAttempts.reduce((s, a) => s + (a.score || 0), 0);
  const avgScore = completedAttempts.length > 0
    ? Math.round(totalScore / completedAttempts.length)
    : null;
  const passRate = completedAttempts.length > 0
    ? Math.round((completedAttempts.filter(a => a.passed).length / completedAttempts.length) * 100)
    : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          background: 'var(--nav-bg-scrolled)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))', boxShadow: '0 0 20px var(--glow-purple)' }}
              >
                <Shield size={17} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none" style={{ color: 'var(--text-primary)' }}>SecureExam</span>
                <span className="text-[10px] font-medium leading-none mt-0.5" style={{ color: 'var(--accent-purple)' }}>Student Portal</span>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                className="p-2 rounded-xl transition-all duration-200 icon-btn"
                style={{ color: 'var(--text-secondary)' }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* Divider */}
              <div className="hidden sm:block h-6 w-px mx-1" style={{ background: 'var(--border)' }} />

              {/* User info */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>{user?.name}</span>
                <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Student</span>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 logout-btn"
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="h-1.5 w-8 rounded-full"
                  style={{ background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-indigo))' }}
                />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-purple)' }}>
                  Student Dashboard
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {greeting},{' '}
                <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span>
              </h1>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {activeExams.length > 0 && (
                  <span style={{ color: 'var(--tint-emerald-text)' }}> · {activeExams.length} exam{activeExams.length > 1 ? 's' : ''} available</span>
                )}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 self-start"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: refreshing ? 'var(--accent-purple)' : 'var(--text-secondary)',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div
            className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'color-mix(in srgb, var(--accent-rose) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-rose) 25%, transparent)',
              color: 'var(--tint-rose-text)',
            }}
          >
            <AlertCircle size={16} className="flex-shrink-0" />
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
              <div
                className="group rounded-2xl p-5 transition-all duration-300 relative overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--accent-purple) 30%, transparent)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'color-mix(in srgb, var(--accent-purple) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-purple) 25%, transparent)' }}
                >
                  <BookOpen size={18} style={{ color: 'var(--accent-purple)' }} />
                </div>
                <p className="text-2xl font-black tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>{activeExams.length}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>Available Exams</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Check email for secure links</p>
              </div>

              {/* Completed */}
              <div
                className="group rounded-2xl p-5 transition-all duration-300 relative overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--accent-emerald) 30%, transparent)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'color-mix(in srgb, var(--accent-emerald) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-emerald) 25%, transparent)' }}
                >
                  <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
                </div>
                <p className="text-2xl font-black tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>{completedAttempts.length}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>Completed Exams</p>
                {passRate !== null && (
                  <p className="text-xs mt-1" style={{ color: 'var(--tint-emerald-text)' }}>{passRate}% pass rate</p>
                )}
              </div>

              {/* Average Score */}
              <div
                className="group rounded-2xl p-5 transition-all duration-300 relative overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--accent-indigo) 30%, transparent)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'color-mix(in srgb, var(--accent-indigo) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-indigo) 25%, transparent)' }}
                >
                  <Award size={18} style={{ color: 'var(--accent-indigo)' }} />
                </div>
                <p className="text-2xl font-black tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {avgScore !== null ? avgScore : '—'}
                </p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>Avg Score</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Across all completed exams</p>
              </div>

              {/* Pass Rate */}
              <div
                className="group rounded-2xl p-5 transition-all duration-300 relative overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--accent-cyan) 30%, transparent)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'color-mix(in srgb, var(--accent-cyan) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-cyan) 25%, transparent)' }}
                >
                  <TrendingUp size={18} style={{ color: 'var(--accent-cyan)' }} />
                </div>
                <p className="text-2xl font-black tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {passRate !== null ? `${passRate}%` : '—'}
                </p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>Pass Rate</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
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
          <div
            className="lg:col-span-3 rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={16} style={{ color: 'var(--accent-purple)' }} />
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Available Exams</h2>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--accent-purple) 12%, transparent)',
                  color: 'var(--tint-purple-text)',
                  border: '1px solid color-mix(in srgb, var(--accent-purple) 25%, transparent)',
                }}
              >
                {activeExams.length} active
              </span>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </div>
            ) : activeExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: 'color-mix(in srgb, var(--accent-purple) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent-purple) 20%, transparent)',
                  }}
                >
                  <BookOpen size={22} style={{ color: 'var(--accent-purple)' }} />
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No exams available yet</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your teacher will notify you when an exam is ready.</p>
              </div>
            ) : (
              <>
                {/* Instructions Banner */}
                <div
                  className="mx-4 mt-4 mb-3 flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: 'color-mix(in srgb, var(--accent-indigo) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent-indigo) 20%, transparent)',
                  }}
                >
                  <Mail size={15} style={{ color: 'var(--tint-indigo-text)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--tint-indigo-text)' }}>How to start an exam</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      You'll receive a unique secure link via email. Open it in Safe Exam Browser to begin.
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {activeExams.map((exam) => {
                    const completed = completedAttempts.find(a => a.examId === (exam.id || exam._id));
                    return (
                      <div
                        key={exam.id || exam._id}
                        className="px-5 py-4 transition-colors hover-row"
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{exam.title}</p>
                            {exam.description && (
                              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{exam.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <Clock size={10} /> {exam.duration}m
                              </span>
                              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <BarChart3 size={10} /> {exam.totalMarks} marks
                              </span>
                              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <BookOpen size={10} /> {exam.questions?.length || 0} questions
                              </span>
                            </div>
                          </div>
                          {completed ? (
                            <span className="badge badge-emerald shrink-0">
                              <CheckCircle2 size={9} /> Submitted
                            </span>
                          ) : (
                            <span className="badge badge-purple shrink-0">
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
          <div
            className="lg:col-span-2 rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <Award size={16} style={{ color: 'var(--accent-indigo)' }} />
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Recent Results</h2>
              </div>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </div>
            ) : completedAttempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: 'color-mix(in srgb, var(--accent-indigo) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent-indigo) 20%, transparent)',
                  }}
                >
                  <Award size={22} style={{ color: 'var(--accent-indigo)' }} />
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No results yet</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Complete an exam to see your scores here.</p>
              </div>
            ) : (
              <div>
                {completedAttempts.slice(0, 8).map((attempt) => {
                  const exam = exams.find(e => (e.id || e._id) === attempt.examId);
                  const passed = attempt.passed;
                  return (
                    <button
                      key={attempt.id}
                      onClick={() => navigate(`/student/result/${attempt.id}`)}
                      className="w-full px-5 py-3.5 transition-colors text-left group hover-row"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {exam?.title || 'Exam'}
                          </p>
                          <p className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                            {attempt.score}/{attempt.totalMarks} · {attempt.percentage}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`badge ${passed ? 'badge-emerald' : 'badge-rose'}`}>
                            {passed ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                            {passed ? 'Pass' : 'Fail'}
                          </span>
                          <ChevronRight
                            size={12}
                            className="transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                          />
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
