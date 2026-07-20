import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, Pencil, Settings } from 'lucide-react';
import { codingQuestionAPI } from '../../services/api';
import CodingAssessment from '../../components/exam/CodingAssessment';
import type { CodingQuestion } from '../../types';

/**
 * Teacher preview of the student coding screen.
 * Shows the exact same CodingAssessment component students see,
 * wrapped in a clear "PREVIEW MODE" banner.
 */
const CodingQuestionPreview: React.FC = () => {
  const { questionId = '' } = useParams<{ questionId: string }>();
  const [question, setQuestion] = useState<CodingQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!questionId) return;
    codingQuestionAPI.getById(questionId)
      .then(q => {
        setQuestion(q);
        // Populate code from starter
        const lang = q.supportedLanguages?.[0] || '';
        let sc = '';
        if (q.starterCode && typeof q.starterCode === 'object') {
          sc = (q.starterCode as Record<string, string>)[lang] || '';
        } else if (typeof q.starterCode === 'string') {
          sc = q.starterCode;
        }
        setCode(JSON.stringify({ language: lang, code: sc }));
      })
      .catch(() => setError('Failed to load question'))
      .finally(() => setLoading(false));
  }, [questionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl border p-8 max-w-sm">
          <EyeOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-700 font-medium">{error || 'Question not found'}</p>
          <Link to="/teacher/coding-questions" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-800">
            ← Back to Questions
          </Link>
        </div>
      </div>
    );
  }

  // Normalise question for CodingAssessment (which expects a CodingQuestion with id)
  const normalisedQuestion: CodingQuestion & { id: string } = {
    ...question,
    id: question.id || question._id || '',
    // Keep starterCode as Record<string, string> for type compatibility
    starterCode: (() => {
      if (!question.starterCode) return {} as Record<string, string>;
      if (typeof question.starterCode === 'string') {
        const lang = question.supportedLanguages?.[0] || 'text';
        return { [lang]: question.starterCode } as Record<string, string>;
      }
      return question.starterCode as Record<string, string>;
    })()
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Preview Banner */}
      <div className="sticky top-0 z-20 bg-indigo-700 text-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-3">
              <Link
                to={`/teacher/coding-questions/${questionId}/testcases`}
                className="flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="h-4 w-px bg-indigo-500" />
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-300" />
                <span className="text-sm font-semibold">PREVIEW MODE</span>
                <span className="text-xs text-indigo-300">— This is exactly what students see</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/teacher/coding-questions/edit/${questionId}`}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Question
              </Link>
              <Link
                to={`/teacher/coding-questions/${questionId}/testcases`}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Test Cases
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Notices */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <span className="font-semibold">⚠ Teacher Preview:</span>
            <span>
              Run and Submit buttons are disabled in preview. The editor is fully interactive for testing starter code display.
              Hidden test cases will not be visible to students during grading.
            </span>
          </div>
        </div>
      </div>

      {/* Student UI — rendered exactly as CodingAssessment */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CodingAssessment
          question={normalisedQuestion}
          answer={code}
          onAnswerChange={setCode}
          attemptId="preview-mode"
        />
      </div>
    </div>
  );
};

export default CodingQuestionPreview;
