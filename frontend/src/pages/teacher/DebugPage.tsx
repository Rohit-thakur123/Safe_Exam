import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { examAPI, questionAPI } from '../../services/api';
import { ArrowLeft } from 'lucide-react';

const DebugPage: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [examsData, questionsData] = await Promise.all([
          examAPI.getAll(),
          questionAPI.getAll()
        ]);
        setExams(examsData);
        setQuestions(questionsData);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/teacher" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4">Debug Information</h1>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Current User</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {/* Exams */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            All Exams ({exams.length})
          </h2>
          {exams.length === 0 ? (
            <p className="text-gray-500">No exams found in database</p>
          ) : (
            <div className="space-y-4">
              {exams.map((exam, index) => (
                <div key={index} className="border rounded p-4">
                  <h3 className="font-bold text-lg mb-2">{exam.title}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">ID (_id):</span> {exam._id || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">ID (id):</span> {exam.id || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Created By:</span> {exam.createdBy || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Is Active:</span> {exam.isActive ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <span className="font-semibold">Duration:</span> {exam.duration} min
                    </div>
                    <div>
                      <span className="font-semibold">Total Marks:</span> {exam.totalMarks}
                    </div>
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View Full JSON
                    </summary>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto mt-2 text-xs">
                      {JSON.stringify(exam, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            All Questions ({questions.length})
          </h2>
          {questions.length === 0 ? (
            <p className="text-gray-500">No questions found in database</p>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="border rounded p-4">
                  <h3 className="font-bold mb-2">{question.question}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">ID (_id):</span> {question._id || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">ID (id):</span> {question.id || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Created By:</span> {question.createdBy || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Difficulty:</span> {question.difficulty || 'N/A'}
                    </div>
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View Full JSON
                    </summary>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto mt-2 text-xs">
                      {JSON.stringify(question, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparison */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">ID Comparison</h2>
          <div className="space-y-2">
            <p><span className="font-semibold">Current User ID:</span> {user?.id || 'N/A'}</p>
            <p className="text-sm text-gray-600 mt-4">
              Check if the "Created By" field in exams/questions matches your user ID.
              If they don't match, that's why they're not showing up on the dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
