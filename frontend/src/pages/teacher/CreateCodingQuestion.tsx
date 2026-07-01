import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import api from '../../services/api';
import { ArrowLeft, LogOut } from 'lucide-react';

const supportedLanguagesOptions = ['Python', 'Java', 'JavaScript', 'C', 'C++'];

const CreateCodingQuestion: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { questionId } = useParams<{ questionId: string }>();
  const isEditMode = Boolean(questionId);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [marks, setMarks] = useState(10);
  const [timeLimit, setTimeLimit] = useState(2);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [starterCode, setStarterCode] = useState('');
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['Python']);

  useEffect(() => {
    if (questionId) {
      fetchQuestion(questionId);
    }
  }, [questionId]);

  const fetchQuestion = async (id: string) => {
    try {
      const response = await api.get(`/coding-questions/${id}`);
      const question = response.data.question;
      setTitle(question.title || '');
      setDescription(question.description || '');
      setConstraints(question.constraints || '');
      setInputFormat(question.inputFormat || '');
      setOutputFormat(question.outputFormat || '');
      setExplanation(question.explanation || '');
      setDifficulty(question.difficulty || 'Medium');
      setMarks(question.marks || 10);
      setTimeLimit(question.timeLimit || 2);
      setMemoryLimit(question.memoryLimit || 256);
      setStarterCode(question.starterCode || '');
      setSupportedLanguages(question.supportedLanguages || ['Python']);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || 'Failed to load coding question');
    }
  };

  const toggleLanguage = (language: string) => {
    setSupportedLanguages((prev) => prev.includes(language) ? prev.filter((item) => item !== language) : [...prev, language]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        constraints: constraints.trim(),
        inputFormat: inputFormat.trim(),
        outputFormat: outputFormat.trim(),
        explanation: explanation.trim(),
        difficulty,
        marks,
        timeLimit,
        memoryLimit,
        starterCode: starterCode.trim(),
        supportedLanguages
      };

      if (isEditMode && questionId) {
        await api.put(`/coding-questions/${questionId}`, payload);
        setSuccess('Coding question updated successfully!');
      } else {
        const response = await api.post('/coding-questions', payload);
        navigate(`/teacher/coding-questions/${response.data.question._id || response.data.question.id}`);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || 'Failed to save coding question');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/teacher/coding-questions" className="flex items-center text-gray-500 hover:text-gray-700 mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Coding Questions
              </Link>
              <h1 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Coding Question' : 'Create Coding Question'}</h1>
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

      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Coding Question' : 'Create New Coding Question'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Two Sum" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="Describe the problem" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Constraints *</label>
                  <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="Enter constraints" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Input Format *</label>
                  <textarea value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="Describe input format" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Output Format *</label>
                  <textarea value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="Describe output format" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Explanation *</label>
                  <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="Explain the solution" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')} className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marks</label>
                  <Input type="number" min="1" value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Limit (s)</label>
                  <Input type="number" min="1" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Memory Limit (MB)</label>
                  <Input type="number" min="1" value={memoryLimit} onChange={(e) => setMemoryLimit(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supported Languages *</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {supportedLanguagesOptions.map((language) => (
                    <button key={language} type="button" onClick={() => toggleLanguage(language)} className={`rounded-full px-3 py-2 text-sm ${supportedLanguages.includes(language) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                      {language}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Starter Code *</label>
                <textarea value={starterCode} onChange={(e) => setStarterCode(e.target.value)} rows={8} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none" placeholder="Provide starter code" />
              </div>
              {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
              {success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{success}</div>}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/teacher/coding-questions')}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : isEditMode ? 'Update Question' : 'Create Question'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCodingQuestion;
