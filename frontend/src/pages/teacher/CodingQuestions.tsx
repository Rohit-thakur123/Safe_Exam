import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ArrowLeft, Eye, Plus, Pencil, Trash2, Search, LogOut } from 'lucide-react';
import api from '../../services/api';

interface CodingQuestion {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  timeLimit: number;
  memoryLimit: number;
  supportedLanguages: string[];
  createdBy?: string;
  createdAt?: string;
}

const CodingQuestions: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchQuestions = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.set('page', String(pageNumber));
      query.set('limit', '8');
      if (search) query.set('search', search);
      if (difficulty) query.set('difficulty', difficulty);
      const response = await api.get(`/coding-questions/all?${query.toString()}`);
      const payload = response.data;
      setQuestions(payload.data || []);
      setTotal(payload.total || 0);
      setTotalPages(payload.totalPages || 1);
      setPage(payload.page || 1);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || 'Failed to load coding questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(1);
  }, []);

  const handleSearch = () => fetchQuestions(1);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Delete this coding question?')) return;
    try {
      await api.delete(`/coding-questions/${id}`);
      fetchQuestions(page);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || 'Failed to delete coding question');
    }
  };

  const canManage = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/teacher" className="flex items-center text-gray-500 hover:text-gray-700 mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Coding Questions</h1>
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
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Coding Questions</h2>
            <p className="text-gray-600">Create, edit, search and filter coding questions.</p>
          </div>
          {canManage && (
            <Button onClick={() => navigate('/teacher/coding-questions/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Coding Question
            </Button>
          )}
        </div>

        {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
                <div className="flex rounded-md border border-gray-300 bg-white">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-l-md px-3 py-2 text-sm outline-none"
                    placeholder="Search by title or description"
                  />
                  <Button type="button" variant="outline" onClick={handleSearch} className="rounded-l-none border-0">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="w-full md:w-48">
                <label className="mb-1 block text-sm font-medium text-gray-700">Difficulty</label>
                <div className="flex rounded-md border border-gray-300 bg-white">
                  <select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setTimeout(() => fetchQuestions(1), 0); }} className="w-full rounded-md px-3 py-2 text-sm outline-none">
                    <option value="">All</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500">Loading coding questions...</div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">No coding questions found.</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <Card key={question._id || question.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{question.title}</h3>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{question.difficulty}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{question.description}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
                        <span>Marks: {question.marks}</span>
                        <span>Time: {question.timeLimit}s</span>
                        <span>Memory: {question.memoryLimit}MB</span>
                        <span>Languages: {question.supportedLanguages.join(', ')}</span>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/coding-questions/${question._id || question.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/coding-questions/edit/${question._id || question.id}`)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(question._id || question.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">Total: {total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchQuestions(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchQuestions(page + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingQuestions;
