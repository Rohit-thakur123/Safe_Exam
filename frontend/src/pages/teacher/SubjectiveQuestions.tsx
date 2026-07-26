import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { TeacherLayout } from '../../components/ui/DarkLayout';
import { subjectiveQuestionAPI } from '../../services/api';
import { Plus, Search, BookOpen, Edit2, Trash2, AlertCircle } from 'lucide-react';
import type { SubjectiveQuestion } from '../../types';

const difficultyStyle = (diff?: string) => {
  const d = (diff || 'medium').toLowerCase();
  if (d === 'easy') return { bg: 'rgba(16,185,129,0.1)', color: '#34d399', border: 'rgba(16,185,129,0.2)' };
  if (d === 'hard') return { bg: 'rgba(244,63,94,0.1)', color: '#fb7185', border: 'rgba(244,63,94,0.2)' };
  return { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: 'rgba(245,158,11,0.2)' };
};

const SubjectiveQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<SubjectiveQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [search, difficultyFilter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const result = await subjectiveQuestionAPI.getAll({
        search: search || undefined,
        difficulty: difficultyFilter || undefined,
        limit: 100,
      });
      setQuestions(result.questions);
    } catch {
      setError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      setDeletingId(id);
      await subjectiveQuestionAPI.delete(id);
      setQuestions(prev => prev.filter(q => (q._id || q.id) !== id));
    } catch {
      alert('Failed to delete question.');
    } finally {
      setDeletingId(null);
    }
  };

  const getId = (q: SubjectiveQuestion) => (q._id || q.id || '');

  return (
    <TeacherLayout>
      <TeacherNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1.5 w-8 rounded-full" style={{ background: 'linear-gradient(90deg, #a78bfa, #c084fc)' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a78bfa' }}>Subjective Questions</span>
            </div>
            <h1 className="text-2xl font-black text-white">Descriptive Q&A Bank</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(240,240,245,0.4)' }}>
              Open-ended questions graded manually after the exam
            </p>
          </div>
          <Link
            to="/teacher/subjective-questions/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white self-start"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #c084fc)', boxShadow: '0 4px 24px rgba(167,139,250,0.25)' }}
          >
            <Plus size={15} /> Create Question
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ color: 'rgba(240,240,245,0.3)' }} />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-dark pl-10 w-full"
            />
          </div>
          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className="px-3.5 py-2 text-sm rounded-xl focus:outline-none transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,240,245,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <option value="" className="bg-gray-900 text-white">All Difficulties</option>
            <option value="easy" className="bg-gray-900 text-white">Easy</option>
            <option value="medium" className="bg-gray-900 text-white">Medium</option>
            <option value="hard" className="bg-gray-900 text-white">Hard</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl text-sm mb-4" style={{ background: 'rgba(244,63,94,0.1)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.2)' }}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl skeleton" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <BookOpen size={32} style={{ color: 'rgba(167,139,250,0.4)' }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{search ? 'No results found' : 'No subjective questions yet'}</h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(240,240,245,0.4)' }}>{search ? `No matches for "${search}"` : 'Create your first open-ended question to get started.'}</p>
            {!search && (
              <Link to="/teacher/subjective-questions/create" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #a78bfa, #c084fc)' }}>
                <Plus size={15} /> Create Question
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map(q => {
              const id = getId(q);
              const diff = difficultyStyle(q.difficulty);
              return (
                <div
                  key={id}
                  className="group rounded-2xl p-5 flex items-start justify-between gap-4 transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize" style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}>
                        {q.difficulty || 'medium'}
                      </span>
                      {q.category && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,240,245,0.5)' }}>
                          {q.category}
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,240,245,0.5)' }}>
                        🎯 {q.maxMarks} marks
                      </span>
                      {q.wordLimit ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(167,139,250,0.1)', color: '#c084fc', border: '1px solid rgba(167,139,250,0.2)' }}>
                          ✍️ {q.wordLimit} words limit
                        </span>
                      ) : null}
                      {!q.isActive && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(240,240,245,0.1)', color: 'rgba(240,240,245,0.6)' }}>
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5 transition-colors group-hover:text-purple-400 truncate">{q.title}</h3>
                    <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'rgba(240,240,245,0.6)' }}>{q.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/teacher/subjective-questions/edit/${id}`}>
                      <button className="p-2 rounded-xl transition-all"
                        style={{ color: 'rgba(240,240,245,0.5)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c084fc'; (e.currentTarget as HTMLElement).style.background = 'rgba(167,139,250,0.15)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,245,0.5)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <Edit2 size={16} />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(id)}
                      disabled={deletingId === id}
                      className="p-2 rounded-xl transition-all disabled:opacity-50"
                      style={{ color: 'rgba(240,240,245,0.5)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fb7185'; (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.15)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,245,0.5)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {deletingId === id ? (
                        <div className="h-4 w-4 border-2 border-[#fb7185] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Footer */}
        {!loading && questions.length > 0 && (
          <p className="text-xs mt-4 text-center" style={{ color: 'rgba(240,240,245,0.4)' }}>
            Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </TeacherLayout>
  );
};

export default SubjectiveQuestions;
