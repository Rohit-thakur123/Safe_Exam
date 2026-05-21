// Main exam page component
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamSession } from '../hooks/useExamSession';
import { useAutoSave } from '../hooks/useAutoSave';
import { useTimer } from '../hooks/useTimer';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useTabVisibility } from '../hooks/useTabVisibility';

import { ExamHeader } from '../components/exam/ExamHeader';
import { QuestionNavigation } from '../components/exam/QuestionNavigation';
import { QuestionDisplay } from '../components/exam/QuestionDisplay';
import { AnswerInput } from '../components/exam/AnswerInput';
import { SubmitButton } from '../components/exam/SubmitButton';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';

export const ExamPage = () => {
  const { examId, sessionToken } = useParams<{ 
    examId: string; 
    sessionToken: string;
  }>();
  
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
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
  
  const currentQuestion = examSession.exam.questions[currentQuestionIndex];
  const answeredQuestions = Object.keys(examSession.currentAnswers);
  
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
          questions={examSession.exam.questions}
          currentIndex={currentQuestionIndex}
          answeredQuestions={answeredQuestions}
          onQuestionClick={setCurrentQuestionIndex}
        />
        
        {/* Question area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={examSession.exam.questions.length}
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
              Question {currentQuestionIndex + 1} of {examSession.exam.questions.length}
            </div>
            
            {currentQuestionIndex < examSession.exam.questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                Next →
              </Button>
            ) : (
              <SubmitButton
                onSubmit={async () => {
                  const result = await submitExam();
                  navigate(`/exam/submit-success?score=${result.score}&percentage=${result.percentage}`);
                }}
                answeredCount={answeredQuestions.length}
                totalQuestions={examSession.exam.questions.length}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};