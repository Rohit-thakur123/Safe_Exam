import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { Button } from '../../components/ui/Button';
import { subjectiveQuestionAPI } from '../../services/api';
import { ArrowLeft, BookOpen, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';
import type { SubjectiveQuestion } from '../../types';

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

const CreateSubjectiveQuestion: React.FC = () => {
  const navigate = useNavigate();
  const { questionId } = useParams<{ questionId: string }>();
  const isEditMode = Boolean(questionId);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showReference, setShowReference] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [maxMarks, setMaxMarks] = useState<number>(10);
  const [wordLimit, setWordLimit] = useState<number>(0);
  const [minWords, setMinWords] = useState<number>(0);
  const [referenceAnswer, setReferenceAnswer] = useState('');
  const [rubric, setRubric] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isEditMode && questionId) {
      fetchQuestion(questionId);
    }
  }, [questionId]);

  const fetchQuestion = async (id: string) => {
    try {
      setIsFetching(true);
      const q = await subjectiveQuestionAPI.getById(id);
      setTitle(q.title || '');
      setDescription(q.description || '');
      setInstructions(q.instructions || '');
      setMaxMarks(q.maxMarks || 10);
      setWordLimit(q.wordLimit || 0);
      setMinWords(q.minWords || 0);
      setReferenceAnswer(q.referenceAnswer || '');
      setRubric(q.rubric || '');
      setTeacherNotes(q.teacherNotes || '');
      setDifficulty(q.difficulty || 'medium');
      setCategory(q.category || '');
      setIsActive(q.isActive !== false);
    } catch {
      setToast({ id: Date.now().toString(), type: 'error', message: 'Failed to load question' });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !maxMarks) {
      setToast({ id: Date.now().toString(), type: 'error', message: 'Title, description, and max marks are required.' });
      return;
    }

    if (maxMarks < 1) {
      setToast({ id: Date.now().toString(), type: 'error', message: 'Max marks must be at least 1.' });
      return;
    }

    const payload: Partial<SubjectiveQuestion> = {
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      maxMarks,
      wordLimit: wordLimit || 0,
      minWords: minWords || 0,
      referenceAnswer: referenceAnswer.trim(),
      rubric: rubric.trim(),
      teacherNotes: teacherNotes.trim(),
      difficulty,
      category: category.trim(),
      isActive,
    };

    try {
      setIsLoading(true);
      if (isEditMode && questionId) {
        await subjectiveQuestionAPI.update(questionId, payload);
        setToast({ id: Date.now().toString(), type: 'success', message: 'Question updated successfully!' });
      } else {
        await subjectiveQuestionAPI.create(payload);
        setToast({ id: Date.now().toString(), type: 'success', message: 'Subjective question created!' });
        setTimeout(() => navigate('/teacher/subjective-questions'), 1200);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to save question.';
      setToast({ id: Date.now().toString(), type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!questionId || !window.confirm('Delete this question? This cannot be undone.')) return;
    try {
      await subjectiveQuestionAPI.delete(questionId);
      navigate('/teacher/subjective-questions');
    } catch {
      setToast({ id: Date.now().toString(), type: 'error', message: 'Failed to delete question.' });
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:"var(--bg-primary)"}}>
        <p className="text-muted">Loading question...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background:"var(--bg-primary)"}}>
      <TeacherNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/teacher/subjective-questions" className="flex items-center gap-1 text-sm text-muted hover:text-gray-700 transition-colors">
              <ArrowLeft size={16} />
              Back to Subjective Questions
            </Link>
          </div>
          {isEditMode && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{color:"var(--text-heading)"}}>
              {isEditMode ? 'Edit Subjective Question' : 'Create Subjective Question'}
            </h1>
            <p className="text-sm text-muted">Students write open-ended answers graded manually by you.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Core Question Fields */}
          <div className="card-surface p-6" style={{borderRadius:"1rem"}}>
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Question Content</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="label-theme mb-1">
                  Question Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Explain the concept of polymorphism in OOP"
                  className="w-full input-theme"
                />
              </div>

              {/* Description */}
              <div>
                <label className="label-theme mb-1">
                  Full Question Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Write the complete question text that students will see..."
                  className="w-full textarea-theme"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="label-theme mb-1">Answering Instructions (optional)</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. Use examples to support your answer. Avoid bullet points."
                  className="w-full textarea-theme"
                />
              </div>
            </div>
          </div>

          {/* Marks & Limits */}
          <div className="card-surface p-6" style={{borderRadius:"1rem"}}>
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Marks & Limits</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-theme mb-1">
                  Max Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxMarks}
                  onChange={e => setMaxMarks(Number(e.target.value))}
                  className="w-full input-theme"
                />
              </div>
              <div>
                <label className="label-theme mb-1">Word Limit <span className="text-muted text-xs">(0 = no limit)</span></label>
                <input
                  type="number"
                  min={0}
                  value={wordLimit}
                  onChange={e => setWordLimit(Number(e.target.value))}
                  className="w-full input-theme"
                />
              </div>
              <div>
                <label className="label-theme mb-1">Min Words <span className="text-muted text-xs">(0 = no minimum)</span></label>
                <input
                  type="number"
                  min={0}
                  value={minWords}
                  onChange={e => setMinWords(Number(e.target.value))}
                  className="w-full input-theme"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label-theme mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as typeof difficulty)}
                  className="w-full input-theme"
                >
                  {DIFFICULTIES.map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-theme mb-1">Category (optional)</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. OOP, Data Structures, Database"
                  className="w-full input-theme"
                />
              </div>
            </div>

            {isEditMode && (
              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-violet-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full card-surface shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm" style={{color:"var(--text-secondary)"}}>{isActive ? 'Active' : 'Inactive'}</span>
              </div>
            )}
          </div>

          {/* Teacher-only Fields */}
          <div className="card-surface p-6" style={{borderRadius:"1rem"}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Teacher Notes <span className="text-xs text-muted normal-case">(hidden from students)</span></h2>
              <button
                type="button"
                onClick={() => setShowReference(!showReference)}
                className="flex items-center gap-1 text-xs text-muted hover:text-gray-700"
              >
                {showReference ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
              </button>
            </div>

            {showReference && (
              <div className="space-y-4">
                <div>
                  <label className="label-theme mb-1">Reference / Model Answer</label>
                  <textarea
                    rows={5}
                    value={referenceAnswer}
                    onChange={e => setReferenceAnswer(e.target.value)}
                    placeholder="Write the ideal answer that you expect students to provide..."
                    className="w-full textarea-theme"
                  />
                </div>

                <div>
                  <label className="label-theme mb-1">Grading Rubric</label>
                  <textarea
                    rows={3}
                    value={rubric}
                    onChange={e => setRubric(e.target.value)}
                    placeholder="e.g. 5 marks: correct definition + example, 3 marks: definition only, 0 marks: wrong/blank"
                    className="w-full textarea-theme"
                  />
                </div>

                <div>
                  <label className="label-theme mb-1">Private Notes</label>
                  <textarea
                    rows={2}
                    value={teacherNotes}
                    onChange={e => setTeacherNotes(e.target.value)}
                    placeholder="Any personal notes about this question..."
                    className="w-full textarea-theme"
                  />
                </div>
              </div>
            )}

            {!showReference && (
              <p className="text-sm text-muted italic">Click "Show" to add reference answer, rubric, and private notes.</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pb-8">
            <Link to="/teacher/subjective-questions">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
              <Save size={15} />
              {isLoading ? 'Saving...' : isEditMode ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </form>

        {toast && (
          <Toast
            toast={toast}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CreateSubjectiveQuestion;
