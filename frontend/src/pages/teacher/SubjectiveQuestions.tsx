import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { Button } from '../../components/ui/Button';
import { subjectiveQuestionAPI } from '../../services/api';
import { Plus, Search, BookOpen, Edit2, Trash2, AlertCircle } from 'lucide-react';
import type { SubjectiveQuestion } from '../../types';

const DIFFICULTY_COLORS = {
  easy: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  hard: 'bg-red-50 text-red-700 ring-1 ring-red-200',
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
    <div className="min-h-screen bg-gray-50">
      <TeacherNavbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Subjective Questions</h1>
              <p className="text-sm text-gray-500">Open-ended questions graded manually after the exam</p>
            </div>
          </div>
          <Link to="/teacher/subjective-questions/create">
            <Button className="flex items-center gap-2">
              <Plus size={15} />
              Create Question
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition bg-white shadow-sm"
            />
          </div>
          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition bg-white shadow-sm"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No subjective questions yet</p>
            <p className="text-sm text-gray-400 mb-4">Create your first open-ended question to get started.</p>
            <Link to="/teacher/subjective-questions/create">
              <Button size="sm" className="flex items-center gap-1.5 mx-auto">
                <Plus size={13} /> Create Question
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map(q => {
              const id = getId(q);
              return (
                <div
                  key={id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-4 hover:border-violet-200 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[q.difficulty || 'medium']}`}>
                        {q.difficulty}
                      </span>
                      {q.category && (
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                          {q.category}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {q.maxMarks} marks
                      </span>
                      {q.wordLimit ? (
                        <span className="text-xs text-gray-400">• {q.wordLimit} word limit</span>
                      ) : null}
                      {!q.isActive && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{q.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{q.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link to={`/teacher/subjective-questions/edit/${id}`}>
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                        <Edit2 size={14} />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(id)}
                      disabled={deletingId === id}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletingId === id ? (
                        <div className="h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} />
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
          <p className="text-xs text-gray-400 mt-4 text-center">
            Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default SubjectiveQuestions;
