import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { TeacherLayout } from '../../components/ui/DarkLayout';
import { questionAPI, examAPI, codingQuestionAPI } from '../../services/api';
import {
  Code2, FileText, ListChecks, BarChart3, Shield, Eye,
  Plus, ChevronRight, Activity, Zap, CheckCircle2, RefreshCw,
  BookOpen, Clock, TrendingUp, AlertCircle, ArrowUpRight, Layers,
  Users, Star, Globe, Lock
} from 'lucide-react';
import type { Question, Exam, CodingQuestion } from '../../types';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';

// Animated counter hook
function useCounter(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// Metric Card
const MetricCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  sub: string;
  badge?: string;
  badgeColor?: string;
  accent: string;
  glow: string;
  link: string;
}> = ({ icon: Icon, label, value, sub, badge, badgeColor, accent, glow, link }) => {
  const count = useCounter(value);
  return (
    <Link to={link} className="group block">
      <div
        className="relative rounded-2xl p-6 transition-all duration-300 overflow-hidden h-full"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.055)';
          (e.currentTarget as HTMLElement).style.borderColor = `${accent}44`;
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${glow}`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
      >
        {/* Top glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />

        <div className="flex items-start justify-between mb-5">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
          >
            <Icon size={19} style={{ color: accent }} />
          </div>
          {badge && (
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{
                background: `${badgeColor || accent}18`,
                color: badgeColor || accent,
                border: `1px solid ${badgeColor || accent}30`
              }}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="text-4xl font-black text-white tabular-nums tracking-tight mb-1.5">
          {count}
        </div>
        <div className="text-sm font-semibold" style={{ color: 'rgba(240,240,245,0.7)' }}>{label}</div>
        <div className="text-xs mt-1" style={{ color: 'rgba(240,240,245,0.35)' }}>{sub}</div>

        <div
          className="flex items-center gap-1 mt-4 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ color: accent }}
        >
          View details <ArrowUpRight size={12} />
        </div>
      </div>
    </Link>
  );
};

// Skeleton
const SkeletonMetric = () => (
  <div className="rounded-2xl p-6 h-44 skeleton" style={{ border: '1px solid rgba(255,255,255,0.04)' }} />
);

const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
    <div className="h-10 w-10 rounded-xl skeleton flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 skeleton rounded-lg w-2/3" />
      <div className="h-2.5 skeleton rounded-lg w-1/3" />
    </div>
    <div className="h-8 w-24 skeleton rounded-xl" />
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mcqQuestions, setMcqQuestions] = useState<Question[]>([]);
  const [codingQuestions, setCodingQuestions] = useState<CodingQuestion[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [mcqData, codingData, examsData, analyticsRes] = await Promise.all([
        questionAPI.getAll().catch(() => []),
        codingQuestionAPI.getAll({ limit: 100 }).then(res => res.questions).catch(() => []),
        examAPI.getAll().catch(() => []),
        examAPI.getAnalytics().catch(() => null),
      ]);

      const myMcqs = (Array.isArray(mcqData) ? mcqData : []).filter(
        (q: Question) => !q.createdBy || String(q.createdBy) === String(user.id)
      );

      const uniqueMap = new Map();
      (Array.isArray(examsData) ? examsData : []).forEach((e: Exam) => {
        const id = e._id || e.id;
        if (id && (!e.createdBy || String(e.createdBy) === String(user.id))) {
          if (!uniqueMap.has(id)) uniqueMap.set(id, e);
        }
      });
      const myExams = Array.from(uniqueMap.values());

      setMcqQuestions(myMcqs);
      setCodingQuestions(codingData || []);
      setExams(myExams);
      setAnalytics(analyticsRes?.analytics || null);
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', title: 'Load Failed', message: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };
  const activeExams = exams.filter(e => e.isActive);

  return (
    <TeacherLayout>
      <TeacherNavbar />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Hero Header ── */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="h-1.5 w-8 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #8b5cf6, #6366f1)' }}
                />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>
                  Assessment Control Center
                </span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {greeting},{' '}
                <span className="gradient-text">{firstName}</span>
              </h1>
              <p className="text-sm mt-2" style={{ color: 'rgba(240,240,245,0.4)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {activeExams.length > 0 && (
                  <span style={{ color: '#34d399' }}> · {activeExams.length} exam{activeExams.length > 1 ? 's' : ''} live now</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: refreshing ? '#8b5cf6' : 'rgba(240,240,245,0.6)',
                }}
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <Link
                to="/teacher/create-exam"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  boxShadow: '0 4px 24px rgba(139,92,246,0.35)',
                }}
              >
                <Zap size={15} />
                New Assessment
              </Link>
            </div>
          </div>
        </div>

        {/* ── Primary Metrics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            <><SkeletonMetric /><SkeletonMetric /><SkeletonMetric /><SkeletonMetric /></>
          ) : (
            <>
              <MetricCard
                icon={FileText}
                label="Total Assessments"
                value={analytics?.totalExams ?? exams.length}
                sub={`${analytics?.activeExams ?? activeExams.length} currently active`}
                accent="#8b5cf6"
                glow="rgba(139,92,246,0.12)"
                link="/teacher/exams"
              />
              <MetricCard
                icon={Activity}
                label="Live Exams"
                value={analytics?.activeExams ?? activeExams.length}
                sub="Candidates can access now"
                badge={(analytics?.activeExams ?? activeExams.length) > 0 ? 'Live' : 'Idle'}
                badgeColor={(analytics?.activeExams ?? activeExams.length) > 0 ? '#34d399' : '#8b8ba0'}
                accent="#10b981"
                glow="rgba(16,185,129,0.12)"
                link="/teacher/exams"
              />
              <MetricCard
                icon={ListChecks}
                label="MCQ Questions"
                value={analytics?.totalMcqs ?? mcqQuestions.length}
                sub="Multiple choice bank"
                accent="#06b6d4"
                glow="rgba(6,182,212,0.12)"
                link="/teacher/mcq"
              />
              <MetricCard
                icon={Code2}
                label="Coding Challenges"
                value={analytics?.totalCoding ?? codingQuestions.length}
                sub="Algorithm problems"
                accent="#6366f1"
                glow="rgba(99,102,241,0.12)"
                link="/teacher/coding-questions"
              />
            </>
          )}
        </div>

        {/* ── Subjective Metrics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {loading ? (
            <><SkeletonMetric /><SkeletonMetric /><SkeletonMetric /><SkeletonMetric /></>
          ) : (
            <>
              {[
                { label: 'Subjective Questions', value: analytics?.subjectiveQuestionsCount ?? 0, sub: 'Descriptive Q&A bank', accent: '#a78bfa', icon: BookOpen, link: '/teacher/subjective-questions' },
                { label: 'Pending Grading', value: analytics?.pendingEvaluationCount ?? 0, sub: 'Awaiting your review', accent: '#fbbf24', badge: (analytics?.pendingEvaluationCount ?? 0) > 0 ? 'Action Required' : undefined, badgeColor: '#fbbf24', icon: AlertCircle, link: '/teacher/subjective-questions' },
                { label: 'Graded Answers', value: analytics?.evaluatedCount ?? 0, sub: 'Evaluations completed', accent: '#34d399', icon: CheckCircle2, link: '/teacher/subjective-questions' },
                { label: 'Review Queue', value: analytics?.manualReviewQueueCount ?? 0, sub: 'In grading pipeline', accent: '#818cf8', icon: Layers, link: '/teacher/subjective-questions' },
              ].map((m, i) => (
                <MetricCard key={i} icon={m.icon} label={m.label} value={m.value} sub={m.sub}
                  badge={m.badge} badgeColor={m.badgeColor} accent={m.accent}
                  glow={`${m.accent}20`} link={m.link} />
              ))}
            </>
          )}
        </div>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Active Exam Monitor */}
          <div
            className="lg:col-span-2 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-2 w-2 rounded-full pulse-dot"
                  style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }}
                />
                <h2 className="text-sm font-bold text-white">Live Exam Monitor</h2>
                {!loading && (
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}
                  >
                    {activeExams.length} active
                  </span>
                )}
              </div>
              <Link
                to="/teacher/exams"
                className="flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: '#8b5cf6' }}
              >
                All assessments <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-3">
                  <SkeletonRow /><SkeletonRow /><SkeletonRow />
                </div>
              ) : activeExams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
                  >
                    <CheckCircle2 size={28} style={{ color: '#8b5cf6' }} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">No live exams right now</h3>
                  <p className="text-xs text-center max-w-xs" style={{ color: 'rgba(240,240,245,0.4)' }}>
                    Activate an existing assessment or create a new one to begin.
                  </p>
                  <Link
                    to="/teacher/create-exam"
                    className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                  >
                    <Plus size={13} /> Create Assessment
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeExams.slice(0, 6).map((exam) => {
                    const id = exam._id || exam.id;
                    return (
                      <div
                        key={id}
                        className="group flex items-center justify-between p-4 rounded-xl transition-all duration-200 cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.06)';
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.2)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                        }}
                        onClick={() => navigate(`/teacher/exams/${id}/results`)}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
                          >
                            <FileText size={16} style={{ color: '#8b5cf6' }} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{exam.title}</div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs" style={{ color: 'rgba(240,240,245,0.4)' }}>
                                <Clock size={11} className="inline mr-1" />{exam.duration}m
                              </span>
                              <span className="text-xs" style={{ color: 'rgba(240,240,245,0.4)' }}>
                                {exam.totalMarks} marks
                              </span>
                              <span className="text-xs" style={{ color: 'rgba(240,240,245,0.4)' }}>
                                {(exam as any).questionsCount || exam.questions?.length || 0} questions
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/teacher/exams/${id}/results`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all"
                          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                        >
                          <BarChart3 size={12} /> Analytics
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Security Card */}
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.1) 100%)',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
            >
              <div
                className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl"
                style={{ background: 'rgba(139,92,246,0.2)' }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={15} style={{ color: '#a78bfa' }} />
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#a78bfa' }}>
                    SEB Security
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  Safe Exam Browser Active
                </h3>
                <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(240,240,245,0.55)' }}>
                  Full-screen enforcement, tab-switch logging, copy-paste detection, and back-button traps are active for all candidates.
                </p>
                <Link
                  to="/teacher/exams"
                  className="inline-flex items-center gap-1.5 text-xs font-bold transition-all"
                  style={{ color: '#a78bfa' }}
                >
                  Configure policies <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <h3 className="text-sm font-bold text-white">Quick Access</h3>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { to: '/teacher/mcq', label: 'MCQ Library', count: mcqQuestions.length, icon: ListChecks, color: '#06b6d4' },
                  { to: '/teacher/coding-questions', label: 'Coding Challenges', count: codingQuestions.length, icon: Code2, color: '#6366f1' },
                  { to: '/teacher/subjective-questions', label: 'Subjective Questions', count: analytics?.subjectiveQuestionsCount ?? 0, icon: BookOpen, color: '#a78bfa' },
                  { to: '/teacher/exams', label: 'All Assessments', count: exams.length, icon: Eye, color: '#10b981' },
                ].map(({ to, label, count, icon: Icon, color }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group"
                    style={{ color: 'rgba(240,240,245,0.6)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,245,0.6)';
                    }}
                  >
                    <span className="flex items-center gap-2.5 text-sm font-medium">
                      <Icon size={14} style={{ color }} />
                      {label}
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-lg"
                      style={{ background: `${color}18`, color }}
                    >
                      {loading ? '—' : count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Create CTA */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h3 className="text-sm font-bold text-white mb-3">Start Building</h3>
              <div className="space-y-2">
                <Link
                  to="/teacher/create-exam"
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 20px rgba(139,92,246,0.25)' }}
                >
                  <Zap size={13} /> Create New Assessment
                </Link>
                <Link
                  to="/teacher/create-question"
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(240,240,245,0.7)'
                  }}
                >
                  <Plus size={13} /> Add MCQ Question
                </Link>
                <Link
                  to="/teacher/coding-questions/create"
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(240,240,245,0.7)'
                  }}
                >
                  <Code2 size={13} /> Add Coding Challenge
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </TeacherLayout>
  );
};

export default Dashboard;