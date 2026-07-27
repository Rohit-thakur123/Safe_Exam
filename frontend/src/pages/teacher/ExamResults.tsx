import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { TeacherLayout } from '../../components/ui/DarkLayout';
import { examAPI, examAttemptAPI, codingExecutionAPI } from '../../services/api';
import {
  ArrowLeft, BarChart3, Shield, Download, Search, Eye, Code2,
  X, CheckCircle2, XCircle, Users, TrendingUp, Target,
  AlertTriangle, BookOpen
} from 'lucide-react';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';

interface CandidateAttempt {
  id: string; status: string;
  terminationReason?: string;
  subjectiveStatus?: 'not_applicable' | 'pending_evaluation' | 'evaluated';
  subjectiveScore?: number;
  student: { id: string; name: string; email: string; };
  score: number; totalMarks: number; percentage: number; passed: boolean;
  submittedAt: string; startTime?: string; timeSpent: number;
  violationSummary: { tabSwitches: number; windowBlurs: number; copyAttempts: number; pasteAttempts: number; devToolsAttempts: number; totalViolations: number; };
  violations?: Array<{ type: string; timestamp: string; details?: string }>;
}

const ExamResults: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<any>(null);
  const [attempts, setAttempts] = useState<CandidateAttempt[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [codingSubmissions, setCodingSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAttempt | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => { if (examId) fetchData(); }, [examId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examData, attemptsRes, submissionsRes] = await Promise.all([
        examAPI.getById(examId!).catch(() => null),
        examAttemptAPI.getByExam(examId!).catch(() => ({ attempts: [], statistics: null })),
        codingExecutionAPI.getExamSubmissions(examId!).catch(() => [])
      ]);
      setExam(examData);
      setAttempts(attemptsRes.attempts || []);
      setStats(attemptsRes.statistics || null);
      setCodingSubmissions(submissionsRes || []);
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', message: err.message || 'Failed to load results' });
    } finally { setLoading(false); }
  };

  const filteredAttempts = useMemo(() => attempts.filter(a => {
    const q = searchQuery.toLowerCase();
    return !q || a.student.name.toLowerCase().includes(q) || a.student.email.toLowerCase().includes(q);
  }), [attempts, searchQuery]);

  const candidateSubmissions = useMemo(() => {
    if (!selectedCandidate) return [];
    return codingSubmissions.filter(sub =>
      sub.studentId?.email === selectedCandidate.student.email ||
      (sub.studentId as any)?._id === selectedCandidate.student.id
    );
  }, [selectedCandidate, codingSubmissions]);

  const exportToCSV = () => {
    if (!attempts.length) return;
    const headers = ['Name', 'Email', 'Status', 'Score', 'Total', 'Percentage', 'Result', 'Violations', 'Submitted'];
    const rows = attempts.map(a => [
      `"${a.student.name}"`, `"${a.student.email}"`, a.status,
      a.score, a.totalMarks, `${a.percentage}%`, a.passed ? 'PASSED' : 'FAILED',
      a.violationSummary?.totalViolations || 0, `"${new Date(a.submittedAt).toLocaleString()}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${exam?.title || 'exam'}_results.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setToast({ id: Date.now().toString(), type: 'success', message: 'CSV exported' });
  };

  const passedCount = attempts.filter(a => a.passed && a.status === 'completed').length;
  const completedCount = attempts.filter(a => a.status === 'completed').length;
  const passRate = completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : 0;

  return (
    <TeacherLayout>
      <TeacherNavbar />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link to="/teacher/exams" className="inline-flex items-center gap-1.5 text-xs font-semibold mb-4 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--tint-purple-text)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}>
            <ArrowLeft size={14} /> Back to Assessments
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="h-1.5 w-8 rounded-full" style={{ background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-indigo))' }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-purple)' }}>Results & Analytics</span>
              </div>
              <h1 className="text-2xl font-black text-heading">{loading ? 'Loading...' : exam?.title || 'Exam Results'}</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {attempts.length} candidates · {completedCount} completed · {passRate}% pass rate
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              {exam && (
                <Link to={`/teacher/exams/${examId}/grade-subjective`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))', boxShadow: '0 4px 20px color-mix(in srgb, var(--accent-purple) 30%, transparent)' }}>
                  <BookOpen size={14} /> Grade Subjective
                </Link>
              )}
              <button onClick={exportToCSV} disabled={!attempts.length}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'var(--border)', border: '1px solid var(--border-hover)', color: 'var(--text-secondary)' }}>
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Candidates', value: attempts.length, icon: Users, accent: 'var(--accent-purple)', glow: 'color-mix(in srgb, var(--accent-purple) 12%, transparent)' },
              { label: 'Avg Score', value: stats ? `${Math.round(stats.averageScore)}%` : '—', icon: BarChart3, accent: 'var(--accent-cyan)', glow: 'color-mix(in srgb, var(--accent-cyan) 12%, transparent)' },
              { label: 'Pass Rate', value: `${passRate}%`, icon: TrendingUp, accent: 'var(--accent-emerald)', glow: 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)' },
              { label: 'Highest Score', value: stats ? `${Math.round(stats.highestScore)}` : '—', icon: Target, accent: 'var(--accent-indigo)', glow: 'color-mix(in srgb, var(--accent-indigo) 12%, transparent)' },
            ].map(({ label, value, icon: Icon, accent, glow }) => (
              <div key={label} className="rounded-2xl p-5 relative overflow-hidden group transition-all duration-300"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${accent}40`; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${glow}`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
                    <Icon size={16} style={{ color: accent }} />
                  </div>
                </div>
                <div className="text-2xl font-black text-heading tabular-nums">{value}</div>
                <div className="text-xs mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidates by name or email..." className="input-dark pl-10" />
        </div>

        {/* Candidates table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {/* Table header */}
          <div className="grid grid-cols-12 px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
            style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--bg-card-hover)', color: 'var(--text-muted)' }}>
            <div className="col-span-4">Candidate</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Score</div>
            <div className="col-span-2">Result</div>
            <div className="col-span-1">Violations</div>
            <div className="col-span-1 text-right">Detail</div>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl skeleton" />)}
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users size={32} className="mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-semibold text-heading mb-1">No candidates found</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {searchQuery ? `No results for "${searchQuery}"` : 'No candidates have attempted this exam yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--bg-card)' }}>
              {filteredAttempts.map(attempt => (
                <div key={attempt.id}
                  className="grid grid-cols-12 items-center px-5 py-4 transition-colors group cursor-pointer"
                  style={{ borderColor: 'var(--bg-card)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  onClick={() => setSelectedCandidate(attempt)}
                >
                  {/* Candidate */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))' }}>
                      {attempt.student.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-heading truncate">{attempt.student.name}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{attempt.student.email}</div>
                    </div>
                  </div>
                  {/* Status */}
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: attempt.status === 'completed' ? 'color-mix(in srgb, var(--accent-emerald) 10%, transparent)' : 'color-mix(in srgb, var(--accent-amber) 10%, transparent)',
                        color: attempt.status === 'completed' ? 'var(--tint-emerald-text)' : 'var(--tint-amber-text)',
                        border: `1px solid ${attempt.status === 'completed' ? 'color-mix(in srgb, var(--accent-emerald) 25%, transparent)' : 'color-mix(in srgb, var(--accent-amber) 25%, transparent)'}`,
                      }}>
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: attempt.status === 'completed' ? 'var(--tint-emerald-text)' : attempt.status === 'terminated' ? 'var(--tint-rose-text)' : 'var(--tint-amber-text)' }} />
                      {attempt.status === 'completed' ? 'Completed' : attempt.status === 'terminated' ? 'Terminated' : 'In Progress'}
                    </span>
                    {attempt.subjectiveStatus === 'pending_evaluation' && (
                      <span className="mt-1 inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'color-mix(in srgb, var(--accent-amber) 10%, transparent)', color: 'var(--tint-amber-text)', border: '1px solid color-mix(in srgb, var(--accent-amber) 20%, transparent)' }}>
                        Grading Pending
                      </span>
                    )}
                  </div>
                  {/* Score */}
                  <div className="col-span-2">
                    <span className="text-sm font-bold text-heading">{attempt.score}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}> / {attempt.totalMarks}</span>
                  </div>
                  {/* Result */}
                  <div className="col-span-2">
                    {attempt.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold"
                        style={{ color: attempt.passed ? 'var(--tint-emerald-text)' : 'var(--tint-rose-text)' }}>
                        {attempt.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {attempt.percentage}% {attempt.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </div>
                  {/* Violations */}
                  <div className="col-span-1">
                    {(attempt.violationSummary?.totalViolations || 0) > 0 ? (
                      <span className="text-xs font-bold" style={{ color: 'var(--tint-amber-text)' }}>
                        <AlertTriangle size={12} className="inline mr-1" />
                        {attempt.violationSummary.totalViolations}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>0</span>
                    )}
                  </div>
                  {/* Detail */}
                  <div className="col-span-1 flex justify-end">
                    <button className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      style={{ background: 'color-mix(in srgb, var(--accent-purple) 12%, transparent)', color: 'var(--tint-purple-text)' }}
                      onClick={e => { e.stopPropagation(); setSelectedCandidate(attempt); }}>
                      <Eye size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Candidate Detail Drawer */}
      {selectedCandidate && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedCandidate(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto"
            style={{ background: 'rgba(13,13,20,0.99)', borderLeft: '1px solid var(--border-hover)', boxShadow: '-20px 0 80px rgba(0,0,0,0.5)' }}>
            {/* Drawer header */}
            <div className="sticky top-0 z-10 px-6 py-5 flex items-start justify-between"
              style={{ background: 'rgba(13,13,20,0.98)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))' }}>
                    {selectedCandidate.student.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-heading">{selectedCandidate.student.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedCandidate.student.email}</div>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'var(--border-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Termination Notice */}
              {selectedCandidate.status === 'terminated' && (
                <div className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, var(--accent-rose) 10%, transparent)', border: '1px solid var(--accent-rose)' }}>
                  <div className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: 'var(--tint-rose-text)' }}>
                    <AlertTriangle size={16} /> Exam Terminated Due To Security Violation
                  </div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--tint-rose-text)' }}>
                    Reason: {selectedCandidate.terminationReason || 'Policy limit exceeded'}
                  </div>
                </div>
              )}

              {/* Score overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-5" style={{ background: 'color-mix(in srgb, var(--accent-purple) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-purple) 18%, transparent)' }}>
                  <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'rgba(167,139,250,0.7)' }}>Total Score</div>
                  <div className="text-3xl font-black" style={{ color: 'var(--tint-purple-text)' }}>
                    {selectedCandidate.score}<span className="text-base font-semibold opacity-60"> / {selectedCandidate.totalMarks}</span>
                  </div>
                </div>
                <div className="rounded-2xl p-5" style={{
                  background: selectedCandidate.passed ? 'color-mix(in srgb, var(--accent-emerald) 8%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 8%, transparent)',
                  border: `1px solid ${selectedCandidate.passed ? 'color-mix(in srgb, var(--accent-emerald) 20%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 20%, transparent)'}`,
                }}>
                  <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: selectedCandidate.passed ? 'rgba(52,211,153,0.7)' : 'rgba(251,113,133,0.7)' }}>Result</div>
                  <div className="text-3xl font-black" style={{ color: selectedCandidate.passed ? 'var(--tint-emerald-text)' : 'var(--tint-rose-text)' }}>
                    {selectedCandidate.percentage}%
                  </div>
                  <div className="text-xs font-bold mt-1" style={{ color: selectedCandidate.passed ? 'var(--tint-emerald-text)' : 'var(--tint-rose-text)' }}>
                    {selectedCandidate.passed ? '✓ PASSED' : '✗ FAILED'}
                  </div>
                </div>
              </div>

              {/* Marks Breakdown */}
              {exam && (() => {
                const codingTotal = (exam.codingQuestions || []).reduce((s: number, q: any) => s + (q.marks || 0), 0);
                const subjectiveTotal = (exam.descriptiveQuestions || []).reduce((s: number, q: any) => s + (q.maxMarks || 0), 0);
                const mcqTotal = (exam.totalMarks || 0) - codingTotal - subjectiveTotal;
                const codingEarned = candidateSubmissions.reduce((s, sub) => s + (sub.score || 0), 0);
                const subjectiveEarned = selectedCandidate?.subjectiveScore || 0;
                const mcqEarned = Math.max(0, (selectedCandidate?.score || 0) - codingEarned - subjectiveEarned);
                const rows = [
                  { label: 'MCQ', earned: mcqEarned, total: mcqTotal, bar: '#7c3aed', text: 'var(--tint-purple-text)' },
                  { label: 'Coding', earned: codingEarned, total: codingTotal, bar: '#4f46e5', text: 'var(--tint-indigo-text)' },
                  { label: 'Subjective', earned: subjectiveEarned, total: subjectiveTotal, bar: '#9333ea', text: '#c084fc' },
                ].filter(r => r.total > 0);
                return rows.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <BarChart3 size={13} style={{ color: 'var(--accent-purple)' }} /> Marks Breakdown
                    </h4>
                    <div className="space-y-3">
                      {rows.map(row => (
                        <div key={row.label} className="flex items-center gap-3">
                          <span className="text-xs font-semibold w-20 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                          <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ background: 'var(--border)' }}>
                            <div className="h-2 rounded-full transition-all duration-700"
                              style={{ width: row.total > 0 ? `${Math.min(100,(row.earned/row.total)*100)}%` : '0%', backgroundColor: row.bar }} />
                          </div>
                          <span className="text-xs font-bold w-16 text-right flex-shrink-0" style={{ color: row.text }}>
                            {row.earned} / {row.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Security Log */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Shield size={13} style={{ color: 'var(--tint-rose-text)' }} /> Security Violation Log
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Tab Switches', value: selectedCandidate.violationSummary?.tabSwitches || 0 },
                    { label: 'Window Blurs', value: selectedCandidate.violationSummary?.windowBlurs || 0 },
                    { label: 'Fullscreen Exits', value: selectedCandidate.violationSummary?.fullscreenExits || 0 },
                    { label: 'Copy/Paste', value: (selectedCandidate.violationSummary?.copyAttempts || 0) + (selectedCandidate.violationSummary?.pasteAttempts || 0) },
                    { label: 'Right Clicks', value: selectedCandidate.violationSummary?.rightClicks || 0 },
                    { label: 'DevTools', value: selectedCandidate.violationSummary?.devToolsAttempts || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-3 text-center" style={{
                      background: value > 0 ? 'color-mix(in srgb, var(--accent-rose) 8%, transparent)' : 'var(--bg-card)',
                      border: `1px solid ${value > 0 ? 'color-mix(in srgb, var(--accent-rose) 20%, transparent)' : 'var(--border)'}`,
                    }}>
                      <div className="text-xl font-black" style={{ color: value > 0 ? 'var(--tint-rose-text)' : 'var(--text-secondary)' }}>{value}</div>
                      <div className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coding Submissions */}
              {candidateSubmissions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Code2 size={13} style={{ color: 'var(--accent-indigo)' }} /> Coding Submissions
                  </h4>
                  <div className="space-y-3">
                    {candidateSubmissions.map((sub, i) => (
                      <div key={i} className="rounded-xl p-4" style={{ background: 'color-mix(in srgb, var(--accent-indigo) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-indigo) 15%, transparent)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-heading">{sub.questionTitle || 'Coding Problem'}</span>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: (sub.passedTestCases || 0) > 0 ? 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 12%, transparent)', color: (sub.passedTestCases || 0) > 0 ? 'var(--tint-emerald-text)' : 'var(--tint-rose-text)' }}>
                            Passed {sub.passedTestCases || 0}/{sub.totalTestCases || 0} testcases
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                          <span>Lang: {sub.language || 'N/A'}</span>
                          <span>Time: {sub.executionTime || '—'} ms</span>
                          <span>Memory: {sub.memoryUsed || '—'} KB</span>
                        </div>
                        {sub.code && (
                          <pre className="text-xs p-3 rounded-lg overflow-x-auto" style={{ background: 'rgba(0,0,0,0.4)', color: 'var(--tint-purple-text)', fontFamily: 'monospace' }}>
                            <code>{sub.code.slice(0, 300)}{sub.code.length > 300 ? '...' : ''}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </TeacherLayout>
  );
};

export default ExamResults;