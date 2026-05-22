import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { examAttemptAPI } from '../../services/api';
import { ArrowLeft, CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import type { ExamResult } from '../../types';

const Result: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [result, setResult] = useState<ExamResult | null>(location.state?.result || null);
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      if (!attemptId || !user || result) return;
      
      try {
        setLoading(true);
        const response = await examAttemptAPI.getResult(attemptId);
        setResult(response.result);
      } catch (err) {
        console.error('Error fetching result:', err);
        setError('Failed to load exam result. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, user, result]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={() => navigate('/student')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">No result found</div>
      </div>
    );
  }

  const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
  const isPassed = result.passed;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => navigate('/student')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
        </div>

        {/* Result Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-6 h-6 mr-2" />
              {result.examTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getGradeColor(percentage)}`}>
                  {getGradeLetter(percentage)}
                </div>
                <div className="text-sm text-gray-600">Grade</div>
              </div>
              
              <div className="text-center">
                <div className={`text-4xl font-bold ${getGradeColor(percentage)}`}>
                  {percentage}%
                </div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {/* {result.score}/{result.totalQuestions} */}
                  {result.correctAnswers}/{result.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center text-4xl font-bold">
                  <Clock className="w-8 h-8 mr-2 text-blue-600" />
                  {formatTime(result.timeSpent)}
                </div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg border">
              <div className="flex items-center justify-center">
                {isPassed ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-6 h-6 mr-2" />
                    <span className="text-lg font-semibold">Passed</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <XCircle className="w-6 h-6 mr-2" />
                    <span className="text-lg font-semibold">Failed</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Results */}
        <Card>
          <CardHeader>
            <CardTitle>Question by Question Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!result.detailed_results || result.detailed_results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Detailed question results are not available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {result.detailed_results.map((questionResult, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      questionResult.isCorrect 
                        ? 'border-l-green-500 bg-green-50' 
                        : 'border-l-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Question {index + 1}: {questionResult.question}
                        </h4>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Your Answer: </span>
                            <span className={questionResult.isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {questionResult.selectedAnswer || 'No answer'}
                            </span>
                          </div>
                          
                          {!questionResult.isCorrect && (
                            <div>
                              <span className="font-medium">Correct Answer: </span>
                              <span className="text-green-700">
                                {questionResult.correctAnswer}
                              </span>
                            </div>
                          )}

                          {questionResult.explanation && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <span className="font-medium">Explanation: </span>
                              <span className="text-gray-700">{questionResult.explanation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {questionResult.isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Result;
