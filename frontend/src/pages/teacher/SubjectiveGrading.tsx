import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { Button } from '../../components/ui/Button';
import { subjectiveGradingAPI, examAPI } from '../../services/api';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Eye, EyeOff, Save } from 'lucide-react';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';
import type { SubjectiveAnswer, SubjectiveQuestion } from '../../types';

interface GroupedStudentAnswers {
  studentId: string;
  studentName: string;
  studentEmail: string;
  answers: SubjectiveAnswer[];
}

const SubjectiveGrading: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();

  const [examTitle, setExamTitle] = useState('');
  const [answers, setAnswers] = useState<SubjectiveAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Active student tab
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Form states per answerId
  const [marksState, setMarksState] = useState<Record<string, number>>({});
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Toggle reference answer view per answerId
  const [showRef, setShowRef] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (examId) {
      loadExamDetails(examId);
      loadAnswers(examId);
    }
  }, [examId]);

  const loadExamDetails = async (id: string) => {
    try {
      const exam = await examAPI.getById(id);
      setExamTitle(exam.title);
    } catch {
      setExamTitle('Exam');
    }
  };

  const loadAnswers = async (id: string) => {
    try {
      setLoading(true);
      const data = await subjectiveGradingAPI.getExamAnswers(id);
      setAnswers(data);

      // Initialize form states
      const initialMarks: Record<string, number> = {};
      const initialFeedback: Record<string, string> = {};
      data.forEach(a => {
        initialMarks[a._id] = a.marksAwarded || 0;
        initialFeedback[a._id] = a.feedback || '';
      });
      setMarksState(initialMarks);
      setFeedbackState(initialFeedback);

      // Select first student by default
      if (data.length > 0) {
        const firstStudent = typeof data[0].student === 'object' ? data[0].student._id : data[0].student;
        setSelectedStudentId(firstStudent);
      }
    } catch {
      setToast({ id: Date.now().toString(), type: 'error', message: 'Failed to load student submissions' });
    } finally {
      setLoading(false);
    }
  };

  // Group answers by student
  const groupedStudents = React.useMemo(() => {
    const map = new Map<string, GroupedStudentAnswers>();

    answers.forEach(a => {
      const sObj = typeof a.student === 'object' ? a.student : { _id: a.student, name: 'Unknown Student', email: '' };
      const sId = sObj._id;

      if (!map.has(sId)) {
        map.set(sId, {
          studentId: sId,
          studentName: sObj.name || 'Unknown Student',
          studentEmail: sObj.email || '',
          answers: [],
        });
      }
      map.get(sId)!.answers.push(a);
    });

    return Array.from(map.values());
  }, [answers]);

  const currentStudentGroup = groupedStudents.find(g => g.studentId === selectedStudentId);

  const handleEvaluate = async (answer: SubjectiveAnswer) => {
    const answerId = answer._id;
    const marks = marksState[answerId];
    const feedback = feedbackState[answerId] || '';
    const qObj = typeof answer.question === 'object' ? (answer.question as SubjectiveQuestion) : null;
    const maxMarks = qObj?.maxMarks || 10;

    if (marks === undefined || marks < 0 || marks > maxMarks) {
      setToast({ id: Date.now().toString(), type: 'error', message: `Marks must be between 0 and ${maxMarks}` });
      return;
    }

    try {
      setSavingId(answerId);
      const res = await subjectiveGradingAPI.evaluateAnswer(answerId, marks, feedback);

      // Update local state
      setAnswers(prev =>
        prev.map(a =>
          a._id === answerId
            ? { ...a, marksAwarded: marks, feedback, status: 'evaluated' }
            : a
        )
      );

      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: res.allEvaluated
          ? 'Answer graded! All subjective questions for this candidate are now complete.'
          : 'Grade saved successfully!',
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to save evaluation';
      setToast({ id: Date.now().toString(), type: 'error', message: msg });
    } finally {
      setSavingId(null);
    }
  };

  const toggleRefView = (answerId: string) => {
    setShowRef(prev => ({ ...prev, [answerId]: !prev[answerId] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading student submissions for grading...</p>
      </div>
    );
  }

  const totalSubmitted = answers.length;
  const totalEvaluated = answers.filter(a => a.status === 'evaluated').length;

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans">
      <TeacherNavbar />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/teacher/results" className="inline-flex items-center text-xs font-semibold text-violet-600 hover:text-violet-800 mb-2">
              <ArrowLeft size={14} className="mr-1" /> Back to Exam Results
            </Link>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen size={20} className="text-violet-600" />
              Manual Evaluation — {examTitle}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Grade open-ended descriptive responses and provide feedback to candidates.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-xs">
            <span className="text-xs font-semibold text-gray-500">Grading Progress:</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              totalEvaluated === totalSubmitted && totalSubmitted > 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {totalEvaluated} / {totalSubmitted} Graded
            </span>
          </div>
        </div>

        {groupedStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-bold mb-1">No Subjective Submissions Found</p>
            <p className="text-sm text-gray-400">Either no student has completed this exam yet, or this exam has no subjective questions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Left Sidebar — Candidate List */}
            <div className="md:col-span-1 space-y-2">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1 mb-2">Candidates</h2>
              {groupedStudents.map(studentGroup => {
                const isSelected = studentGroup.studentId === selectedStudentId;
                const studentEvaluatedCount = studentGroup.answers.filter(a => a.status === 'evaluated').length;
                const isFullyEvaluated = studentEvaluatedCount === studentGroup.answers.length;

                return (
                  <button
                    key={studentGroup.studentId}
                    onClick={() => setSelectedStudentId(studentGroup.studentId)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-100 hover:border-violet-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {studentGroup.studentName}
                      </p>
                      {isFullyEvaluated ? (
                        <CheckCircle2 size={14} className={isSelected ? 'text-white' : 'text-emerald-500'} />
                      ) : (
                        <Clock size={14} className={isSelected ? 'text-violet-200' : 'text-amber-500'} />
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-violet-100' : 'text-gray-400'}`}>
                      {studentGroup.studentEmail}
                    </p>
                    <span className={`inline-block text-[10px] font-semibold mt-2 px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-violet-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {studentEvaluatedCount}/{studentGroup.answers.length} Graded
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Main Panel — Grading Area for Selected Candidate */}
            <div className="md:col-span-3 space-y-6">
              {currentStudentGroup && (
                <>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-xs">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">{currentStudentGroup.studentName}</h2>
                      <p className="text-xs text-gray-500">{currentStudentGroup.studentEmail}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-400">
                      {currentStudentGroup.answers.length} Subjective Response(s)
                    </span>
                  </div>

                  {currentStudentGroup.answers.map((ans, idx) => {
                    const qObj = typeof ans.question === 'object' ? (ans.question as SubjectiveQuestion) : null;
                    const qTitle = qObj?.title || `Question ${idx + 1}`;
                    const qDesc = qObj?.description || '';
                    const maxMarks = qObj?.maxMarks || 10;
                    const isEvaluated = ans.status === 'evaluated';
                    const answerId = ans._id;

                    return (
                      <div key={answerId} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
                        {/* Question Header */}
                        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                                Q{idx + 1}
                              </span>
                              <span className="text-xs text-gray-400">Max Marks: {maxMarks}</span>
                              {isEvaluated && (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  Graded ({ans.marksAwarded}/{maxMarks})
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-gray-900">{qTitle}</h3>
                            <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{qDesc}</p>
                          </div>

                          {/* Reference Answer toggle */}
                          {(qObj?.referenceAnswer || qObj?.rubric) && (
                            <button
                              type="button"
                              onClick={() => toggleRefView(answerId)}
                              className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-semibold bg-violet-50 px-2.5 py-1 rounded-lg transition"
                            >
                              {showRef[answerId] ? <EyeOff size={13} /> : <Eye size={13} />}
                              {showRef[answerId] ? 'Hide Answer Key' : 'Show Answer Key'}
                            </button>
                          )}
                        </div>

                        {/* Collapsible Answer Key / Rubric */}
                        {showRef[answerId] && (
                          <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4 space-y-3">
                            {qObj?.referenceAnswer && (
                              <div>
                                <p className="text-[11px] font-bold text-violet-800 uppercase tracking-wide">Model / Reference Answer</p>
                                <p className="text-xs text-violet-950 mt-1 whitespace-pre-wrap bg-white p-3 rounded-lg border border-violet-100">
                                  {qObj.referenceAnswer}
                                </p>
                              </div>
                            )}
                            {qObj?.rubric && (
                              <div>
                                <p className="text-[11px] font-bold text-violet-800 uppercase tracking-wide">Grading Rubric</p>
                                <p className="text-xs text-violet-900 mt-1 whitespace-pre-wrap">
                                  {qObj.rubric}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Candidate Submission Box */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-gray-700">Candidate's Response</label>
                            <span className="text-[11px] text-gray-400">
                              Word Count: {ans.wordCount || 0}
                            </span>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-mono leading-relaxed whitespace-pre-wrap min-h-24">
                            {ans.answer ? ans.answer : <span className="text-gray-400 italic">No response submitted</span>}
                          </div>
                        </div>

                        {/* Grading Controls */}
                        <div className="bg-gray-50/60 rounded-xl border border-gray-100 p-4 space-y-3">
                          <h4 className="text-xs font-bold text-gray-700">Evaluation & Feedback</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Marks Awarded (Max {maxMarks}) *
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={maxMarks}
                                step={0.5}
                                value={marksState[answerId] ?? 0}
                                onChange={e => setMarksState(prev => ({ ...prev, [answerId]: Number(e.target.value) }))}
                                className="w-full px-3 py-2 text-xs font-bold border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Feedback / Comments (Visible to Candidate)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Excellent explanation of OOP principles; good use of examples."
                                value={feedbackState[answerId] ?? ''}
                                onChange={e => setFeedbackState(prev => ({ ...prev, [answerId]: e.target.value }))}
                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <Button
                              size="sm"
                              disabled={savingId === answerId}
                              onClick={() => handleEvaluate(ans)}
                              className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-700"
                            >
                              <Save size={13} />
                              {savingId === answerId ? 'Saving Grade...' : isEvaluated ? 'Update Grade' : 'Save Grade'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SubjectiveGrading;
