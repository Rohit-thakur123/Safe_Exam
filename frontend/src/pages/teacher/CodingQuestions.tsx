import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { TeacherLayout } from '../../components/ui/DarkLayout';
import {
  Plus, Search, Pencil, Trash2, Eye, Copy, Code2, Settings,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { codingQuestionAPI } from '../../services/api';
import type { CodingQuestion } from '../../types';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';

const LANGUAGES = ['Python', 'Java', 'JavaScript', 'C', 'C++'];

const difficultyBadge = (diff?: string) => {
  const d = (diff || 'Medium').toLowerCase();
  if (d === 'easy') return { bg: 'color-mix(in srgb, var(--accent-emerald) 10%, transparent)', color: 'var(--tint-emerald-text)', border: 'color-mix(in srgb, var(--accent-emerald) 20%, transparent)' };
  if (d === 'hard') return { bg: 'color-mix(in srgb, var(--accent-rose) 10%, transparent)', color: 'var(--tint-rose-text)', border: 'color-mix(in srgb, var(--accent-rose) 20%, transparent)' };
  return { bg: 'color-mix(in srgb, var(--accent-amber) 10%, transparent)', color: 'var(--tint-amber-text)', border: 'color-mix(in srgb, var(--accent-amber) 20%, transparent)' };
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
    <TeacherLayout>
      <TeacherNavbar />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1.5 w-8 rounded-full" style={{ background: 'linear-gradient(90deg, var(--accent-indigo), #a855f7)' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-indigo)' }}>Coding Challenges</span>
            </div>
            <h1 className="text-2xl font-black text-heading">Algorithms Library</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Manage algorithmic problems, language constraints, and testcase suites
            </p>
          </div>
          <Link
            to="/teacher/coding-questions/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white self-start"
            style={{ background: 'linear-gradient(135deg, var(--accent-indigo), #a855f7)', boxShadow: '0 4px 24px color-mix(in srgb, var(--accent-indigo) 25%, transparent)' }}
          >
            <Plus size={15} /> New Challenge
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <form onSubmit={handleSearchSubmit}>
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by problem title, tag, or keyword..." className="input-dark pl-10 w-full" />
            </form>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="px-3.5 py-2 text-sm rounded-xl focus:outline-none transition-all duration-200"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="" className="bg-gray-900 text-white">All Difficulties</option>
              <option value="Easy" className="bg-gray-900 text-white">Easy</option>
              <option value="Medium" className="bg-gray-900 text-white">Medium</option>
              <option value="Hard" className="bg-gray-900 text-white">Hard</option>
            </select>

            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="px-3.5 py-2 text-sm rounded-xl focus:outline-none transition-all duration-200"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="" className="bg-gray-900 text-white">All Languages</option>
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang} className="bg-gray-900 text-white">{lang}</option>
              ))}
            </select>
            <button
              onClick={handleSearchSubmit}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap"
              style={{ background: 'color-mix(in srgb, var(--accent-indigo) 15%, transparent)', color: 'var(--tint-indigo-text)', border: '1px solid color-mix(in srgb, var(--accent-indigo) 30%, transparent)' }}
            >
              Filter
            </button>
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl skeleton" />)}</div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'color-mix(in srgb, var(--accent-indigo) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-indigo) 15%, transparent)' }}>
              <Code2 size={32} style={{ color: 'color-mix(in srgb, var(--accent-indigo) 40%, transparent)' }} />
            </div>
            <h3 className="text-lg font-bold text-heading mb-2">{search ? 'No results found' : 'No coding challenges yet'}</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{search ? `No matches for "${search}"` : 'Get started by creating your first coding problem'}</p>
            {!search && (
              <Link to="/teacher/coding-questions/create" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--accent-indigo), #a855f7)' }}>
                <Plus size={15} /> Create Challenge
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const qId = q._id || q.id || '';
              const diff = difficultyBadge(q.difficulty);
              return (
                <div key={qId} className="group rounded-2xl p-5 transition-all duration-200"
                     style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                     onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'; }}
                     onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize" style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}>
                          {q.difficulty || 'medium'}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
                          🎯 {q.marks || 100} Marks
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--accent-indigo) 10%, transparent)', color: 'var(--tint-indigo-text)', border: '1px solid color-mix(in srgb, var(--accent-indigo) 20%, transparent)' }}>
                          🧪 {q.visibleTestCaseCount || 0} Visible Testcases
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-heading mb-1.5 transition-colors group-hover:text-indigo-400">
                        <Link to={`/teacher/coding-questions/${qId}`}>{q.title}</Link>
                      </h3>
                      <p className="text-sm line-clamp-2 mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{q.description}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        {(q.supportedLanguages || []).map((lang: string) => (
                          <span key={lang} className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        to={`/teacher/coding-questions/${qId}/preview`}
                        className="p-2 rounded-xl transition-all"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'var(--border-hover)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        title="Preview Problem"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/teacher/coding-questions/${qId}/testcases`}
                        className="p-2 rounded-xl transition-all"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--tint-indigo-text)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--accent-indigo) 15%, transparent)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        title="Manage Testcases"
                      >
                        <Settings size={16} />
                      </Link>
                      <Link
                        to={`/teacher/coding-questions/edit/${qId}`}
                        className="p-2 rounded-xl transition-all"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c084fc'; (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.15)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        title="Edit Question"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(qId, q.title)}
                        className="p-2 rounded-xl transition-all"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'var(--border-hover)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        title="Duplicate Question"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(qId, q.title)}
                        className="p-2 rounded-xl transition-all"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--tint-rose-text)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--accent-rose) 15%, transparent)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Showing page {page} of {totalPages} ({total} total challenges)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                    style={{ background: 'var(--bg-card-hover)', color: 'white' }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                    style={{ background: 'var(--bg-card-hover)', color: 'white' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </TeacherLayout>
  );
};

export default CodingQuestionsPage;
