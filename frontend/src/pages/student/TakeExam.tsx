import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { examAttemptAPI } from '../../services/api';
import { ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import type { ExamAttempt, Question } from '../../types';

const TakeExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const startExamAttempt = async () => {
      if (!examId || !user) return;
      
      try {
        setLoading(true);
        const response = await examAttemptAPI.start(examId);
        
        setAttempt(response.attempt);
        setQuestions(response.attempt.exam?.questions || []);
        setTimeLeft((response.attempt.exam?.duration || 0) * 60); // Convert minutes to seconds
      } catch (err: any) {
        console.error('Error starting exam:', err);
        
        // Handle specific error cases
        if (err.response?.status === 409) {
          const errorMsg = err.response?.data?.error || 'You have already started this exam.';
          const attemptId = err.response?.data?.attemptId;
          
          if (attemptId) {
            setError(`${errorMsg} Redirecting to your existing attempt...`);
            // Redirect to the existing attempt after 2 seconds
            setTimeout(() => {
              window.location.reload(); // Reload to load the existing attempt
            }, 2000);
          } else {
            setError(`${errorMsg} Please check your exam history or contact your teacher.`);
          }
        } else if (err.response?.status === 404) {
          setError('Exam not found. It may have been deleted.');
        } else if (err.response?.status === 403) {
          setError(err.response?.data?.error || 'You do not have permission to take this exam.');
        } else {
          setError(err.response?.data?.error || 'Failed to start exam. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    startExamAttempt();
  }, [examId, user]);

  const handleSubmit = useCallback(async () => {
    if (!attempt || !attempt.exam) return;
    
    setSubmitting(true);
    try {
      const timeSpent = (attempt.exam.duration * 60) - timeLeft;
      const result = await examAttemptAPI.submit(attempt.id, answers, timeSpent);
      
      // Navigate to results page
      navigate(`/student/result/${attempt.id}`, { 
        state: { result: result.result } 
      });
    } catch (err) {
      console.error('Error submitting exam:', err);
      setError('Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [attempt, timeLeft, answers, navigate]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && attempt) {
      handleSubmit();
    }
  }, [timeLeft, attempt, handleSubmit]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Starting exam...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="text-red-600 text-lg font-semibold mb-2">
                Unable to Start Exam
              </div>
              <p className="text-gray-700">{error}</p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/student')} 
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              
              {error.includes('already started') && (
                <Button 
                  onClick={() => navigate('/student')} 
                  className="w-full"
                  variant="outline"
                >
                  View My Exam History
                </Button>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-gray-600">
              <p><strong>Note:</strong> If you have an incomplete exam, you may need to complete or abandon it before starting a new attempt.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!attempt || !attempt.exam || !currentQ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading exam...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{attempt.exam.title}</h1>
              <p className="text-sm text-gray-500">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-lg font-semibold">
                <Clock className="w-5 h-5 mr-2 text-red-600" />
                <span className={timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {currentQ.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {currentQ.options.map((option, index) => (
                <label 
                  key={index} 
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`question-${currentQ.id || currentQ._id}`}
                    value={option}
                    checked={answers[currentQ.id || currentQ._id!] === option}
                    onChange={(e) => handleAnswerChange(currentQ.id || currentQ._id!, e.target.value)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                variant="outline"
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Answered: {Object.keys(answers).length}/{questions.length}</span>
              </div>
              
              {currentQuestion === questions.length - 1 ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Exam
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TakeExam;
