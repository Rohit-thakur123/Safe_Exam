import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { SessionStatus } from '../../components/SessionStatus';
import { examAPI, examAttemptAPI } from '../../services/api';
import { LogOut, BookOpen, Clock, Award } from 'lucide-react';
import type { Exam, ExamAttempt } from '../../types';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [examsResponse, attemptsResponse] = await Promise.all([
          examAPI.getAll(),
          examAttemptAPI.getByStudent(user.id)
        ]);
        
        // Ensure we always have arrays, never undefined
        setExams(Array.isArray(examsResponse) ? examsResponse : []);
        setAttempts(Array.isArray(attemptsResponse?.attempts) ? attemptsResponse.attempts : []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data');
        // Set to empty arrays on error to prevent undefined issues
        setExams([]);
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const viewResult = (attemptId: string) => {
    navigate(`/student/result/${attemptId}`);
  };

  const calculateStats = () => {
    // Add null safety checks
    const safeAttempts = Array.isArray(attempts) ? attempts : [];
    const safeExams = Array.isArray(exams) ? exams : [];
    
    const completedAttempts = safeAttempts.filter(a => a.status === 'completed');
    const totalScore = completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const averageScore = completedAttempts.length > 0 ? Math.round(totalScore / completedAttempts.length) : 0;
    
    return {
      availableExams: safeExams.filter(e => e.isActive).length,
      completedExams: completedAttempts.length,
      averageScore: averageScore > 0 ? `${averageScore}%` : 'N/A'
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">SecureExam</h1>
                <span className="ml-2 text-sm text-gray-500">Student Portal</span>
              </div>
            </div>
          </div>
        </nav>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SecureExam</h1>
              <span className="ml-2 text-sm text-gray-500">Student Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Dashboard</h2>
          
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Available Exams
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.availableExams}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed Exams
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.completedExams}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Award className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Average Score
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.averageScore}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Information */}
          <div className="mb-8">
            <SessionStatus />
          </div>

          {/* Available Exams */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Available Exams</CardTitle>
            </CardHeader>
            <CardContent>
              {exams.filter(exam => exam.isActive).length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No exams available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Check back later for new exams from your teachers.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">How to Take an Exam</h3>
                        <p className="mt-1 text-sm text-blue-700">
                          You will receive an email with a unique link to start each exam. Click the link in the email to begin the secure exam process.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {exams.filter(exam => exam.isActive).map((exam) => (
                    <Card key={exam.id || exam._id} className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {exam.description && (
                          <p className="text-gray-600 mb-4 text-sm">{exam.description}</p>
                        )}
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <p><strong>Duration:</strong> {exam.duration} minutes</p>
                          <p><strong>Total Marks:</strong> {exam.totalMarks}</p>
                          <p><strong>Passing Marks:</strong> {exam.passingMarks}</p>
                          <p><strong>Questions:</strong> {exam.questions?.length || 0}</p>
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <p className="text-sm text-yellow-800">
                            📧 <strong>Check your email</strong> for the secure exam link to start this exam.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Results</CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.filter(a => a.status === 'completed').length === 0 ? (
                <div className="text-center py-8">
                  <Award className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Complete an exam to see your results here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attempts
                    .filter(a => a.status === 'completed')
                    .slice(0, 5)
                    .map((attempt) => {
                      const exam = exams.find(e => (e.id || e._id) === attempt.examId);
                      return (
                        <div
                          key={attempt.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <h4 className="font-medium">{exam?.title || 'Unknown Exam'}</h4>
                            <p className="text-sm text-gray-500">
                              Score: {attempt.score}/{attempt.totalMarks} ({attempt.percentage}%)
                            </p>
                            <p className="text-sm text-gray-500">
                              {attempt.passed ? (
                                <span className="text-green-600 font-medium">Passed</span>
                              ) : (
                                <span className="text-red-600 font-medium">Failed</span>
                              )}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewResult(attempt.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
