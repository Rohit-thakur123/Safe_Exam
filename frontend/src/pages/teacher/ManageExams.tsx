import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { TeacherLayout } from '../../components/ui/DarkLayout';
import { examAPI } from '../../services/api';
import {
  FileText, Edit, Trash2, Plus, Users, BarChart3, Search, CheckCircle2,
  Share2, Copy, ToggleLeft, ToggleRight, Zap, Clock, Target, X, ArrowUpRight,
  Filter, BookOpen
} from 'lucide-react';
import type { Exam } from '../../types';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';

interface Student { id: string; name: string; email: string; }

// ── Assign Modal ─────────────────────────────────────────────────────────────
const AssignStudentsModal: React.FC<{ exam: Exam; onClose: () => void; onSuccess: () => void }> = ({ exam, onClose, onSuccess }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const examId = exam._id || exam.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsData, assignedData] = await Promise.all([
          examAPI.getStudents().catch(() => ({ students: [] })),
          examAPI.getAssignedStudents(exam._id || exam.id!).catch(() => ({ students: [] })),
        ]);
        setStudents(studentsData.students || []);
        const assignedList = (assignedData.students || []).map((s: any) => ({ id: s._id, name: s.name, email: s.email }));
        setSelectedStudents(assignedList.map((s: Student) => s.id));
      } catch { setError('Failed to load student directory'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [examId]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const response = await examAPI.assignStudents(exam._id || exam.id!, selectedStudents, sendEmailNotification);
      setSuccess(response.assignedCount !== undefined ? `Assigned ${response.assignedCount} candidate(s) successfully!` : 'Assignments updated!');
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update assignments');
    } finally { setSaving(false); }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'rgba(15,15,23,0.98)', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '85vh', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="text-base font-bold text-white">Assign Candidates</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(240,240,245,0.4)' }}>{exam.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(240,240,245,0.4)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,245,0.4)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl skeleton" />)}
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)', color: '#fb7185' }}>{error}</div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users size={32} className="mx-auto mb-3" style={{ color: 'rgba(240,240,245,0.2)' }} />
              <p className="text-sm" style={{ color: 'rgba(240,240,245,0.4)' }}>No student accounts registered yet</p>
            </div>
          ) : (
            <>
              {success && (
                <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                  <CheckCircle2 size={15} /> {success}
                </div>
              )}
              {/* Search */}
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(240,240,245,0.3)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search candidates..."
                  className="input-dark pl-9"
                />
              </div>
              {/* Select all */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ color: 'rgba(240,240,245,0.5)' }}>
                  <span className="font-bold text-white">{selectedStudents.length}</span> / {students.length} selected
                </span>
                <div className="flex gap-3">
                  <button onClick={() => setSelectedStudents(students.map(s => s.id))} className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>All</button>
                  <button onClick={() => setSelectedStudents([])} className="text-xs font-semibold" style={{ color: 'rgba(240,240,245,0.4)' }}>Clear</button>
                </div>
              </div>
              {/* List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filtered.map(student => {
                  const isSelected = selectedStudents.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudents(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id])}
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200"
                      style={{
                        background: isSelected ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">{student.name}</div>
                        <div className="text-xs" style={{ color: 'rgba(240,240,245,0.4)' }}>{student.email}</div>
                      </div>
                      {isSelected && <CheckCircle2 size={16} style={{ color: '#8b5cf6', flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>
              {/* Email toggle */}
              <div className="mt-4 pt-4 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div
                  className="relative h-5 w-9 rounded-full cursor-pointer transition-all flex-shrink-0"
                  style={{ background: sendEmailNotification ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}
                  onClick={() => setSendEmailNotification(!sendEmailNotification)}
                >
                  <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" style={{ left: sendEmailNotification ? '17px' : '2px' }} />
                </div>
                <label className="text-xs cursor-pointer" style={{ color: 'rgba(240,240,245,0.55)' }} onClick={() => setSendEmailNotification(!sendEmailNotification)}>
                  Send email invitations with SEB access links
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,240,245,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || loading}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2"
            style={{ background: saving ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}>
            {saving ? <><div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving...</> : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ManageExams ──────────────────────────────────────────────────────────
const ManageExams: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => { fetchExams(); }, [user]);

  const fetchExams = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await examAPI.getAll();
      const safeExams = Array.isArray(data) ? data : [];
      const myExams = safeExams.filter((e: Exam) => !e.createdBy || String(e.createdBy) === String(user.id));
      setExams(myExams);
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', message: err.response?.data?.error || 'Failed to load exams' });
    } finally { setLoading(false); }
  };

  const filteredExams = useMemo(() => exams.filter(e => {
    const matchesTab = activeTab === 'all' || (activeTab === 'active' ? e.isActive : !e.isActive);
    const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  }), [exams, activeTab, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this assessment? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await examAPI.delete(id);
      setExams(exams.filter(e => (e._id || e.id) !== id));
      setToast({ id: Date.now().toString(), type: 'success', message: 'Assessment deleted' });
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.code === 'EXAM_HAS_ATTEMPTS' && errorData?.canForceDelete) {
        if (window.confirm(`This exam has ${errorData.attemptsCount} attempt(s). Force delete all records?`)) {
          try {
            await examAPI.delete(id, true);
            setExams(exams.filter(e => (e._id || e.id) !== id));
            setToast({ id: Date.now().toString(), type: 'success', message: 'Force deleted' });
          } catch (fe: any) { setToast({ id: Date.now().toString(), type: 'error', message: fe.response?.data?.error || 'Force delete failed' }); }
        }
      } else { setToast({ id: Date.now().toString(), type: 'error', message: errorData?.error || 'Delete failed' }); }
    } finally { setDeleting(null); }
  };

  const handleToggleStatus = async (id: string) => {
    setToggling(id);
    try {
      const result = await examAPI.toggleStatus(id);
      setExams(exams.map(e => (e._id || e.id) === id ? { ...e, isActive: result.isActive } : e));
      setToast({ id: Date.now().toString(), type: 'success', message: `Assessment ${result.isActive ? 'activated' : 'deactivated'}` });
    } catch (err: any) { setToast({ id: Date.now().toString(), type: 'error', message: err.response?.data?.error || 'Toggle failed' }); }
    finally { setToggling(null); }
  };

  const handleDuplicate = async (id: string, title: string) => {
    try {
      const dup = await examAPI.duplicate(id);
      setExams(prev => [dup, ...prev]);
      setToast({ id: Date.now().toString(), type: 'success', message: `"${title}" duplicated as draft` });
    } catch (err: any) { setToast({ id: Date.now().toString(), type: 'error', message: err.response?.data?.error || 'Duplicate failed' }); }
  };

  const copyStudentAccessLink = (examId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/exam/launch?examId=${examId}`);
    setToast({ id: Date.now().toString(), type: 'info', title: 'Link Copied', message: 'Student access link copied to clipboard.' });
  };

  const activeCount = exams.filter(e => e.isActive).length;
  const inactiveCount = exams.filter(e => !e.isActive).length;

  return (
    <TeacherLayout>
      <TeacherNavbar />
      <Toast toast={toast} onClose={() => setToast(null)} />
      {selectedExam && (
        <AssignStudentsModal exam={selectedExam} onClose={() => setSelectedExam(null)} onSuccess={fetchExams} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1.5 w-8 rounded-full" style={{ background: 'linear-gradient(90deg, #8b5cf6, #6366f1)' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>Assessment Management</span>
            </div>
            <h1 className="text-2xl font-black text-white">Assessments</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(240,240,245,0.4)' }}>
              {exams.length} total · {activeCount} active · {inactiveCount} inactive
            </p>
          </div>
          <Link
            to="/teacher/create-exam"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white self-start"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 24px rgba(139,92,246,0.35)' }}
          >
            <Plus size={15} /> New Assessment
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(240,240,245,0.3)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search assessments..."
              className="input-dark pl-10"
            />
          </div>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {([['all', 'All', exams.length], ['active', 'Active', activeCount], ['inactive', 'Inactive', inactiveCount]] as const).map(([tab, label, count]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200"
                style={{
                  background: activeTab === tab ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'rgba(240,240,245,0.45)',
                }}
              >
                {label} <span className="ml-1 opacity-70">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Exam Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-52 rounded-2xl skeleton" />)}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <FileText size={32} style={{ color: 'rgba(139,92,246,0.5)' }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {searchQuery ? 'No results found' : 'No assessments yet'}
            </h3>
            <p className="text-sm text-center max-w-xs mb-6" style={{ color: 'rgba(240,240,245,0.4)' }}>
              {searchQuery ? `No assessments match "${searchQuery}"` : 'Create your first assessment to start evaluating candidates.'}
            </p>
            {!searchQuery && (
              <Link to="/teacher/create-exam" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                <Zap size={15} /> Create First Assessment
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredExams.map(exam => {
              const examId = exam._id || exam.id || '';
              const isDeleting = deleting === examId;
              const isToggling = toggling === examId;

              return (
                <div
                  key={examId}
                  className="rounded-2xl overflow-hidden transition-all duration-300 group"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.25)'; (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  {/* Card top */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
                      >
                        <FileText size={17} style={{ color: '#8b5cf6' }} />
                      </div>
                      {/* Status badge */}
                      <button
                        onClick={() => handleToggleStatus(examId)}
                        disabled={isToggling}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all"
                        style={{
                          background: exam.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                          color: exam.isActive ? '#34d399' : 'rgba(240,240,245,0.4)',
                          border: `1px solid ${exam.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {isToggling ? (
                          <div className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full" style={{ background: exam.isActive ? '#34d399' : 'rgba(240,240,245,0.3)', boxShadow: exam.isActive ? '0 0 6px #34d399' : 'none' }} />
                        )}
                        {exam.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{exam.title}</h3>
                    {exam.description && (
                      <p className="text-xs mb-3 line-clamp-2" style={{ color: 'rgba(240,240,245,0.4)' }}>{exam.description}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(240,240,245,0.35)' }}>
                      <span className="flex items-center gap-1"><Clock size={11} />{exam.duration}m</span>
                      <span className="flex items-center gap-1"><Target size={11} />{exam.totalMarks} marks</span>
                      <span className="flex items-center gap-1"><BookOpen size={11} />{(exam as any).questionsCount || exam.questions?.length || 0}q</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

                  {/* Actions */}
                  <div className="px-4 py-3 flex items-center gap-1.5 flex-wrap">
                    <Link
                      to={`/teacher/exams/${examId}/results`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                    >
                      <BarChart3 size={12} /> Results
                    </Link>
                    <button
                      onClick={() => setSelectedExam(exam)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}
                    >
                      <Users size={12} /> Assign
                    </button>
                    <button
                      onClick={() => copyStudentAccessLink(examId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                      title="Copy student access link"
                    >
                      <Share2 size={12} /> Link
                    </button>
                    <div className="flex items-center gap-1 ml-auto">
                      <Link
                        to={`/teacher/edit-exam/${examId}`}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'rgba(240,240,245,0.3)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#a78bfa'; (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.1)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,245,0.3)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <Edit size={14} />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(examId, exam.title)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'rgba(240,240,245,0.3)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#22d3ee'; (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.1)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,245,0.3)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        title="Duplicate"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(examId)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'rgba(240,240,245,0.3)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fb7185'; (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.1)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,245,0.3)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        {isDeleting ? <div className="h-3.5 w-3.5 rounded-full border border-current border-t-transparent animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </TeacherLayout>
  );
};

export default ManageExams;