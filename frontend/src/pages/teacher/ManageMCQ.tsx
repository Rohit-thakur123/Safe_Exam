import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { categoryAPI, questionAPI } from '../../services/api';
import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, Edit, LogOut, Plus, Search, Trash2 } from 'lucide-react';
import type { Category, Question } from '../../types';

type Difficulty = 'easy' | 'medium' | 'hard';

const categoryNameFor = (question: Question) => {
  const populatedCategory = question.categoryId as Category | undefined;
  return populatedCategory && typeof populatedCategory === 'object'
    ? populatedCategory.name
    : question.category || 'General';
};

const difficultyClass = (difficulty?: string) => {
  if (difficulty === 'easy') return 'bg-green-100 text-green-800';
  if (difficulty === 'hard') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
};

const ManageMCQ: React.FC = () => {
  const { user, logout } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [questionData, categoryData] = await Promise.all([
        questionAPI.getAll(),
        categoryAPI.getAll()
      ]);

      setQuestions(questionData.filter(question => String(question.createdBy) === String(user.id)));
      setCategories(categoryData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load MCQs');
    } finally {
      setLoading(false);
    }
  };

  const visibleQuestions = useMemo(() => {
    if (activeCategory === 'All') return questions;
    return questions.filter(question => categoryNameFor(question) === activeCategory);
  }, [questions, activeCategory]);

  const groupedQuestions = useMemo(() => {
    return visibleQuestions.reduce<Record<string, Question[]>>((groups, question) => {
      const name = categoryNameFor(question);
      groups[name] = groups[name] || [];
      groups[name].push(question);
      return groups;
    }, {});
  }, [visibleQuestions]);

  const categoryFilters = useMemo(() => {
    const names = new Set<string>(categories.map(category => category.name));
    questions.forEach(question => names.add(categoryNameFor(question)));
    return ['All', ...Array.from(names).sort()];
  }, [categories, questions]);

  const handleDelete = async () => {
    if (!deleteQuestion) return;

    const id = deleteQuestion._id || deleteQuestion.id;
    if (!id) return;

    setQuestions(prev => prev.filter(question => (question._id || question.id) !== id));
    setDeleteQuestion(null);

    try {
      await questionAPI.delete(id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete MCQ');
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/teacher" className="flex items-center text-gray-500 hover:text-gray-700 mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Manage MCQ</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline text-sm text-gray-700">Welcome, {user?.name}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">MCQ Library</h2>
            <p className="text-gray-600">View, edit, delete, and organize questions by category</p>
          </div>
          <Link to="/teacher/create-question">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create MCQ
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <Search className="w-4 h-4 mr-2" />
                {visibleQuestions.length} MCQs
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryFilters.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeCategory === category
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-600">Loading MCQs...</div>
        ) : visibleQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No MCQs found</h3>
              <p className="mt-2 text-gray-500">Create or select another category to continue</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedQuestions).map(([category, items]) => {
              const isCollapsed = collapsed[category];

              return (
                <section key={category} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCollapsed(prev => ({ ...prev, [category]: !prev[category] }))}
                    className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{category}</h3>
                      <p className="text-sm text-gray-500">{items.length} MCQs</p>
                    </div>
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  {!isCollapsed && (
                    <div className="grid gap-4 border-t border-gray-100 p-5 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map(question => (
                        <div
                          key={question._id || question.id}
                          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-4 text-sm font-medium text-gray-900">{question.question}</p>
                            <div className="flex shrink-0 gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setEditingQuestion(question)} title="Edit MCQ">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setDeleteQuestion(question)}
                                title="Delete MCQ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyClass(question.difficulty)}`}>
                              {question.difficulty || 'medium'}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                              {categoryNameFor(question)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      {editingQuestion && (
        <EditMCQModal
          question={editingQuestion}
          categories={categories}
          onClose={() => setEditingQuestion(null)}
          onSaved={(updatedQuestion) => {
            setQuestions(prev => prev.map(question => (
              (question._id || question.id) === (updatedQuestion._id || updatedQuestion.id) ? updatedQuestion : question
            )));
            setEditingQuestion(null);
            fetchData();
          }}
        />
      )}

      {deleteQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Are you sure?</h3>
            <p className="mt-2 text-sm text-gray-600">This MCQ will be removed from your library.</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteQuestion(null)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditMCQModal: React.FC<{
  question: Question;
  categories: Category[];
  onClose: () => void;
  onSaved: (question: Question) => void;
}> = ({ question, categories, onClose, onSaved }) => {
  const [questionText, setQuestionText] = useState(question.question);
  const [options, setOptions] = useState<string[]>([...question.options]);
  const [answer, setAnswer] = useState(question.answer);
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [difficulty, setDifficulty] = useState<Difficulty>((question.difficulty || 'medium') as Difficulty);
  const [categoryId, setCategoryId] = useState(
    typeof question.categoryId === 'object' ? question.categoryId._id || question.categoryId.id || '' : question.categoryId || ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateOption = (index: number, value: string) => {
    const nextOptions = [...options];
    nextOptions[index] = value;
    setOptions(nextOptions);
  };

  const handleSave = async () => {
    const id = question._id || question.id;
    if (!id) return;

    const filteredOptions = options.map(option => option.trim()).filter(Boolean);
    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }
    if (filteredOptions.length !== 4) {
      setError('Please provide exactly 4 options');
      return;
    }
    if (!filteredOptions.includes(answer)) {
      setError('Answer must be one of the provided options');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const updatedQuestion = await questionAPI.update(id, {
        question: questionText.trim(),
        options: filteredOptions,
        answer,
        explanation: explanation.trim() || undefined,
        difficulty,
        categoryId: categoryId || undefined
      });
      onSaved(updatedQuestion);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update MCQ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="border-b p-5">
          <h3 className="text-lg font-semibold text-gray-900">Edit MCQ</h3>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Question</label>
            <textarea
              value={questionText}
              onChange={(event) => setQuestionText(event.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Options</label>
            <div className="mt-2 space-y-2">
              {options.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
              <select
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select answer</option>
                {options.filter(option => option.trim()).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Difficulty</label>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">General</option>
                {categories.map(category => (
                  <option key={category._id || category.id} value={category._id || category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Explanation</label>
              <Input value={explanation} onChange={(event) => setExplanation(event.target.value)} />
            </div>
          </div>
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </div>
        <div className="flex justify-end gap-3 border-t bg-gray-50 p-5">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </div>
  );
};

export default ManageMCQ;
