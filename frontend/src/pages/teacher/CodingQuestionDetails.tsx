import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface CodingQuestion {
  _id: string;
  title: string;
  description: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  timeLimit: number;
  memoryLimit: number;
  starterCode: string;
  supportedLanguages: string[];
}

interface TestCase {
  _id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
}

const emptyForm = { input: '', expectedOutput: '' };

const CodingQuestionDetails: React.FC = () => {
  const { questionId = '' } = useParams<{ questionId: string }>();
  const [question, setQuestion] = useState<CodingQuestion | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [activeTab, setActiveTab] = useState<'visible' | 'hidden'>('visible');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [questionResponse, testCasesResponse] = await Promise.all([
        api.get(`/coding-questions/${questionId}`),
        api.get(`/coding-questions/${questionId}/testcases`)
      ]);
      setQuestion(questionResponse.data.question);
      setTestCases(testCasesResponse.data.data || []);
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || 'Failed to load coding question');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [questionId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveTestCase = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      const payload = { ...form, isHidden: activeTab === 'hidden' };
      if (editingId) {
        await api.put(`/coding-questions/${questionId}/testcases/${editingId}`, payload);
      } else {
        await api.post(`/coding-questions/${questionId}/testcases`, payload);
      }
      resetForm();
      await load();
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || 'Failed to save test case');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (testCaseId: string) => {
    if (!window.confirm('Delete this test case?')) return;
    try {
      setError('');
      await api.delete(`/coding-questions/${questionId}/testcases/${testCaseId}`);
      await load();
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || 'Failed to delete test case');
    }
  };

  const duplicate = async (testCaseId: string) => {
    try {
      setError('');
      await api.post(`/coding-questions/${questionId}/testcases/${testCaseId}/duplicate`);
      await load();
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || 'Failed to duplicate test case');
    }
  };

  const move = async (testCaseId: string, direction: -1 | 1) => {
    const index = testCases.findIndex(testCase => testCase._id === testCaseId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= testCases.length) return;
    const reordered = [...testCases];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    try {
      setTestCases(reordered);
      await api.put(`/coding-questions/${questionId}/testcases/reorder`, {
        orderedIds: reordered.map(testCase => testCase._id)
      });
      await load();
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || 'Failed to reorder test cases');
      await load();
    }
  };

  const startEdit = (testCase: TestCase) => {
    setActiveTab(testCase.isHidden ? 'hidden' : 'visible');
    setEditingId(testCase._id);
    setForm({ input: testCase.input, expectedOutput: testCase.expectedOutput });
  };

  const visibleCount = testCases.filter(testCase => !testCase.isHidden).length;
  const hiddenCount = testCases.filter(testCase => testCase.isHidden).length;
  const filtered = testCases.filter(testCase => testCase.isHidden === (activeTab === 'hidden'));

  if (loading && !question) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Loading coding question...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/teacher/coding-questions" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> Coding Questions
          </Link>
          {question && (
            <Link to={`/teacher/coding-questions/edit/${question._id}`}>
              <Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> Edit Question</Button>
            </Link>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {question && (
          <Card>
            <CardHeader><CardTitle>{question.title}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <p className="whitespace-pre-wrap text-gray-700">{question.description}</p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{question.difficulty}</span>
                <span>{question.marks} marks</span><span>{question.timeLimit}s</span><span>{question.memoryLimit}MB</span>
                <span>{question.supportedLanguages.join(', ')}</span>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <section><h3 className="font-semibold text-gray-900">Input format</h3><p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{question.inputFormat}</p></section>
                <section><h3 className="font-semibold text-gray-900">Output format</h3><p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{question.outputFormat}</p></section>
                <section><h3 className="font-semibold text-gray-900">Constraints</h3><p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{question.constraints}</p></section>
                <section><h3 className="font-semibold text-gray-900">Explanation</h3><p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{question.explanation}</p></section>
              </div>
              <section><h3 className="font-semibold text-gray-900">Starter code</h3><pre className="mt-2 overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">{question.starterCode}</pre></section>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Test Cases</CardTitle>
            <p className="text-sm text-gray-500">A complete question needs at least one visible and one hidden test case.</p>
          </CardHeader>
          <CardContent>
            {(visibleCount === 0 || hiddenCount === 0) && (
              <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                Add {visibleCount === 0 ? 'a visible' : 'a hidden'} test case to complete this question.
              </div>
            )}
            <div className="mb-5 flex border-b">
              {(['visible', 'hidden'] as const).map(tab => (
                <button key={tab} type="button" onClick={() => { setActiveTab(tab); resetForm(); }}
                  className={`px-4 py-3 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'}`}>
                  {tab === 'visible' ? `Visible (${visibleCount})` : `Hidden (${hiddenCount})`}
                </button>
              ))}
            </div>

            <form onSubmit={saveTestCase} className="mb-6 grid gap-4 rounded-lg border bg-gray-50 p-4 md:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">Input
                <textarea required rows={4} value={form.input} onChange={event => setForm(current => ({ ...current, input: event.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm" />
              </label>
              <label className="text-sm font-medium text-gray-700">Expected output
                <textarea required rows={4} value={form.expectedOutput} onChange={event => setForm(current => ({ ...current, expectedOutput: event.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm" />
              </label>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={saving}><Plus className="mr-2 h-4 w-4" />{saving ? 'Saving...' : editingId ? 'Update Test Case' : `Add ${activeTab} Test Case`}</Button>
                {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
              </div>
            </form>

            <div className="space-y-3">
              {filtered.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">No {activeTab} test cases yet.</p> :
                filtered.map(testCase => (
                  <div key={testCase._id} className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[1fr_1fr_auto]">
                    <div><p className="text-xs font-semibold uppercase text-gray-500">Input</p><pre className="mt-1 whitespace-pre-wrap text-sm">{testCase.input}</pre></div>
                    <div><p className="text-xs font-semibold uppercase text-gray-500">Expected output</p><pre className="mt-1 whitespace-pre-wrap text-sm">{testCase.expectedOutput}</pre></div>
                    <div className="flex items-start gap-1">
                      <Button variant="ghost" size="sm" onClick={() => move(testCase._id, -1)} title="Move up"><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => move(testCase._id, 1)} title="Move down"><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(testCase)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => duplicate(testCase._id)} title="Duplicate"><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(testCase._id)} title="Delete" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CodingQuestionDetails;
