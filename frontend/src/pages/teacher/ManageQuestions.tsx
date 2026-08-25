import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { questionAPI } from '../../services/api';
import { BookOpen, Edit, Trash2, Plus, ArrowLeft } from 'lucide-react';
import type { Question } from '../../types';

const TeacherNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <nav className="border-b" style={{background:"var(--surface-elevated)",borderBottom:"1px solid var(--border)"}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-heading">SecureExam</h1>
              <span className="ml-2 text-sm text-gray-500">Teacher Portal</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm ">Welcome, {user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const ManageQuestions: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [user]);

  const fetchQuestions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await questionAPI.getAll();
      // Filter to show only current teacher's questions
      const myQuestions = data.filter((q: Question) => q.createdBy === user.id);
      setQuestions(myQuestions);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    setDeleting(id);
    try {
      await questionAPI.delete(id);
      // Remove from list
      setQuestions(questions.filter(q => (q._id || q.id) !== id));
    } catch (err: any) {
      console.error('Error deleting question:', err);
      alert(err.response?.data?.error || 'Failed to delete question');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen">
      <TeacherNavbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <Link to="/teacher" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Link>
              <h2 className="text-2xl font-bold text-heading">Manage Questions</h2>
              <p className="text-gray-600">View, edit, and delete your questions</p>
            </div>
            <Link to="/teacher/create-question">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Question
              </Button>
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Questions List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-lg text-gray-600">Loading questions...</div>
            </div>
          ) : questions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-heading">No questions yet</h3>
                <p className="mt-2 text-gray-500">Get started by creating your first question</p>
                <Link to="/teacher/create-question">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Question
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question._id || question.id || index}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-heading mb-3">
                          {question.question}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {question.options.map((option, i) => (
                            <div 
                              key={i} 
                              className={`p-2 rounded text-sm ${
                                option === question.answer 
                                  ? 'bg-green-50 border border-green-200 text-green-800 font-medium' 
                                  : 'card-surface'
                              }`}
                            >
                              {String.fromCharCode(65 + i)}. {option}
                              {option === question.answer && ' ✓'}
                            </div>
                          ))}
                        </div>

                        {question.explanation && (
                          <p className="text-sm mb-3" style={{color:"var(--text-secondary)"}}>
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </p>
                        )}

                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {question.difficulty}
                          </span>
                          <span className="text-sm text-gray-500">{question.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* TODO: Implement edit */}}
                          disabled
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(question._id || question.id!)}
                          disabled={deleting === (question._id || question.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deleting === (question._id || question.id) ? (
                            'Deleting...'
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageQuestions;
