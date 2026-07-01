import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { SessionStatus } from '../../components/SessionStatus';
import { questionAPI, examAPI } from '../../services/api';
import { BookOpen, Code2, FileText, ListChecks, LogOut, User, BarChart3 } from 'lucide-react';
import type { Question, Exam } from '../../types';

const TeacherNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SecureExam</h1>
              <span className="ml-2 text-sm text-gray-500">Teacher Portal</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/teacher"
                className={`${
                  isActive('/teacher')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <User className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              <Link
                to="/teacher/create-question"
                className={`${
                  isActive('/teacher/create-question')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Create Question
              </Link>
              <Link
                to="/teacher/mcq"
                className={`${
                  isActive('/teacher/mcq')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <ListChecks className="w-4 h-4 mr-2" />
                Manage MCQ
              </Link>
              <Link
                to="/teacher/create-exam"
                className={`${
                  isActive('/teacher/create-exam')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Create Exam
              </Link>
              <Link
                to="/teacher/coding-questions"
                className={`${
                  location.pathname.startsWith('/teacher/coding-questions')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <Code2 className="w-4 h-4 mr-2" />
                Coding
              </Link>
            </div>
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
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [questionsData, examsData] = await Promise.all([
          questionAPI.getAll(),
          examAPI.getAll()
        ]);
        
        console.log('User ID:', user.id);
        console.log('All Questions:', questionsData);
        console.log('All Exams:', examsData);
        
        // Ensure we have arrays, not undefined
        const safeQuestions = Array.isArray(questionsData) ? questionsData : [];
        const safeExams = Array.isArray(examsData) ? examsData : [];
        
        // Filter to show only current teacher's content
        // Check both createdBy and creator fields, and handle both string and object formats
        const myQuestions = safeQuestions.filter((q: Question) => {
          if (!q.createdBy) return false;
          const creatorId = String(q.createdBy);
          const userId = String(user.id);
          return creatorId === userId;
        });
        
        const myExams = safeExams.filter((e: Exam) => {
          // If createdBy is not set, include the exam (for debugging)
          if (!e.createdBy) {
            console.log('Exam without createdBy:', e.title, e);
            return true; // Show exams without createdBy field
          }
          const creatorId = String(e.createdBy);
          const userId = String(user.id);
          console.log('Comparing exam:', e.title, 'creator:', creatorId, 'with user:', userId, 'match:', creatorId === userId);
          return creatorId === userId;
        });
        
        console.log('My Questions:', myQuestions.length);
        console.log('My Exams:', myExams.length);
        
        setQuestions(myQuestions);
        setExams(myExams);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        // Set empty arrays on error
        setQuestions([]);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNavbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher Dashboard</h2>
            <p className="text-gray-600">
              Welcome back, {user?.name}! Manage your questions and exams below.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Questions Created
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {loading ? '...' : questions.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    to="/teacher/create-question"
                    className="font-medium text-blue-700 hover:text-blue-900"
                  >
                    Create new question →
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ListChecks className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Manage MCQ
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {loading ? '...' : questions.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    to="/teacher/mcq"
                    className="font-medium text-cyan-700 hover:text-cyan-900"
                  >
                    Open library →
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Exams Created
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {loading ? '...' : exams.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    to="/teacher/create-exam"
                    className="font-medium text-green-700 hover:text-green-900"
                  >
                    Create new exam →
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Exams
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {loading ? '...' : exams.filter(e => e.isActive).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    to="/teacher/exams"
                    className="font-medium text-purple-700 hover:text-purple-900"
                  >
                    Manage exams →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Session Information */}
          <div className="mb-8">
            <SessionStatus />
          </div>

          {/* Recent Questions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recent Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : questions.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No questions created yet</p>
                  <Link to="/teacher/create-question">
                    <Button className="mt-4">Create Your First Question</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.slice(0, 5).map((question, index) => (
                    <div key={question._id || index} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{question.question}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {question.difficulty}
                          </span>
                        </span>
                        <span>{question.category}</span>
                      </div>
                    </div>
                  ))}
                  {questions.length > 5 && (
                    <Link to="/teacher/questions" className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View all {questions.length} questions →
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Exams */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Exams</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : exams.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No exams created yet</p>
                  <Link to="/teacher/create-exam">
                    <Button className="mt-4">Create Your First Exam</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {exams.slice(0, 5).map((exam, index) => (
                    <div key={exam._id || index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{exam.title}</p>
                          <p className="text-sm text-gray-500 mt-1">{exam.description}</p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>{exam.questionsCount || exam.questions?.length || 0} questions</span>
                            <span>{exam.duration} minutes</span>
                            <span>{exam.totalMarks} marks</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          exam.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {exams.length > 5 && (
                    <Link to="/teacher/exams" className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View all {exams.length} exams →
                    </Link>
                  )}
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
