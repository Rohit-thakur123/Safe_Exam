import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import {
  Plus, Search, Pencil, Trash2, Eye, Copy, Code2, Settings,
  ChevronLeft, ChevronRight, Filter, ArrowUpDown, CheckCircle, XCircle
} from 'lucide-react';
import { codingQuestionAPI } from '../../services/api';
import type { CodingQuestion } from '../../types';

const LANGUAGES = ['Python', 'Java', 'JavaScript', 'C', 'C++'];

const difficultyBadge: Record<string, string> = {
  Easy: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Hard: 'bg-red-50 text-red-700 ring-1 ring-red-200'
};

const CodingQuestionsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [language, setLanguage] = useState('');
  const [status, setStatus] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 10;

  const fetchQuestions = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await codingQuestionAPI.getAll({
        search: search || undefined,
        difficulty: difficulty || undefined,
        language: language || undefined,
        status: status || undefined,
        page: pageNum,
        limit
      });
      setQuestions(result.questions);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Failed to load coding questions');
    } finally {
      setLoading(false);
    }
  }, [search, difficulty, language, status]);

  useEffect(() => {
    fetchQuestions(1);
  }, [fetchQuestions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      setError('');
      await codingQuestionAPI.delete(id);
      setSuccess(`"${title}" deleted successfully`);
      fetchQuestions(page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Failed to delete question');
    }
  };

  const handleDuplicate = async (id: string, title: string) => {
    try {
      setError('');
      const copy = await codingQuestionAPI.duplicate(id);
      setSuccess(`"${title}" duplicated as draft`);
      fetchQuestions(page);
      setTimeout(() => setSuccess(''), 3000);
      const copyId = (copy as CodingQuestion & { _id?: string }).id || (copy as CodingQuestion & { _id?: string })._id;
      if (copyId) navigate(`/teacher/coding-questions/edit/${copyId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Failed to duplicate question');
    }
  };

  const getStarterCodeLanguages = (q: CodingQuestion) => {
    if (typeof q.starterCode === 'object' && q.starterCode !== null) {
      return Object.keys(q.starterCode).filter(k => q.starterCode[k as keyof typeof q.starterCode]);
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/teacher" className="text-gray-400 hover:text-gray-600 shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900 leading-tight">Coding Questions</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Manage your question bank</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-gray-600 hidden md:block">{user?.name}</span>
              <Button
                onClick={() => navigate('/teacher/coding-questions/create')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm h-9 px-4"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Question
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <XCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5">
          <div className="p-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search by title or description..."
                    className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <Filter className="inline w-3 h-3 mr-1" />Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={e => { setDifficulty(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Language</label>
                  <select
                    value={language}
                    onChange={e => { setLanguage(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => { setStatus(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm h-9 px-4 shrink-0">
                <Search className="w-4 h-4 mr-1.5" />
                Search
              </Button>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table header info */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {loading ? 'Loading...' : `${total} Question${total !== 1 ? 's' : ''}`}
              </span>
              {(search || difficulty || language || status) && (
                <button
                  onClick={() => { setSearch(''); setSearchInput(''); setDifficulty(''); setLanguage(''); setStatus(''); }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <ArrowUpDown className="w-3 h-3" />
              Newest first
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-20 text-center">
              <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No questions found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {(search || difficulty || language || status) ? 'Try adjusting your filters.' : 'Get started by creating your first coding question.'}
              </p>
              {!search && !difficulty && !language && !status && (
                <Button
                  onClick={() => navigate('/teacher/coding-questions/create')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Question
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600 whitespace-nowrap">Title</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-600 whitespace-nowrap">Difficulty</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-600 whitespace-nowrap">Marks</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-600 whitespace-nowrap">Languages</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600 whitespace-nowrap">Visible TC</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600 whitespace-nowrap">Hidden TC</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-600 whitespace-nowrap">Status</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-600 whitespace-nowrap">Created</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {questions.map((q) => {
                    const qId = q.id || q._id || '';
                    const visTC = q.visibleTestCaseCount ?? 0;
                    const hidTC = q.hiddenTestCaseCount ?? 0;
                    const isReady = visTC > 0 && hidTC > 0;
                    const langs = getStarterCodeLanguages(q);

                    return (
                      <tr key={qId} className="hover:bg-gray-50/70 transition-colors group">
                        {/* Title */}
                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="flex items-start gap-2">
                            <div>
                              <div className="font-medium text-gray-900 truncate max-w-[220px]" title={q.title}>
                                {q.title}
                              </div>
                              {q.tags && q.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {q.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Difficulty */}
                        <td className="px-3 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${difficultyBadge[q.difficulty] || 'bg-gray-100 text-gray-700'}`}>
                            {q.difficulty}
                          </span>
                        </td>

                        {/* Marks */}
                        <td className="px-3 py-3.5">
                          <span className="font-medium text-gray-900">{q.marks}</span>
                          <span className="text-gray-400 text-xs ml-0.5">pts</span>
                        </td>

                        {/* Languages */}
                        <td className="px-3 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {(q.supportedLanguages || []).map(l => {
                              const hasCode = langs.includes(l);
                              return (
                                <span
                                  key={l}
                                  className={`text-xs px-1.5 py-0.5 rounded border ${hasCode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                                  title={hasCode ? `${l} — has starter code` : `${l} — no starter code`}
                                >
                                  {l}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Visible TC */}
                        <td className="px-3 py-3.5 text-center">
                          <span className={`text-sm font-medium ${visTC > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {visTC}
                          </span>
                        </td>

                        {/* Hidden TC */}
                        <td className="px-3 py-3.5 text-center">
                          <span className={`text-sm font-medium ${hidTC > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            {hidTC}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${q.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${q.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              {q.isActive ? 'Active' : 'Draft'}
                            </span>
                            {!isReady && (
                              <span className="text-xs text-amber-600">⚠ Incomplete</span>
                            )}
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-3 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                          {q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <ActionBtn
                              onClick={() => navigate(`/teacher/coding-questions/${qId}/preview`)}
                              title="Preview (student view)"
                              icon={<Eye className="w-3.5 h-3.5" />}
                              className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                            />
                            <ActionBtn
                              onClick={() => navigate(`/teacher/coding-questions/edit/${qId}`)}
                              title="Edit question"
                              icon={<Pencil className="w-3.5 h-3.5" />}
                              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            />
                            <ActionBtn
                              onClick={() => navigate(`/teacher/coding-questions/${qId}/testcases`)}
                              title="Manage test cases"
                              icon={<Settings className="w-3.5 h-3.5" />}
                              className="text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                            />
                            <ActionBtn
                              onClick={() => handleDuplicate(qId, q.title)}
                              title="Duplicate question"
                              icon={<Copy className="w-3.5 h-3.5" />}
                              className="text-gray-600 hover:text-amber-600 hover:bg-amber-50"
                            />
                            <ActionBtn
                              onClick={() => handleDelete(qId, q.title)}
                              title="Delete question"
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && questions.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs text-gray-500">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchQuestions(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" /> Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5 && page > 3) p = page - 2 + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => fetchQuestions(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-white'}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchQuestions(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ActionBtn: React.FC<{
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  className?: string;
}> = ({ onClick, title, icon, className = '' }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-lg transition-colors ${className}`}
  >
    {icon}
  </button>
);

export default CodingQuestionsPage;
