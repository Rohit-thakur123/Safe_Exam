import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { codingExecutionAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface CodingSubmission {
  _id: string;
  studentId?: { name: string; email: string };
  codingQuestionId?: { title: string };
  language: string;
  sourceCode: string;
  executionTime: number;
  memoryUsage: number;
  passedTestCases: number;
  failedTestCases: number;
  score: number;
  totalMarks: number;
  submittedAt: string;
}

const CodingSubmissions: React.FC = () => {
  const { examId = '' } = useParams<{ examId: string }>();
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    codingExecutionAPI.getExamSubmissions(examId)
      .then(setSubmissions)
      .catch((requestError: unknown) => {
        const message = (requestError as { response?: { data?: { error?: string } } }).response?.data?.error;
        setError(message || 'Failed to load coding submissions');
      })
      .finally(() => setLoading(false));
  }, [examId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/teacher/exams" className="mb-5 inline-flex items-center text-sm text-blue-600">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Coding Submissions</h1>
        <p className="mt-1 text-gray-600">Review submitted code and testcase totals for this exam.</p>

        {error && <div className="mt-5 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {loading ? <p className="mt-6 text-gray-500">Loading submissions...</p> :
          submissions.length === 0 ? <Card className="mt-6"><CardContent className="p-8 text-center text-gray-500">No coding submissions yet.</CardContent></Card> :
            <div className="mt-6 space-y-5">
              {submissions.map(submission => (
                <Card key={submission._id}>
                  <CardHeader>
                    <CardTitle>{submission.codingQuestionId?.title || 'Coding Question'}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {submission.studentId?.name} · {submission.studentId?.email} · {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
                      <span>Language: {submission.language}</span>
                      <span>Passed: {submission.passedTestCases}</span>
                      <span>Failed: {submission.failedTestCases}</span>
                      <span>Score: {submission.score}/{submission.totalMarks}</span>
                      <span>Time: {submission.executionTime} ms</span>
                      <span>Memory: {Math.ceil(submission.memoryUsage / 1024)} KB</span>
                    </div>
                    <pre className="max-h-96 overflow-auto rounded-md bg-gray-950 p-4 text-sm text-gray-100">{submission.sourceCode}</pre>
                  </CardContent>
                </Card>
              ))}
            </div>}
      </main>
    </div>
  );
};

export default CodingSubmissions;
