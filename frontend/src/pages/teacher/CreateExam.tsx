import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { categoryAPI, codingQuestionAPI, questionAPI, examAPI } from '../../services/api';
import { ArrowDown, ArrowLeft, ArrowUp, Code2, Plus, LogOut, Search, X } from 'lucide-react';
import type { Category, CodingQuestion, Question } from '../../types';

const CreateExam: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const isEditMode = Boolean(examId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [availableCodingQuestions, setAvailableCodingQuestions] = useState<CodingQuestion[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questionSelectionMode, setQuestionSelectionMode] = useState<'category' | 'manual'>('manual');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedCodingQuestions, setSelectedCodingQuestions] = useState<string[]>([]);
  const [codingSearch, setCodingSearch] = useState('');
  const [codingDifficulty, setCodingDifficulty] = useState('');
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
    fetchCodingQuestions();
    fetchStudents();
    fetchCategories();
    if (examId) {
      fetchExam(examId);
    }
  }, [examId]);

  const formatDateInput = (value?: string | Date) => {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
  };

  const fetchQuestions = async () => {
    try {
      const questions = await questionAPI.getAll();
      setAvailableQuestions(questions);
    } catch {
      setError('Failed to fetch questions');
    }
  };

  const fetchCodingQuestions = async () => {
    try {
      const result = await codingQuestionAPI.getAll({
        search: codingSearch || undefined,
        difficulty: codingDifficulty || undefined,
        limit: 50
      });
      setAvailableCodingQuestions(result.questions);
    } catch {
      setError('Failed to fetch coding questions');
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

  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const getQuestionCategoryId = (question: Question) => {
    const categoryId = question.categoryId as Category | string | undefined;
    return typeof categoryId === 'object' ? categoryId._id || categoryId.id || '' : categoryId || '';
  };

  const handleCategoryQuestionSelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedQuestions(
      availableQuestions
        .filter(question => getQuestionCategoryId(question) === categoryId)
        .map(question => question._id || question.id!)
    );
  };

  const fetchExam = async (id: string) => {
    try {
      setIsLoading(true);
      const exam = await examAPI.getById(id);
      setTitle(exam.title || '');
      setDescription(exam.description || '');
      setSelectedQuestions(
        ((exam.questions || []) as unknown as Array<Question & { type?: string }>)
          .filter(question => question.type !== 'coding')
          .map(question => question._id || question.id || String(question))
      );
      setSelectedCodingQuestions(
        ((exam.codingQuestions || []) as CodingQuestion[])
          .map(question => question._id || question.id || String(question))
      );
      setQuestionSelectionMode('manual');
      setSelectedStudents((exam.assignedCandidates || []).map(student =>
        typeof student === 'string' ? student : student._id || student.id || ''
      ).filter(Boolean));
      setDuration(exam.duration || 60);
      setTotalMarks(exam.totalMarks || 100);
      setPassingMarks(exam.passingMarks || 40);
      setStartDate(formatDateInput(exam.startDate));
      setEndDate(formatDateInput(exam.endDate));
      setStartTime(exam.startTime || '');
      setEndTime(exam.endTime || '');
    } catch (err: unknown) {
      console.error('Failed to fetch exam:', err);
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || 'Failed to load exam');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const toggleCodingQuestion = (questionId: string) => {
    setSelectedCodingQuestions(current =>
      current.includes(questionId)
        ? current.filter(id => id !== questionId)
        : [...current, questionId]
    );
  };

  const moveCodingQuestion = (questionId: string, direction: -1 | 1) => {
    setSelectedCodingQuestions(current => {
      const index = current.indexOf(questionId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
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
      if (selectedQuestions.length === 0 && selectedCodingQuestions.length === 0) {
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
        codingQuestions: selectedCodingQuestions,
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

      if (isEditMode && examId) {
        await examAPI.update(examId, examData);
      } else {
        await examAPI.create(examData);
      }
      
      setSuccess(
        isEditMode
          ? 'Exam updated successfully!'
          : `Exam created successfully! ${selectedStudents.length > 0 && sendEmailNotification ? `Email notifications sent to ${selectedStudents.length} student(s).` : ''}`
      );
      
      if (isEditMode) {
        setTimeout(() => navigate('/teacher/exams'), 800);
      } else {
        setTitle('');
        setDescription('');
        setSelectedQuestions([]);
        setSelectedCodingQuestions([]);
        setSelectedStudents([]);
        setDuration(60);
        setTotalMarks(100);
        setPassingMarks(40);
        setStartDate('');
        setEndDate('');
        setStartTime('');
        setEndTime('');
        setSendEmailNotification(true);
      }
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || `Failed to ${isEditMode ? 'update' : 'create'} exam. Please try again.`);
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
              <h1 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Exam' : 'Create Exam'}</h1>
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
                    Selected Questions: <span className="font-medium">{selectedQuestions.length + selectedCodingQuestions.length}</span>
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
                    onClick={() => navigate(isEditMode ? '/teacher/exams' : '/teacher')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Exam' : 'Create Exam')}
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
                <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setQuestionSelectionMode('category')}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                      questionSelectionMode === 'category'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Select by Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionSelectionMode('manual')}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                      questionSelectionMode === 'manual'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Select Questions
                  </button>
                </div>

                {questionSelectionMode === 'category' && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(event) => handleCategoryQuestionSelect(event.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category._id || category.id} value={category._id || category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-sm text-blue-700">
                      {selectedQuestions.length} MCQs selected from this category
                    </p>
                  </div>
                )}

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
                        className={`p-4 rounded-lg border transition-colors ${
                          selectedQuestions.includes(question._id!)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${questionSelectionMode === 'manual' ? 'cursor-pointer' : 'cursor-default opacity-95'}`}
                        onClick={() => questionSelectionMode === 'manual' && toggleQuestionSelection(question._id!)}
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
                              onChange={() => questionSelectionMode === 'manual' && toggleQuestionSelection(question._id!)}
                              disabled={questionSelectionMode !== 'manual'}
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

          {/* Coding Question Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code2 className="mr-2 h-5 w-5 text-blue-600" />
                Coding Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex flex-1 rounded-md border border-gray-300 bg-white">
                    <input
                      value={codingSearch}
                      onChange={(event) => setCodingSearch(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void fetchCodingQuestions();
                        }
                      }}
                      placeholder="Search coding questions"
                      className="min-w-0 flex-1 rounded-l-md px-3 py-2 text-sm outline-none"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => void fetchCodingQuestions()}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <select
                    value={codingDifficulty}
                    onChange={(event) => setCodingDifficulty(event.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
                  >
                    <option value="">All</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <Button type="button" variant="outline" size="sm" onClick={() => void fetchCodingQuestions()}>
                    Filter
                  </Button>
                </div>

                {selectedCodingQuestions.length > 0 && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-800">
                      Attached order
                    </p>
                    <div className="space-y-2">
                      {selectedCodingQuestions.map((questionId, index) => {
                        const question = availableCodingQuestions.find(item => (item._id || item.id) === questionId);
                        return (
                          <div key={questionId} className="flex items-center gap-2 rounded-md bg-white p-2 text-sm">
                            <span className="w-5 text-gray-500">{index + 1}.</span>
                            <span className="min-w-0 flex-1 truncate">{question?.title || 'Attached coding question'}</span>
                            <Button type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => moveCodingQuestion(questionId, -1)}>
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" disabled={index === selectedCodingQuestions.length - 1} onClick={() => moveCodingQuestion(questionId, 1)}>
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => toggleCodingQuestion(questionId)} className="text-red-600">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableCodingQuestions.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="mb-4 text-gray-500">No coding questions found</p>
                    <Link to="/teacher/coding-questions/create">
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Create Coding Question
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {availableCodingQuestions.map(question => {
                      const questionId = question._id || question.id || '';
                      const selected = selectedCodingQuestions.includes(questionId);
                      return (
                        <button
                          key={questionId}
                          type="button"
                          onClick={() => toggleCodingQuestion(questionId)}
                          className={`block w-full rounded-lg border p-4 text-left transition-colors ${
                            selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{question.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-gray-500">{question.description}</p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                                <span>{question.difficulty}</span>
                                <span>{question.marks} marks</span>
                                <span>{question.supportedLanguages.join(', ')}</span>
                              </div>
                            </div>
                            <input type="checkbox" readOnly checked={selected} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600" />
                          </div>
                        </button>
                      );
                    })}
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
