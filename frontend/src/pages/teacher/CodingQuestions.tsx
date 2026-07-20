import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { Button } from '../../components/ui/Button';
import {
  Plus, Search, Pencil, Trash2, Eye, Copy, Code2, Settings,
  ChevronLeft, ChevronRight, ArrowLeft
} from 'lucide-react';
import { codingQuestionAPI } from '../../services/api';
import type { CodingQuestion } from '../../types';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';

const LANGUAGES = ['Python', 'Java', 'JavaScript', 'C', 'C++'];

const difficultyBadge = (diff?: string) => {
  const d = (diff || 'Medium').toLowerCase();
  if (d === 'easy') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (d === 'hard') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const CodingQuestionsPage: React.FC = () => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [language, setLanguage] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 10;

  const fetchQuestions = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const result = await codingQuestionAPI.getAll({
        search: search || undefined,
        difficulty: difficulty || undefined,
        language: language || undefined,
        page: pageNum,
        limit
      });
      setQuestions(result.questions);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: msg || 'Failed to load coding challenges'
      });
    } finally {
      setLoading(false);
    }
  }, [search, difficulty, language]);

  useEffect(() => {
    fetchQuestions(1);
  }, [fetchQuestions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete coding challenge "${title}"? This cannot be undone.`)) return;
    try {
      await codingQuestionAPI.delete(id);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `"${title}" deleted successfully`
      });
      fetchQuestions(page);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: msg || 'Failed to delete challenge'
      });
    }
  };

  const handleDuplicate = async (id: string, title: string) => {
    try {
      const copy = await codingQuestionAPI.duplicate(id);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: `"${title}" duplicated as draft`
      });
      fetchQuestions(page);
      const copyId = (copy as CodingQuestion & { _id?: string }).id || (copy as CodingQuestion & { _id?: string })._id;
      if (copyId) navigate(`/teacher/coding-questions/edit/${copyId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: msg || 'Failed to duplicate challenge'
      });
    }
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Coding Challenges Library</h1>
            <p className="text-sm text-gray-500 mt-1">Manage algorithmic problems, language constraints, and testcase suites</p>
          </div>
          <Link
            to="/teacher/coding-questions/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-sm"
          >
            <Plus size={16} /> New Coding Challenge
          </Link>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by problem title, tag, or keyword..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="">All Languages</option>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>

              <Button type="submit" variant="secondary" size="sm">
                Filter
              </Button>
            </div>
          </form>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">Loading coding challenges...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
            <Code2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No coding challenges found</h3>
            <p className="text-xs text-gray-500 mt-1">Get started by creating your first coding problem with automated test cases.</p>
            <Link
              to="/teacher/coding-questions/create"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
            >
              <Plus size={14} /> Create Problem
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const qId = q._id || q.id || '';
              return (
                <div key={qId} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs hover:shadow-md transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${difficultyBadge(q.difficulty)} uppercase tracking-wider`}>
                          {q.difficulty || 'Medium'}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          🎯 {q.marks || 100} Marks
                        </span>
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          🧪 {q.visibleTestCaseCount || 0} Visible Testcases
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 mb-1 hover:text-violet-600 transition-colors">
                        <Link to={`/teacher/coding-questions/${qId}`}>{q.title}</Link>
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{q.description}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        {(q.supportedLanguages || []).map((lang: string) => (
                          <span key={lang} className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/teacher/coding-questions/${qId}/preview`}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="Preview Problem"
                      >
                        <Eye size={14} /> Preview
                      </Link>
                      <Link
                        to={`/teacher/coding-questions/${qId}/testcases`}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                        title="Manage Testcases"
                      >
                        <Settings size={14} /> Testcases
                      </Link>
                      <Link
                        to={`/teacher/coding-questions/edit/${qId}`}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        title="Edit Question"
                      >
                        <Pencil size={14} /> Edit
                      </Link>
                      <button
                        onClick={() => handleDuplicate(qId, q.title)}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Duplicate Question"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(qId, q.title)}
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-gray-500">
                  Showing page {page} of {totalPages} ({total} total challenges)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft size={14} /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    Next <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CodingQuestionsPage;
