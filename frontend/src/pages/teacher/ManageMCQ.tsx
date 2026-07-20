import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { Button } from '../../components/ui/Button';
import { categoryAPI, questionAPI } from '../../services/api';
import { BookOpen, ChevronDown, ChevronRight, Plus, Search, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Category, Question } from '../../types';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';

const categoryNameFor = (question: Question) => {
  const populatedCategory = question.categoryId as Category | undefined;
  return populatedCategory && typeof populatedCategory === 'object'
    ? populatedCategory.name
    : question.category || 'General';
};

const difficultyBadge = (difficulty?: string) => {
  if (difficulty === 'easy') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (difficulty === 'hard') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const ManageMCQ: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [questionData, categoryData] = await Promise.all([
        questionAPI.getAll(),
        categoryAPI.getAll().catch(() => [])
      ]);
      const myQuestions = (Array.isArray(questionData) ? questionData : []).filter(
        q => String(q.createdBy) === String(user.id)
      );
      setQuestions(myQuestions);
      setCategories(categoryData);
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.message || 'Failed to load MCQ questions'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesCategory = activeCategory === 'All' || categoryNameFor(q) === activeCategory;
      const matchesSearch = !searchQuery || (q.question && q.question.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (q.options && q.options.some(o => o.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesCategory && matchesSearch;
    });
  }, [questions, activeCategory, searchQuery]);

  const groupedQuestions = useMemo(() => {
    return filteredQuestions.reduce<Record<string, Question[]>>((groups, question) => {
      const name = categoryNameFor(question);
      groups[name] = groups[name] || [];
      groups[name].push(question);
      return groups;
    }, {});
  }, [filteredQuestions]);

  const categoryFilters = useMemo(() => {
    const names = new Set<string>(categories.map(category => category.name));
    questions.forEach(question => names.add(categoryNameFor(question)));
    return ['All', ...Array.from(names).sort()];
  }, [categories, questions]);

  const handleDelete = async () => {
    if (!deleteQuestion) return;
    const id = deleteQuestion._id || deleteQuestion.id;
    if (!id) return;

    try {
      await questionAPI.delete(id);
      setQuestions(prev => prev.filter(q => (q._id || q.id) !== id));
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: 'Question deleted successfully'
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete question'
      });
    } finally {
      setDeleteQuestion(null);
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">MCQ Question Bank</h1>
            <p className="text-sm text-gray-500 mt-1">Manage multiple-choice questions, categories, and marks allocation</p>
          </div>
          <Link
            to="/teacher/create-question"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-sm"
          >
            <Plus size={16} /> Create MCQ
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search MCQs by text or options..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {categoryFilters.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === category
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">Loading question library...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No MCQ questions found</h3>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your search query or create a new question.</p>
            <Link
              to="/teacher/create-question"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
            >
              <Plus size={14} /> Create MCQ Question
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedQuestions).map(([category, items]) => {
              const isCollapsed = collapsed[category];
              return (
                <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                  <div
                    onClick={() => setCollapsed(prev => ({ ...prev, [category]: !prev[category] }))}
                    className="flex items-center justify-between px-6 py-4 bg-gray-50/70 border-b border-gray-100 cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isCollapsed ? <ChevronRight size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                      <h3 className="text-sm font-bold text-gray-900">{category}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                        {items.length} {items.length === 1 ? 'question' : 'questions'}
                      </span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="divide-y divide-gray-100">
                      {items.map((q, idx) => (
                        <div key={q._id || q.id || idx} className="p-6 hover:bg-violet-50/20 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${difficultyBadge(q.difficulty)} uppercase tracking-wider`}>
                                  {q.difficulty || 'Medium'}
                                </span>
                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                  🎯 1 Mark
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-900 leading-snug mb-3">{q.question}</h4>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mb-3">
                                {q.options.map((opt, oIdx) => {
                                  const isCorrect = String(opt) === String(q.answer) || String(oIdx) === String(q.answer);
                                  return (
                                    <div
                                      key={oIdx}
                                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                        isCorrect
                                          ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 font-medium'
                                          : 'border-gray-100 bg-gray-50/50 text-gray-700'
                                      }`}
                                    >
                                      <span>{opt}</span>
                                      {isCorrect && <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />}
                                    </div>
                                  );
                                })}
                              </div>

                              {q.explanation && (
                                <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                  💡 <span className="font-semibold">Explanation:</span> {q.explanation}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setDeleteQuestion(q)}
                                className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Question"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteQuestion && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-base font-bold text-gray-900">Delete MCQ Question?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteQuestion(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageMCQ;
