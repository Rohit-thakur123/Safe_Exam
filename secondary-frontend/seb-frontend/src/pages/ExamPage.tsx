// Main exam page component — orchestrates Dashboard -> MCQ -> Coding -> Submit
// Phase 1: Persistent stage/section/question across page refreshes via StorageService
// Phase 2: Violation reporting wired to useTabVisibility
// Phase 3: Navigation confirmation dialogs before leaving active sections
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamSession, AlreadySubmittedError } from '../hooks/useExamSession';
import { useAutoSave } from '../hooks/useAutoSave';
import { useTimer } from '../hooks/useTimer';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useTabVisibility } from '../hooks/useTabVisibility';
import { StorageService } from '../services/storageService';
import { reportViolation } from '../services/violationService';

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

  // Section completion state (persisted)
  const [stage, setStageRaw] = useState<Stage>('dashboard');
  const [currentQuestionIndex, setCurrentQuestionIndexRaw] = useState(0);
  const [mcqStatus, setMcqStatusRaw] = useState<McqStatus>('not_started');
  const [codingStatus, setCodingStatusRaw] = useState<CodingStatus>('locked');
  const [sectionsInitialized, setSectionsInitialized] = useState(false);

  // Phase 3: Confirmation dialogs
  const [leaveSectionPending, setLeaveSectionPending] = useState<Stage | null>(null);

  // Phase 2: Tab violation tracking
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const MAX_TAB_SWITCHES = 3;

  const {
    examSession,
    loading,
    error,
    initializeExam,
    updateAnswer,
    submitExam
  } = useExamSession();

  // --- Phase 1: Persisted state setters ---
  const setStage = useCallback((s: Stage) => {
    setStageRaw(s);
    if (examId) StorageService.saveExamStage(examId, s);
  }, [examId]);

  const setCurrentQuestionIndex = useCallback((idx: number | ((prev: number) => number)) => {
    setCurrentQuestionIndexRaw((prev) => {
      const next = typeof idx === 'function' ? idx(prev) : idx;
      if (examId) StorageService.saveCurrentQuestion(examId, next);
      return next;
    });
  }, [examId]);

  const setMcqStatus = useCallback((s: McqStatus) => {
    setMcqStatusRaw(s);
    setCodingStatusRaw((prevCoding) => {
      if (examId) StorageService.saveSectionStatuses(examId, { mcqStatus: s, codingStatus: prevCoding });
      return prevCoding;
    });
  }, [examId]);

  const setCodingStatus = useCallback((s: CodingStatus) => {
    setCodingStatusRaw(s);
    setMcqStatusRaw((prevMcq) => {
      if (examId) StorageService.saveSectionStatuses(examId, { mcqStatus: prevMcq, codingStatus: s });
      return prevMcq;
    });
  }, [examId]);

  // --- Initialize exam ---
  useEffect(() => {
    if (examId && sessionToken) {
      initializeExam(examId, sessionToken).catch((err) => {
        // Phase 9: If the exam was already submitted, redirect to success page
        if (err instanceof AlreadySubmittedError) {
          // Clean up any lingering local data
          StorageService.clearExamData(examId);
          navigate('/exam/submit-success?reason=already_submitted');
          return;
        }
        navigate(`/exam/error?message=${encodeURIComponent(err.message)}&code=LOAD_FAILED`);
      });
    }
  }, [examId, sessionToken, initializeExam, navigate]);

  // --- Phase 1: Restore stage from storage after session loads ---
  useEffect(() => {
    if (!examSession || !examId) return;

    const savedStage = StorageService.loadExamStage(examId) as Stage | null;
    const savedIndex = StorageService.loadCurrentQuestion(examId);
    const savedStatuses = StorageService.loadSectionStatuses(examId);

    if (savedStage) setStageRaw(savedStage);
    if (savedIndex) setCurrentQuestionIndexRaw(savedIndex);
    if (savedStatuses) {
      setMcqStatusRaw(savedStatuses.mcqStatus as McqStatus);
      setCodingStatusRaw(savedStatuses.codingStatus as CodingStatus);
      setSectionsInitialized(true);
    }
  }, [examSession, examId]);

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
      setMcqStatusRaw('completed');
      setCodingStatusRaw(codingQuestions.length > 0 ? 'not_started' : 'completed');
    } else {
      setMcqStatusRaw('not_started');
      setCodingStatusRaw(codingQuestions.length > 0 ? 'locked' : 'completed');
    }
    setSectionsInitialized(true);

    // Persist initial statuses
    if (examId) {
      StorageService.saveSectionStatuses(examId, {
        mcqStatus: mcqQuestions.length === 0 ? 'completed' : 'not_started',
        codingStatus: codingQuestions.length > 0 ? (mcqQuestions.length === 0 ? 'not_started' : 'locked') : 'completed',
      });
    }
  }, [examSession, sectionsInitialized, mcqQuestions.length, codingQuestions.length, examId]);

  // Auto-save MCQ answers
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
          // Phase 9: Clear storage on submission
          if (examId) StorageService.clearExamData(examId);
          navigate(`/exam/submit-success?autoSubmit=true&score=${result.score}&percentage=${result.percentage}`);
        } catch (error) {
          console.error('Auto-submit failed:', error);
          navigate('/exam/error?message=Failed%20to%20submit%20exam');
        }
      }
    }
  });

  useHeartbeat(examSession?.attempt.id || null);

  const handleCheatingAutoSubmit = async () => {
    if (!examSession) return;
    try {
      const result = await submitExam();
      if (examId) StorageService.clearExamData(examId);
      navigate(`/exam/submit-success?autoSubmit=true&reason=tab_switch_violation&score=${result.score}&percentage=${result.percentage}`);
    } catch (err) {
      console.error('Auto-submit (tab-switch violation) failed:', err);
      navigate('/exam/error?message=Exam%20auto-submitted%20due%20to%20tab%20switch%20violations');
    }
  };

  // Phase 2: Tab visibility with violation reporting
  useTabVisibility({
    attemptId: examSession?.attempt.id || null,
    onTabSwitch: (isHidden) => {
      if (!isHidden) return;
      setTabSwitchCount((prev) => {
        const next = prev + 1;
        if (next >= MAX_TAB_SWITCHES) {
          handleCheatingAutoSubmit();
        } else {
          setShowTabWarning(true);
        }
        return next;
      });
    }
  });

  // Auto-hide the warning banner
  useEffect(() => {
    if (!showTabWarning) return;
    const timeoutId = setTimeout(() => setShowTabWarning(false), 4000);
    return () => clearTimeout(timeoutId);
  }, [showTabWarning]);

  // Phase 3: Navigation guard
  const requestStageChange = useCallback((target: Stage) => {
    if (stage === 'mcq' || stage === 'coding') {
      setLeaveSectionPending(target);
    } else {
      setStage(target);
    }
  }, [stage, setStage]);

  const confirmLeaveSection = useCallback(() => {
    if (leaveSectionPending) {
      setStage(leaveSectionPending);
    }
    setLeaveSectionPending(null);
  }, [leaveSectionPending, setStage]);

  const cancelLeaveSection = useCallback(() => {
    setLeaveSectionPending(null);
  }, []);

  const tabWarningBanner = showTabWarning ? (
    <div className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-center py-3 px-4 shadow-lg">
      <strong>⚠ Warning ({tabSwitchCount}/{MAX_TAB_SWITCHES}):</strong> Leaving the exam window is recorded.
      Your exam will be auto-submitted if this happens {MAX_TAB_SWITCHES} times.
    </div>
  ) : null;

  // Phase 3: Confirmation modal
  const leaveConfirmModal = leaveSectionPending ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Leave This Section?</h2>
        <p className="text-gray-600 mb-6">
          You are about to leave the current section. Your answers are saved. You can return at any time before final submission.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={cancelLeaveSection}>Stay Here</Button>
          <Button variant="default" onClick={confirmLeaveSection}>Leave Section</Button>
        </div>
      </div>
    </div>
  ) : null;

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
          <Button variant="default" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const handleFinalSubmit = async () => {
    try {
      const result = await submitExam();
      // Phase 9: Clear all local data immediately on successful submission
      if (examId) StorageService.clearExamData(examId);
      navigate(`/exam/submit-success?score=${result.score}&percentage=${result.percentage}`);
    } catch (err) {
      console.error('Final submit failed:', err);
      navigate('/exam/error?message=Failed%20to%20submit%20exam');
    }
  };

  // ---- Stage: Dashboard -------------------------------------------------------
  if (stage === 'dashboard') {
    const mcqMarks = mcqQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const codingMarks = codingQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);

    return (
      <>
        {tabWarningBanner}
        {leaveConfirmModal}
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
      </>
    );
  }

  // ---- Stage: Coding ----------------------------------------------------------
  if (stage === 'coding') {
    return (
      <>
        {tabWarningBanner}
        {leaveConfirmModal}
        <CodingTest
          questions={codingQuestions}
          attemptId={examSession.attempt.id}
          examId={examSession.attempt.examId}
          onFinish={() => {
            setCodingStatus('completed');
            requestStageChange('dashboard');
          }}
        />
      </>
    );
  }

  // ---- Stage: MCQ -------------------------------------------------------------
  const currentQuestion = mcqQuestions[currentQuestionIndex];
  const answeredQuestions = Object.keys(examSession.currentAnswers).filter((id) =>
    mcqQuestions.some((q) => q.id === id)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {tabWarningBanner}
      {leaveConfirmModal}
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
            <Button variant="secondary" onClick={() => requestStageChange('dashboard')}>
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
            onAnswerChange={(answer) => {
              // Phase 2: Report paste attempts by tracking the source (keyboard shortcuts are blocked in App.tsx)
              updateAnswer(currentQuestion.id, answer);
            }}
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
                variant="default"
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
                  requestStageChange('dashboard');
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
