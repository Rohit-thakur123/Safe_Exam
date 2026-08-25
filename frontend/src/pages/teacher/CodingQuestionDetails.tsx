import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft, Plus, Pencil, Trash2, Copy, ArrowUp, ArrowDown,
  Eye, EyeOff, CheckCircle, XCircle, AlertCircle, GripVertical
} from 'lucide-react';
import api from '../../services/api';
import type { CodingQuestion } from '../../types';

interface TestCase {
  _id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
}

type TabType = 'visible' | 'hidden';

const emptyForm = { input: '', expectedOutput: '' };

const ManageTestCases: React.FC = () => {
  const { questionId = '' } = useParams<{ questionId: string }>();

  const [question, setQuestion] = useState<CodingQuestion | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('visible');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Drag reorder
  const dragIdx = useRef<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [qRes, tcRes] = await Promise.all([
        api.get(`/coding-questions/${questionId}`),
        api.get(`/coding-questions/${questionId}/testcases`)
      ]);
      setQuestion(qRes.data.question);
      setTestCases(tcRes.data.data || []);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [questionId]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const saveTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.input.trim() || !form.expectedOutput.trim()) {
      setError('Input and expected output are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, isHidden: activeTab === 'hidden' };
      if (editingId) {
        await api.put(`/coding-questions/${questionId}/testcases/${editingId}`, payload);
        flash('Test case updated');
      } else {
        await api.post(`/coding-questions/${questionId}/testcases`, payload);
        flash('Test case added');
      }
      resetForm();
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Failed to save test case');
    } finally {
      setSaving(false);
    }
  };

  const deleteTestCase = async (id: string) => {
    if (!window.confirm('Delete this test case?')) return;
    setError('');
    try {
      await api.delete(`/coding-questions/${questionId}/testcases/${id}`);
      flash('Test case deleted');
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Failed to delete test case');
    }
  };

  const duplicateTestCase = async (id: string) => {
    setError('');
    try {
      await api.post(`/coding-questions/${questionId}/testcases/${id}/duplicate`);
      flash('Test case duplicated');
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Failed to duplicate test case');
    }
  };

  const moveTestCase = async (id: string, direction: -1 | 1) => {
    const filtered = testCases.filter(tc => tc.isHidden === (activeTab === 'hidden'));
    const idx = filtered.findIndex(tc => tc._id === id);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= filtered.length) return;

    const reordered = [...testCases];
    const fullIdxA = reordered.findIndex(tc => tc._id === filtered[idx]._id);
    const fullIdxB = reordered.findIndex(tc => tc._id === filtered[target]._id);
    [reordered[fullIdxA], reordered[fullIdxB]] = [reordered[fullIdxB], reordered[fullIdxA]];

    setTestCases(reordered);
    try {
      await api.put(`/coding-questions/${questionId}/testcases/reorder`, {
        orderedIds: reordered.map(tc => tc._id)
      });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Failed to reorder');
      await load();
    }
  };

  // Drag reorder
  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDrop = async (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return;
    const filtered = testCases.filter(tc => tc.isHidden === (activeTab === 'hidden'));
    const arr = [...filtered];
    const [item] = arr.splice(dragIdx.current, 1);
    arr.splice(targetIdx, 0, item);
    dragIdx.current = null;

    // Rebuild full list maintaining relative order of other type
    const otherType = testCases.filter(tc => tc.isHidden !== (activeTab === 'hidden'));
    const reordered = [...arr, ...otherType];
    setTestCases(reordered);
    try {
      await api.put(`/coding-questions/${questionId}/testcases/reorder`, {
        orderedIds: reordered.map(tc => tc._id)
      });
    } catch {
      await load();
    }
  };

  const startEdit = (tc: TestCase) => {
    setActiveTab(tc.isHidden ? 'hidden' : 'visible');
    setEditingId(tc._id);
    setForm({ input: tc.input, expectedOutput: tc.expectedOutput });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const visibleCases = testCases.filter(tc => !tc.isHidden);
  const hiddenCases = testCases.filter(tc => tc.isHidden);
  const filtered = activeTab === 'visible' ? visibleCases : hiddenCases;

  const isReady = visibleCases.length > 0 && hiddenCases.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:"var(--bg-primary)"}}>
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted">Loading test cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background:"var(--bg-primary)"}}>
      {/* Header */}
      <div className="sticky top-0 z-10 card-surface border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/teacher/coding-questions" className="text-muted hover:text-gray-600 shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-heading truncate">
                  {question?.title || 'Manage Test Cases'}
                </h1>
                <nav className="flex items-center gap-1.5 text-xs text-muted">
                  <Link to="/teacher/coding-questions" className="hover:text-indigo-600">Coding Questions</Link>
                  <span>/</span>
                  <span className="text-gray-700 truncate max-w-xs">{question?.title}</span>
                  <span>/</span>
                  <span>Test Cases</span>
                </nav>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {question && (
                <Link
                  to={`/teacher/coding-questions/edit/${questionId}`}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 card-surface px-3 py-2 text-sm font-medium text-gray-700 hover: transition-colors"
                >
                  Edit Question
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <XCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">×</button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Readiness status */}
        {!isReady && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Question incomplete</p>
              <p className="mt-0.5 text-xs">
                {visibleCases.length === 0 && 'You need at least 1 visible test case. '}
                {hiddenCases.length === 0 && 'You need at least 1 hidden test case.'}
              </p>
            </div>
          </div>
        )}
        {isReady && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Question is complete — {visibleCases.length} visible, {hiddenCases.length} hidden test cases.
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Visible Test Cases" value={visibleCases.length} color="text-emerald-600" icon={<Eye className="w-4 h-4" />} />
          <StatCard label="Hidden Test Cases" value={hiddenCases.length} color="text-indigo-600" icon={<EyeOff className="w-4 h-4" />} />
          <StatCard label="Marks" value={question?.marks ?? '—'} color="text-amber-600" />
          <StatCard label="Languages" value={(question?.supportedLanguages || []).join(', ') || '—'} color="text-gray-600" small />
        </div>

        {/* Main panel */}
        <div className="card-surface overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b">
            {(['visible', 'hidden'] as TabType[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); resetForm(); }}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                  : 'border-transparent text-muted hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab === 'visible' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {tab === 'visible'
                  ? `Visible (${visibleCases.length})`
                  : `Hidden (${hiddenCases.length})`
                }
                {tab === 'hidden' && (
                  <span className="ml-1 text-xs bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5">Grading</span>
                )}
              </button>
            ))}
          </div>

          {/* Test case list */}
          <div className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="py-14 text-center">
                {activeTab === 'visible'
                  ? <Eye className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  : <EyeOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                }
                <p className="text-sm text-muted font-medium">
                  No {activeTab} test cases yet
                </p>
                <p className="text-xs text-muted mt-1">
                  {activeTab === 'hidden' ? 'Hidden test cases are used for grading and never shown to students.' : 'Add visible test cases that students can see as samples.'}
                </p>
              </div>
            ) : (
              filtered.map((tc, idx) => (
                <div
                  key={tc._id}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => void onDrop(idx)}
                  className={`group ${editingId === tc._id ? 'bg-indigo-50/30' : 'hover:/50'} transition-colors`}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                      <GripVertical className="w-4 h-4 text-gray-300 cursor-grab group-hover:text-muted" />
                      <span className="text-xs font-mono text-muted">{idx + 1}</span>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Input</p>
                        <pre className="bg-gray-950 text-gray-100 rounded-lg px-3 py-2 text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {tc.input}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Expected Output</p>
                        <pre className="bg-gray-950 text-emerald-300 rounded-lg px-3 py-2 text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {tc.expectedOutput}
                        </pre>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconBtn onClick={() => moveTestCase(tc._id, -1)} title="Move up" disabled={idx === 0}>
                        <ArrowUp className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn onClick={() => moveTestCase(tc._id, 1)} title="Move down" disabled={idx === filtered.length - 1}>
                        <ArrowDown className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn onClick={() => startEdit(tc)} title="Edit" className="text-blue-500 hover:bg-blue-50">
                        <Pencil className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn onClick={() => void duplicateTestCase(tc._id)} title="Duplicate" className="text-amber-500 hover:bg-amber-50">
                        <Copy className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn onClick={() => void deleteTestCase(tc._id)} title="Delete" className="text-red-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconBtn>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add / Edit Form */}
          <div className="border-t /50 p-5">
            <div className="flex items-center gap-2 mb-4">
              {editingId ? (
                <>
                  <Pencil className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-heading">
                    Edit Test Case
                    <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${activeTab === 'visible' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {activeTab}
                    </span>
                  </h3>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-heading">
                    Add {activeTab === 'visible' ? 'Visible' : 'Hidden'} Test Case
                    <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${activeTab === 'visible' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {activeTab === 'hidden' ? 'Hidden from students' : 'Shown as sample'}
                    </span>
                  </h3>
                </>
              )}
            </div>

            <form onSubmit={(e) => void saveTestCase(e)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Input <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.input}
                    onChange={e => setForm(prev => ({ ...prev, input: e.target.value }))}
                    placeholder="Enter test case input..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Expected Output <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.expectedOutput}
                    onChange={e => setForm(prev => ({ ...prev, expectedOutput: e.target.value }))}
                    placeholder="Enter expected output..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {saving ? 'Saving...' : editingId ? 'Update Test Case' : `Add ${activeTab === 'visible' ? 'Visible' : 'Hidden'} Test Case`}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover: transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between pb-8">
          <Link
            to="/teacher/coding-questions"
            className="flex items-center gap-1 text-sm text-muted hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Questions
          </Link>
          {question && (
            <Link
              to={`/teacher/coding-questions/${questionId}/preview`}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Preview as Student →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; color?: string; icon?: React.ReactNode; small?: boolean }> = ({
  label, value, color = 'text-heading', icon, small
}) => (
  <div className="card-surface rounded-xl border px-4 py-3">
    <div className="flex items-center gap-2 mb-1">
      {icon && <span className={color}>{icon}</span>}
      <p className="text-xs text-muted font-medium">{label}</p>
    </div>
    <p className={`font-semibold ${color} ${small ? 'text-sm truncate' : 'text-xl'}`}>{value}</p>
  </div>
);

const IconBtn: React.FC<{
  onClick: () => void;
  title: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, title, disabled, className = 'text-muted hover:', children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

export default ManageTestCases;
