import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { Button } from '../../components/ui/Button';
import { examAPI } from '../../services/api';
import {
  FileText, Edit, Trash2, Plus, ArrowLeft, Users, ToggleLeft, ToggleRight,
  Copy, BarChart3, Search, CheckCircle2, Share2
} from 'lucide-react';
import type { Exam } from '../../types';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';

interface Student {
  id: string;
  name: string;
  email: string;
}

const AssignStudentsModal: React.FC<{
  exam: Exam;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ exam, onClose, onSuccess }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, [exam]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, assignedData] = await Promise.all([
        examAPI.getStudents().catch(() => ({ students: [] })),
        examAPI.getAssignedStudents(exam._id || exam.id!).catch(() => ({ students: [] }))
      ]);

      setStudents(studentsData.students || []);
      const assignedList: Student[] = (assignedData.students || []).map(
        (s: { _id: string; name: string; email: string }) => ({
          id: s._id,
          name: s.name,
          email: s.email,
        })
      );
      setSelectedStudents(assignedList.map((s: Student) => s.id));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load student list');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await examAPI.assignStudents(
        exam._id || exam.id!,
        selectedStudents,
        sendEmailNotification
      );

      if (response.assignedCount !== undefined) {
        setSuccess(`Assigned ${response.assignedCount} candidate(s) successfully!`);
      } else {
        setSuccess('Candidate assignments updated!');
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update student assignments');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900">Assign Candidates to Assessment</h3>
            <p className="text-xs text-gray-500 mt-0.5">{exam.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading student directory...</div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700">{error}</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-10 w-10 text-gray-300 mb-2" />
              <p className="text-xs text-gray-500">No active student accounts registered yet.</p>
            </div>
          ) : (
            <>
              {success && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} /> {success}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-600 font-medium">
                  Selected: <span className="font-bold text-violet-700">{selectedStudents.length} candidates</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudents(students.map(s => s.id))}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-800"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStudents([])}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {students.map((student) => {
                  const isSelected = selectedStudents.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'border-violet-300 bg-violet-50/70 text-violet-900 font-medium'
                          : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 text-gray-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{student.name}</p>
                        <p className="text-[11px] text-gray-500">{student.email}</p>
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-violet-600" />}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendEmailNotification}
                  onChange={e => setSendEmailNotification(e.target.checked)}
                  className="rounded text-violet-600 focus:ring-violet-500 h-4 w-4"
                />
                <label htmlFor="sendEmail" className="text-xs text-gray-600 font-medium">
                  Send automated email invitation with unique SEB launch credentials
                </label>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Assignments'}
          </Button>
        </div>
      </div>
    </div>
  );
};

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

  useEffect(() => {
    fetchExams();
  }, [user]);

  const fetchExams = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await examAPI.getAll();
      const safeExams = Array.isArray(data) ? data : [];
      const myExams = safeExams.filter((e: Exam) => {
        if (!e.createdBy) return true;
        return String(e.createdBy) === String(user.id);
      });
      setExams(myExams);
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.response?.data?.error || 'Failed to load exams'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      const matchesTab = activeTab === 'all' || (activeTab === 'active' ? e.isActive : !e.isActive);
      const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [exams, activeTab, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    setDeleting(id);
    try {
      await examAPI.delete(id);
      setExams(exams.filter(e => (e._id || e.id) !== id));
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: 'Exam deleted successfully'
      });
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.code === 'EXAM_HAS_ATTEMPTS' && errorData?.canForceDelete) {
        if (window.confirm(`This exam has ${errorData.attemptsCount} student attempt(s). Delete all attempt records and force delete?`)) {
          try {
            await examAPI.delete(id, true);
            setExams(exams.filter(e => (e._id || e.id) !== id));
            setToast({
              id: Date.now().toString(),
              type: 'success',
              message: 'Exam and student attempts force deleted'
            });
          } catch (forceErr: any) {
            setToast({
              id: Date.now().toString(),
              type: 'error',
              message: forceErr.response?.data?.error || 'Failed to force delete exam'
            });
          }
        }
      } else {
        setToast({
          id: Date.now().toString(),
          type: 'error',
          message: errorData?.error || 'Failed to delete exam'
        });
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    setToggling(id);
    try {
      const result = await examAPI.toggleStatus(id);
      setExams(exams.map(e => (e._id || e.id) === id ? { ...e, isActive: result.isActive } : e));
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `Assessment ${result.isActive ? 'activated' : 'deactivated'}`
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.response?.data?.error || 'Failed to toggle status'
      });
    } finally {
      setToggling(null);
    }
  };

  const handleDuplicate = async (id: string, title: string) => {
    try {
      const dup = await examAPI.duplicate(id);
      setExams(prev => [dup, ...prev]);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `Duplicated "${title}" as draft`
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.response?.data?.error || 'Failed to duplicate assessment'
      });
    }
  };

  const copyStudentAccessLink = (examId: string) => {
    const accessUrl = `${window.location.origin}/exam/launch?examId=${examId}`;
    navigator.clipboard.writeText(accessUrl);
    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: 'Link Copied!',
      message: 'Student access link copied to clipboard.'
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
            <Link to="/teacher" className="inline-flex items-center text-xs font-semibold text-violet-600 hover:text-violet-800 mb-2">
              <ArrowLeft size={14} className="mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Assessments & Exams</h1>
            <p className="text-sm text-gray-500 mt-1">Manage active exams, candidate assignments, SEB configs, and live scorecards</p>
          </div>
          <Link
            to="/teacher/create-exam"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-sm"
          >
            <Plus size={16} /> Create New Assessment
          </Link>
        </div>

        {/* Search & Tabs Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'all' ? 'bg-violet-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
              }`}
            >
              All ({exams.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
              }`}
            >
              Active ({exams.filter(e => e.isActive).length})
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'inactive' ? 'bg-gray-800 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
              }`}
            >
              Inactive ({exams.filter(e => !e.isActive).length})
            </button>
          </div>
        </div>

        {/* Exams List */}
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading assessments...</div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No assessments found</h3>
            <p className="text-xs text-gray-500 mt-1">Create an assessment to start evaluating candidates.</p>
            <Link
              to="/teacher/create-exam"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
            >
              <Plus size={14} /> Create Assessment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => {
              const examId = exam._id || exam.id || '';
              return (
                <div key={examId} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs hover:shadow-md transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          exam.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {exam.isActive ? '• Active' : 'Inactive'}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-md">
                          ⏱ {exam.duration} Mins
                        </span>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-md">
                          🎯 {exam.totalMarks} Total Marks
                        </span>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-md">
                          Pass: {exam.passingMarks}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 mb-1 hover:text-violet-600 transition-colors">
                        <Link to={`/teacher/exams/${examId}/results`}>{exam.title}</Link>
                      </h3>
                      {exam.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{exam.description}</p>}

                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span>📋 {exam.questionsCount || exam.questions?.length || 0} MCQ Questions</span>
                        <span>💻 {(exam as any).codingQuestions?.length || 0} Coding Challenges</span>
                        <span>👥 {(exam.assignedCandidates || []).length} Candidates Assigned</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/teacher/exams/${examId}/results`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-xs"
                      >
                        <BarChart3 size={14} /> Results & Analytics
                      </Link>

                      <button
                        onClick={() => setSelectedExam(exam)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="Assign Candidates"
                      >
                        <Users size={14} /> Assign
                      </button>

                      <button
                        onClick={() => copyStudentAccessLink(examId)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        title="Copy Exam Link"
                      >
                        <Share2 size={14} /> Link
                      </button>

                      <button
                        onClick={() => handleToggleStatus(examId)}
                        disabled={toggling === examId}
                        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                        title={exam.isActive ? 'Deactivate Exam' : 'Activate Exam'}
                      >
                        {exam.isActive ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
                      </button>

                      <button
                        onClick={() => handleDuplicate(examId, exam.title)}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Duplicate Assessment"
                      >
                        <Copy size={15} />
                      </button>

                      <Link
                        to={`/teacher/edit-exam/${examId}`}
                        className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit Assessment"
                      >
                        <Edit size={15} />
                      </Link>

                      <button
                        onClick={() => handleDelete(examId)}
                        disabled={deleting === examId}
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Assessment"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Assign Modal */}
        {selectedExam && (
          <AssignStudentsModal
            exam={selectedExam}
            onClose={() => setSelectedExam(null)}
            onSuccess={() => {
              fetchExams();
              setSelectedExam(null);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default ManageExams;
