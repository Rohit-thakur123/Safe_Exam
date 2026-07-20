import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { examAPI } from '../../services/api';
import { FileText, Edit, Trash2, Plus, ArrowLeft, LogOut, Users, ToggleLeft, ToggleRight, Code2 } from 'lucide-react';
import type { Exam } from '../../types';

interface Student {
  id: string;
  name: string;
  email: string;
}

const TeacherNavbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SecureExam</h1>
              <span className="ml-2 text-sm text-gray-500">Teacher Portal</span>
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

const AssignStudentsModal: React.FC<{
  exam: Exam;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ exam, onClose, onSuccess }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [currentAssignments, setCurrentAssignments] = useState<Student[]>([]);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, [exam]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, assignedData] = await Promise.all([
        examAPI.getStudents(),
        examAPI.getAssignedStudents(exam._id || exam.id!)
      ]);

      setStudents(studentsData.students || []);
      // Backend returns { students: [{ _id, name, email }] } here, not
      // { assignedStudents }, and uses `_id` rather than `id` — normalize
      // to the local Student shape ({ id, name, email }).
      const assignedList: Student[] = (assignedData.students || []).map(
        (s: { _id: string; name: string; email: string }) => ({
          id: s._id,
          name: s.name,
          email: s.email,
        })
      );
      setCurrentAssignments(assignedList);
      setSelectedStudents(assignedList.map((s: Student) => s.id));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await examAPI.assignStudents(
        exam._id || exam.id!,
        selectedStudents,
        sendEmailNotification
      );

      // Backend returns { message, assignedCount, emailsSent } — not an
      // { emailNotifications: { sent, failed, total } } object — so build
      // the message from the fields that actually come back.
      if (response.assignedCount) {
        if (sendEmailNotification && response.emailsSent) {
          setSuccess(`Students assigned successfully! Email notifications sent to ${response.assignedCount} student(s).`);
        } else if (sendEmailNotification && !response.emailsSent) {
          setSuccess('Students assigned successfully, but email notifications failed to send.');
        } else {
          setSuccess('Students assigned successfully!');
        }
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      console.error('Error assigning students:', err);
      const error = err as any;
      setError(error.response?.data?.error || 'Failed to assign students');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Assign Students to Exam</h3>
          <p className="text-sm text-gray-600 mt-1">{exam.title}</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-700">{error}</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">No students available</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Currently assigned: <span className="font-medium">
                    {currentAssignments.length === 0 ? 'All students' : `${currentAssignments.length} students`}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Selected: <span className="font-medium">
                    {selectedStudents.length === 0 ? 'All students (no specific assignments)' : `${selectedStudents.length} students`}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-between mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudents(students.map(s => s.id))}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudents([])}
                >
                  Clear (Open to All)
                </Button>
              </div>

              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedStudents.includes(student.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {selectedStudents.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmailNotification}
                      onChange={(e) => setSendEmailNotification(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      📧 Send email notifications
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-7">
                    Selected students will receive a beautifully formatted email with exam details
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {success && (
          <div className="mx-6 mb-4 bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {error && !success && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Assignments'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const ManageExams: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  useEffect(() => {
    fetchExams();
  }, [user]);

  const fetchExams = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await examAPI.getAll();

      console.log('ManageExams - User ID:', user.id);
      console.log('ManageExams - All Exams:', data);

      // Ensure we have an array
      const safeExams = Array.isArray(data) ? data : [];

      // Filter to show only current teacher's exams
      const myExams = safeExams.filter((e: Exam) => {
        // If createdBy is not set, include the exam (for debugging)
        if (!e.createdBy) {
          console.log('ManageExams - Exam without createdBy:', e.title);
          return true; // Show exams without createdBy field
        }
        const creatorId = String(e.createdBy);
        const userId = String(user.id);
        console.log('ManageExams - Comparing:', e.title, 'creator:', creatorId, 'user:', userId);
        return creatorId === userId;
      });

      console.log('ManageExams - My Exams:', myExams.length);
      setExams(myExams);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load exams');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    setDeleting(id);
    try {
      await examAPI.delete(id);
      setExams(exams.filter(e => (e._id || e.id) !== id));
    } catch (err: any) {
      console.error('Error deleting exam:', err);
      const errorData = err.response?.data;
      if (errorData?.code === 'EXAM_HAS_ATTEMPTS' && errorData?.canForceDelete) {
        const attemptsText = errorData.attemptsCount === 1 ? '1 attempt' : `${errorData.attemptsCount} attempts`;
        const confirmed = window.confirm(
          `This exam has ${attemptsText}. Do you want to delete all attempts and continue?`
        );

        if (confirmed) {
          try {
            await examAPI.delete(id, true);
            setExams(exams.filter(e => (e._id || e.id) !== id));
          } catch (forceErr: any) {
            console.error('Error force deleting exam:', forceErr);
            alert(forceErr.response?.data?.error || 'Failed to delete exam');
          }
        }
      } else {
        alert(errorData?.error || 'Failed to delete exam');
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    setToggling(id);
    try {
      const result = await examAPI.toggleStatus(id);
      // Update the local state
      setExams(exams.map(e =>
        (e._id || e.id) === id ? { ...e, isActive: result.isActive } : e
      ));
    } catch (err: any) {
      console.error('Error toggling exam status:', err);
      alert(err.response?.data?.error || 'Failed to toggle exam status');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h2 className="text-2xl font-bold text-gray-900">Manage Exams</h2>
              <p className="text-gray-600">View, edit, and manage student assignments</p>
            </div>
            <Link to="/teacher/create-exam">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Exam
              </Button>
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Exams List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-lg text-gray-600">Loading exams...</div>
            </div>
          ) : exams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No exams yet</h3>
                <p className="mt-2 text-gray-500">Get started by creating your first exam</p>
                <Link to="/teacher/create-exam">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Exam
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {exams.map((exam, index) => (
                <Card key={exam._id || exam.id || index}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {exam.title}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${exam.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {exam.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {exam.description && (
                          <p className="text-sm text-gray-600 mb-3">{exam.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {exam.questionsCount || exam.questions?.length || 0} questions
                          </span>
                          <span>{exam.duration} minutes</span>
                          <span>{exam.totalMarks} marks</span>
                          <span>Pass: {exam.passingMarks}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Link to={`/teacher/exams/${exam._id || exam.id}/coding-submissions`}>
                          <Button variant="outline" size="sm" title="Coding Submissions">
                            <Code2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExam(exam)}
                          title="Assign Students"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(exam._id || exam.id!)}
                          disabled={toggling === (exam._id || exam.id)}
                          title={exam.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {exam.isActive ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                        <Link to={`/teacher/edit-exam/${exam._id || exam.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Edit Exam"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(exam._id || exam.id!)}
                          disabled={deleting === (exam._id || exam.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deleting === (exam._id || exam.id) ? (
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

      {/* Assign Students Modal */}
      {selectedExam && (
        <AssignStudentsModal
          exam={selectedExam}
          onClose={() => setSelectedExam(null)}
          onSuccess={() => {
            fetchExams();
            setSelectedExam(null);
          }}
        />
      )}
    </div>
  );
};

export default ManageExams;
