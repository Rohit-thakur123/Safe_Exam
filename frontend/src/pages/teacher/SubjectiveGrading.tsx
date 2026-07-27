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

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [marksState, setMarksState] = useState<Record<string, number>>({});
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
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
    } catch { setExamTitle('Exam'); }
  };

  const loadAnswers = async (id: string) => {
    try {
      setLoading(true);
      const data = await subjectiveGradingAPI.getExamAnswers(id);
      setAnswers(data);
      const initialMarks: Record<string, number> = {};
      const initialFeedback: Record<string, string> = {};
      data.forEach((a: SubjectiveAnswer) => {
        initialMarks[a._id] = a.marksAwarded || 0;
        initialFeedback[a._id] = a.feedback || '';
      });
      setMarksState(initialMarks);
      setFeedbackState(initialFeedback);
      if (data.length > 0) {
        const first = typeof data[0].student === 'object' ? data[0].student._id : data[0].student;
        setSelectedStudentId(first);
      }
    } catch {
      setToast({ id: Date.now().toString(), type: 'error', message: 'Failed to load student submissions' });
    } finally { setLoading(false); }
  };

  const groupedStudents = React.useMemo(() => {
    const map = new Map<string, GroupedStudentAnswers>();
    answers.forEach(a => {
      const sObj = typeof a.student === 'object' ? a.student : { _id: a.student, name: 'Unknown Student', email: '' };
      const sId = sObj._id;
      if (!map.has(sId)) {
        map.set(sId, { studentId: sId, studentName: sObj.name || 'Unknown Student', studentEmail: sObj.email || '', answers: [] });
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
      setAnswers(prev => prev.map(a => a._id === answerId ? { ...a, marksAwarded: marks, feedback, status: 'evaluated' } : a));
      setToast({
        id: Date.now().toString(), type: 'success',
        message: res.allEvaluated ? 'All responses graded for this candidate!' : 'Grade saved successfully!',
      });
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', message: err?.response?.data?.error || 'Failed to save evaluation' });
    } finally { setSavingId(null); }
  };

  const toggleRefView = (answerId: string) => setShowRef(prev => ({ ...prev, [answerId]: !prev[answerId] }));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading student submissions for grading...</p>
      </div>
    );
  }

  const totalSubmitted = answers.length;
  const totalEvaluated = answers.filter(a => a.status === 'evaluated').length;
  const allDone = totalEvaluated === totalSubmitted && totalSubmitted > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <TeacherNavbar />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main style={{ maxWidth: 1152, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link
              to={`/teacher/exams/${examId}/results`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '0.5rem', textDecoration: 'none' }}
            >
              <ArrowLeft size={13} /> Back to Exam Results
            </Link>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={20} style={{ color: 'var(--accent-purple)' }} />
              Manual Evaluation — {examTitle}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Grade open-ended descriptive responses and provide feedback to candidates.
            </p>
          </div>

          <div className="card-surface" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.5rem 1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Grading Progress:</span>
            <span className={`badge ${allDone ? 'badge-emerald' : 'badge-amber'}`}>
              {totalEvaluated} / {totalSubmitted} Graded
            </span>
          </div>
        </div>

        {groupedStudents.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px dashed var(--border)',
            borderRadius: '1rem', padding: '3rem', textAlign: 'center',
          }}>
            <BookOpen size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 4 }}>No Subjective Submissions Found</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Either no student has completed this exam yet, or this exam has no subjective questions.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem' }}>
            {/* Left Sidebar */}
            <div>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem', padding: '0 4px' }}>
                Candidates
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {groupedStudents.map(sg => {
                  const isSelected = sg.studentId === selectedStudentId;
                  const evCount = sg.answers.filter(a => a.status === 'evaluated').length;
                  const isDone = evCount === sg.answers.length;
                  return (
                    <button
                      key={sg.studentId}
                      onClick={() => setSelectedStudentId(sg.studentId)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '0.875rem',
                        borderRadius: '0.75rem',
                        border: `1px solid ${isSelected ? 'var(--accent-purple)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--accent-purple)' : 'var(--bg-card)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sg.studentName}
                        </p>
                        {isDone
                          ? <CheckCircle2 size={13} style={{ color: isSelected ? '#fff' : 'var(--accent-emerald)', flexShrink: 0 }} />
                          : <Clock size={13} style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--accent-amber)', flexShrink: 0 }} />
                        }
                      </div>
                      <p style={{ fontSize: '0.6875rem', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', margin: '2px 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sg.studentEmail}
                      </p>
                      <span style={{
                        display: 'inline-block', fontSize: '0.625rem', fontWeight: 700,
                        padding: '2px 8px', borderRadius: '9999px',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                      }}>
                        {evCount}/{sg.answers.length} Graded
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {currentStudentGroup && (
                <>
                  {/* Student header */}
                  <div className="card-surface" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>{currentStudentGroup.studentName}</h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{currentStudentGroup.studentEmail}</p>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {currentStudentGroup.answers.length} Response(s)
                    </span>
                  </div>

                  {/* Answer cards */}
                  {currentStudentGroup.answers.map((ans, idx) => {
                    const qObj = typeof ans.question === 'object' ? (ans.question as SubjectiveQuestion) : null;
                    const qTitle = qObj?.title || `Question ${idx + 1}`;
                    const qDesc = qObj?.description || '';
                    const maxMarks = qObj?.maxMarks || 10;
                    const isEvaluated = ans.status === 'evaluated';
                    const answerId = ans._id;

                    return (
                      <div key={answerId} className="card-surface" style={{ padding: '1.5rem' }}>
                        {/* Question header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-purple)', background: 'color-mix(in srgb, var(--accent-purple) 12%, transparent)', padding: '2px 8px', borderRadius: 6 }}>
                                Q{idx + 1}
                              </span>
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Max: {maxMarks} marks</span>
                              {isEvaluated && (
                                <span className="badge badge-emerald">Graded ({ans.marksAwarded}/{maxMarks})</span>
                              )}
                            </div>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>{qTitle}</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'pre-wrap' }}>{qDesc}</p>
                          </div>

                          {(qObj?.referenceAnswer || qObj?.rubric) && (
                            <button
                              type="button"
                              onClick={() => toggleRefView(answerId)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-purple)',
                                background: 'color-mix(in srgb, var(--accent-purple) 10%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--accent-purple) 20%, transparent)',
                                padding: '0.375rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                                whiteSpace: 'nowrap', flexShrink: 0,
                              }}
                            >
                              {showRef[answerId] ? <EyeOff size={12} /> : <Eye size={12} />}
                              {showRef[answerId] ? 'Hide Key' : 'Show Key'}
                            </button>
                          )}
                        </div>

                        {/* Reference answer */}
                        {showRef[answerId] && (
                          <div style={{ background: 'color-mix(in srgb, var(--accent-purple) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-purple) 15%, transparent)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
                            {qObj?.referenceAnswer && (
                              <div style={{ marginBottom: qObj?.rubric ? '0.75rem' : 0 }}>
                                <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Model Answer</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                  {qObj.referenceAnswer}
                                </p>
                              </div>
                            )}
                            {qObj?.rubric && (
                              <div>
                                <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Grading Rubric</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{qObj.rubric}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Candidate response */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Candidate's Response</label>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Word Count: {ans.wordCount || 0}</span>
                          </div>
                          <div style={{ padding: '1rem', borderRadius: '0.625rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1.7, whiteSpace: 'pre-wrap', minHeight: 80 }}>
                            {ans.answer || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No response submitted</span>}
                          </div>
                        </div>

                        {/* Grading controls */}
                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
                          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Evaluation & Feedback</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                            <div>
                              <label className="label-theme">Marks Awarded (Max {maxMarks})</label>
                              <input
                                type="number" min={0} max={maxMarks} step={0.5}
                                value={marksState[answerId] ?? 0}
                                onChange={e => setMarksState(prev => ({ ...prev, [answerId]: Number(e.target.value) }))}
                                className="input-theme"
                                style={{ fontSize: '0.875rem', fontWeight: 700 }}
                              />
                            </div>
                            <div>
                              <label className="label-theme">Feedback (Visible to Candidate)</label>
                              <input
                                type="text"
                                placeholder="e.g. Good explanation, needs more examples."
                                value={feedbackState[answerId] ?? ''}
                                onChange={e => setFeedbackState(prev => ({ ...prev, [answerId]: e.target.value }))}
                                className="input-theme"
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                            <Button
                              size="sm"
                              disabled={savingId === answerId}
                              onClick={() => handleEvaluate(ans)}
                            >
                              <Save size={13} />
                              {savingId === answerId ? 'Saving...' : isEvaluated ? 'Update Grade' : 'Save Grade'}
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