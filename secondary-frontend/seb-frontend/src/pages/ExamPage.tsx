// Main exam page component — orchestrates Dashboard -> MCQ -> Coding -> Submit
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamSession } from '../hooks/useExamSession';
import { useAutoSave } from '../hooks/useAutoSave';
import { useTimer } from '../hooks/useTimer';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useTabVisibility } from '../hooks/useTabVisibility';

import ExamDashboard from '../components/exam/ExamDashboard';
import { ExamHeader } from '../components/exam/ExamHeader';
import { QuestionNavigation } from '../components/exam/QuestionNavigation';
import { QuestionDisplay } from '../components/exam/QuestionDisplay';
import { AnswerInput } from '../components/exam/AnswerInput';
import { SubmitButton } from '../components/exam/SubmitButton';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import CodingTest from './CodingTest';
import type { CodingQuestion, McqStatus, CodingStatus } from '../types/exam.types';

type Stage = 'dashboard' | 'mcq' | 'coding';

export const ExamPage = () => {
  const { examId, sessionToken } = useParams<{
    examId: string;
    sessionToken: string;
  }>();

  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('dashboard');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Section completion — the exam config has no explicit section-order field,
  // so we default to "MCQ first, then Coding unlocks" (mcqFirst).
  const [mcqStatus, setMcqStatus] = useState<McqStatus>('not_started');
  const [codingStatus, setCodingStatus] = useState<CodingStatus>('locked');
  const [sectionsInitialized, setSectionsInitialized] = useState(false);

  const {
    examSession,
    loading,
    error,
    initializeExam,
    updateAnswer,
    submitExam
  } = useExamSession();

  // Initialize exam
  useEffect(() => {
    if (examId && sessionToken) {
      initializeExam(examId, sessionToken).catch((err) => {
        navigate(`/exam/error?message=${encodeURIComponent(err.message)}`);
      });
    }
  }, [examId, sessionToken, initializeExam, navigate]);

  // Split the flat question list into MCQ/text questions and coding questions,
  // and set up initial section statuses (mcqFirst default) once per session.
  const mcqQuestions = useMemo(
    () => (examSession ? examSession.exam.questions.filter((q) => q.type !== 'coding') : []),
    [examSession]
  );
  const codingQuestions = useMemo(
    () =>
      (examSession
        ? (examSession.exam.questions.filter((q) => q.type === 'coding') as CodingQuestion[])
        : []),
    [examSession]
  );

  useEffect(() => {
    if (!examSession || sectionsInitialized) return;

    if (mcqQuestions.length === 0) {
      // No MCQ section — coding unlocks immediately.
      setMcqStatus('completed');
      setCodingStatus(codingQuestions.length > 0 ? 'not_started' : 'completed');
    } else {
      setMcqStatus('not_started');
      setCodingStatus(codingQuestions.length > 0 ? 'locked' : 'completed');
    }
    setSectionsInitialized(true);
  }, [examSession, sectionsInitialized, mcqQuestions.length, codingQuestions.length]);

  // Auto-save answers
  const { saving, lastSaved, error: autoSaveError } = useAutoSave({
    attemptId: examSession?.attempt.id || null,
    answers: examSession?.currentAnswers || {},
    enabled: !!examSession
  });

  // Timer with auto-submit
  const { timeRemaining, formatTime, isWarning } = useTimer({
    endTime: examSession?.attempt.endTime || null,
    onTimeUp: async () => {
      if (examSession) {
        try {
          const result = await submitExam();
          navigate(`/exam/submit-success?autoSubmit=true&score=${result.score}&percentage=${result.percentage}`);
        } catch (error) {
          console.error('Auto-submit failed:', error);
          navigate('/exam/error?message=Failed%20to%20submit%20exam');
        }
      }
    }
  });

  // Keep session alive
  useHeartbeat(examSession?.attempt.id || null);

  // Monitor tab switching
  useTabVisibility({
    onTabSwitch: (isHidden) => {
      if (isHidden) {
        console.warn('Student switched tabs - potential cheating detected');
      }
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner message="Loading exam..." size="lg" />
      </div>
    );
  }

  if (error || !examSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error || 'Failed to load exam'}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const handleFinalSubmit = async () => {
    try {
      const result = await submitExam();
      navigate(`/exam/submit-success?score=${result.score}&percentage=${result.percentage}`);
    } catch (err) {
      console.error('Final submit failed:', err);
      navigate('/exam/error?message=Failed%20to%20submit%20exam');
    }
  };

  // ---- Stage: Dashboard --------------------------------------------------------------
  if (stage === 'dashboard') {
    const mcqMarks = mcqQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const codingMarks = codingQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);

    return (
      <ExamDashboard
        companyName={examSession.exam.title}
        examTitle={examSession.exam.title}
        totalMarks={examSession.exam.totalMarks}
        candidateName={examSession.student.name}
        candidateId={examSession.student.id}
        timeRemainingSeconds={timeRemaining}
        mcqStatus={mcqStatus}
        mcqMeta={{
          itemCountLabel: `${mcqQuestions.length} Question${mcqQuestions.length === 1 ? '' : 's'}`,
          marks: mcqMarks
        }}
        codingStatus={codingStatus}
        codingMeta={{
          itemCountLabel: `${codingQuestions.length} Problem${codingQuestions.length === 1 ? '' : 's'}`,
          marks: codingMarks
        }}
        onStartMcq={() => {
          setMcqStatus('in_progress');
          setStage('mcq');
        }}
        onContinueMcq={() => setStage('mcq')}
        onReviewMcq={() => setStage('mcq')}
        onStartCoding={() => {
          setCodingStatus('in_progress');
          setStage('coding');
        }}
        onContinueCoding={() => setStage('coding')}
        onReviewCoding={() => setStage('coding')}
        onSubmitExam={handleFinalSubmit}
      />
    );
  }

  // ---- Stage: Coding ------------------------------------------------------------------
  if (stage === 'coding') {
    return (
      <CodingTest
        questions={codingQuestions}
        attemptId={examSession.attempt.id}
        onFinish={() => {
          setCodingStatus('completed');
          setStage('dashboard');
        }}
      />
    );
  }

  // ---- Stage: MCQ ---------------------------------------------------------------------
  const currentQuestion = mcqQuestions[currentQuestionIndex];
  const answeredQuestions = Object.keys(examSession.currentAnswers).filter((id) =>
    mcqQuestions.some((q) => q.id === id)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with timer */}
      <ExamHeader
        title={examSession.exam.title}
        timeRemaining={formatTime(timeRemaining)}
        studentName={examSession.student.name}
        saving={saving}
        lastSaved={lastSaved}
        isWarning={isWarning}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation */}
        <QuestionNavigation
          questions={mcqQuestions}
          currentIndex={currentQuestionIndex}
          answeredQuestions={answeredQuestions}
          onQuestionClick={setCurrentQuestionIndex}
        />

        {/* Question area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="mb-4">
            <Button variant="secondary" onClick={() => setStage('dashboard')}>
              ← Back to Dashboard
            </Button>
          </div>

          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={mcqQuestions.length}
          />

          <AnswerInput
            question={currentQuestion}
            currentAnswer={examSession.currentAnswers[currentQuestion.id] || ''}
            onAnswerChange={(answer) => updateAnswer(currentQuestion.id, answer)}
          />

          {/* Auto-save error message */}
          {autoSaveError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {autoSaveError}. Don't worry, your answers are saved locally.
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between items-center">
            <Button
              variant="secondary"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </Button>

            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {mcqQuestions.length}
            </div>

            {currentQuestionIndex < mcqQuestions.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                Next →
              </Button>
            ) : (
              <SubmitButton
                onSubmit={async () => {
                  setMcqStatus('completed');
                  if (codingStatus === 'locked') {
                    setCodingStatus('not_started');
                  }
                  setStage('dashboard');
                }}
                answeredCount={answeredQuestions.length}
                totalQuestions={mcqQuestions.length}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
