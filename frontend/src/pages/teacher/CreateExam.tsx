import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { questionAPI, examAPI } from '../../services/api';
import { ArrowLeft, Plus, LogOut } from 'lucide-react';
import type { Question, Exam } from '../../types';

const CreateExam: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(60);
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [passingMarks, setPassingMarks] = useState<number>(40);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  useEffect(() => {
    fetchQuestions();
    fetchStudents();
  }, []);

  const fetchQuestions = async () => {
    try {
      const questions = await questionAPI.getAll();
      setAvailableQuestions(questions);
    } catch {
      setError('Failed to fetch questions');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await examAPI.getStudents();
      setAvailableStudents(response.students || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      // Don't show error as students are optional
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (selectedQuestions.length === 0) {
        setError('Please select at least one question');
        return;
      }

      if (passingMarks > totalMarks) {
        setError('Passing marks cannot be greater than total marks');
        return;
      }

      const examData = {
        title: title.trim(),
        description: description.trim() || undefined,
        questions: selectedQuestions,
        duration,
        totalMarks,
        passingMarks,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        assignedStudents: selectedStudents.length > 0 ? selectedStudents : undefined,
        sendEmailNotification: selectedStudents.length > 0 ? sendEmailNotification : false,
      };

      await examAPI.create(examData as any);
      
      setSuccess(`Exam created successfully! ${selectedStudents.length > 0 && sendEmailNotification ? `Email notifications sent to ${selectedStudents.length} student(s).` : ''}`);
      
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedQuestions([]);
      setSelectedStudents([]);
      setDuration(60);
      setTotalMarks(100);
      setPassingMarks(40);
      setStartDate('');
      setEndDate('');
      setStartTime('');
      setEndTime('');
      setSendEmailNotification(true);
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch {
      setError('Failed to create exam. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/teacher"
                className="flex items-center text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Create Exam</h1>
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

      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exam Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Exam Title *
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter exam title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Enter exam description..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Duration (minutes) *
                    </label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700">
                      Total Marks *
                    </label>
                    <Input
                      id="totalMarks"
                      type="number"
                      min="1"
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="passingMarks" className="block text-sm font-medium text-gray-700">
                      Passing Marks *
                    </label>
                    <Input
                      id="passingMarks"
                      type="number"
                      min="1"
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold text-gray-900">Exam Schedule (Optional)</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                        Start Time
                      </label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                        End Time
                      </label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {selectedStudents.length > 0 && (
                  <div className="pt-3 border-t">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendEmailNotification}
                        onChange={(e) => setSendEmailNotification(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        📧 Send email notifications to students
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-7">
                      Students will receive a beautifully formatted email with exam details and schedule
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Selected Questions: <span className="font-medium">{selectedQuestions.length}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Assigned Students: <span className="font-medium">
                      {selectedStudents.length === 0 ? 'All students' : selectedStudents.length}
                    </span>
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                {success && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="text-sm text-green-700">{success}</div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/teacher')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Exam'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Question Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Questions *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No questions available</p>
                    <Link to="/teacher/create-question">
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Question
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {availableQuestions.map((question) => (
                      <div
                        key={question._id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedQuestions.includes(question._id!)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleQuestionSelection(question._id!)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              {question.question}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {question.difficulty && (
                                <span className={`px-2 py-1 rounded-full ${
                                  question.difficulty === 'easy' 
                                    ? 'bg-green-100 text-green-800'
                                    : question.difficulty === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {question.difficulty}
                                </span>
                              )}
                              {question.category && (
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                  {question.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <input
                              type="checkbox"
                              checked={selectedQuestions.includes(question._id!)}
                              onChange={() => toggleQuestionSelection(question._id!)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Student Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Assign Students (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Select specific students or leave empty to make exam available to all students.
                </p>
                
                {availableStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No students registered yet</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStudents(availableStudents.map(s => s.id))}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStudents([])}
                      >
                        Clear
                      </Button>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {availableStudents.map((student) => (
                        <div
                          key={student.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedStudents.includes(student.id)
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleStudentSelection(student.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {student.name}
                              </p>
                              <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateExam;
