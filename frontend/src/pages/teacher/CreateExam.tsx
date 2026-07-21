import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TeacherNavbar } from '../../components/TeacherNavbar';
import { Button } from '../../components/ui/Button';
import { codingQuestionAPI, questionAPI, subjectiveQuestionAPI, examAPI } from '../../services/api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { CodingQuestion, Question, SubjectiveQuestion } from '../../types';
import Toast from '../../components/ui/Toast';
import type { ToastMessage } from '../../components/ui/Toast';

const CreateExam: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const isEditMode = Boolean(examId);

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [availableCodingQuestions, setAvailableCodingQuestions] = useState<CodingQuestion[]>([]);
  const [availableSubjectiveQuestions, setAvailableSubjectiveQuestions] = useState<SubjectiveQuestion[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Array<{ id: string; name: string; email: string }>>([]);

  // Form State
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedCodingQuestions, setSelectedCodingQuestions] = useState<string[]>([]);
  const [selectedSubjectiveQuestions, setSelectedSubjectiveQuestions] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(60);
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [passingMarks, setPassingMarks] = useState<number>(40);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [allowLateEntry, setAllowLateEntry] = useState(false);
  const [lateEntryWindowMinutes, setLateEntryWindowMinutes] = useState(15);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [resultPublishDate, setResultPublishDate] = useState('');
  const [resultPublishTime, setResultPublishTime] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  useEffect(() => {
    fetchQuestions();
    fetchCodingQuestions();
    fetchSubjectiveQuestions();
    fetchStudents();
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
      console.error('Failed to fetch questions');
    }
  };

  const fetchCodingQuestions = async () => {
    try {
      const result = await codingQuestionAPI.getAll({
        limit: 50
      });
      setAvailableCodingQuestions(result.questions);
    } catch {
      console.error('Failed to fetch coding questions');
    }
  };

  const fetchSubjectiveQuestions = async () => {
    try {
      const result = await subjectiveQuestionAPI.getAll({ limit: 100 });
      setAvailableSubjectiveQuestions(result.questions);
    } catch {
      console.error('Failed to fetch subjective questions');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await examAPI.getStudents();
      setAvailableStudents(response.students || []);
    } catch {
      console.error('Failed to fetch students');
    }
  };

  const fetchExam = async (id: string) => {
    try {
      setIsLoading(true);
      const exam = await examAPI.getById(id);
      setTitle(exam.title || '');
      setDescription(exam.description || '');
      setSelectedQuestions(
        ((exam.questions || []) as unknown as Array<Question & { type?: string }>)
          .filter(question => question.type !== 'coding' && question.type !== 'descriptive')
          .map(question => question._id || question.id || String(question))
      );
      setSelectedCodingQuestions(
        ((exam.codingQuestions || []) as CodingQuestion[])
          .map(question => question._id || question.id || String(question))
      );
      setSelectedSubjectiveQuestions(
        ((exam.descriptiveQuestions || []) as SubjectiveQuestion[])
          .map(question => question._id || question.id || String(question))
      );
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
      setTimezone(exam.timezone || 'Asia/Kolkata');
      setAllowLateEntry(Boolean(exam.allowLateEntry));
      setLateEntryWindowMinutes(exam.lateEntryWindowMinutes || 15);
      setAutoSubmit(exam.autoSubmit !== false);
      setResultPublishDate(formatDateInput(exam.resultPublishDate));
      setResultPublishTime(exam.resultPublishTime || '');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: message || 'Failed to load exam details'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestions(prev => prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]);
  };

  const toggleCodingSelection = (id: string) => {
    setSelectedCodingQuestions(prev => prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]);
  };

  const toggleSubjectiveSelection = (id: string) => {
    setSelectedSubjectiveQuestions(prev => prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]);
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("🔥 handleSubmit START");
    e.preventDefault();
    console.log({
      title,
      selectedQuestions,
      selectedCodingQuestions,
      selectedSubjectiveQuestions,
      selectedStudents,
    });
    if (!title.trim()) {
      setToast({ id: Date.now().toString(), type: 'warning', message: 'Exam title is required' });
      setActiveStep(1);
      return;
    }
    if (selectedQuestions.length === 0 && selectedCodingQuestions.length === 0 && selectedSubjectiveQuestions.length === 0) {
      setToast({ id: Date.now().toString(), type: 'warning', message: 'Please select at least one question, coding challenge, or subjective question' });
      setActiveStep(2);
      return;
    }
    if (Number(passingMarks) > Number(totalMarks)) {
      setToast({ id: Date.now().toString(), type: 'warning', message: 'Passing marks cannot exceed total marks' });
      setActiveStep(1);
      return;
    }

    setIsLoading(true);
    try {
      const examData = {
        title: title.trim(),
        description: description.trim() || undefined,
        questions: selectedQuestions,
        codingQuestions: selectedCodingQuestions,
        descriptiveQuestions: selectedSubjectiveQuestions,
        duration,
        totalMarks,
        passingMarks,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        timezone,
        allowLateEntry,
        lateEntryWindowMinutes,
        autoSubmit,
        resultPublishDate: resultPublishDate || undefined,
        resultPublishTime: resultPublishTime || undefined,
        assignedStudents: selectedStudents.length > 0 ? selectedStudents : undefined,
        sendEmailNotification: selectedStudents.length > 0 ? sendEmailNotification : false,
      };

      if (isEditMode && examId) {
        await examAPI.update(examId, examData);
        setToast({ id: Date.now().toString(), type: 'success', message: 'Assessment updated successfully!' });
      } else {
        console.log("🔥 About to call examAPI.create");
        await examAPI.create(examData);
        console.log("🔥 examAPI.create SUCCESS");
        setToast({ id: Date.now().toString(), type: 'success', message: 'Assessment created successfully!' });
      }

      setTimeout(() => navigate('/teacher/exams'), 1200);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToast({ id: Date.now().toString(), type: 'error', message: message || 'Failed to save assessment' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans">
      <TeacherNavbar />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/teacher/exams" className="inline-flex items-center text-xs font-semibold text-violet-600 hover:text-violet-800 mb-2">
              <ArrowLeft size={14} className="mr-1" /> Back to Exams
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isEditMode ? 'Edit Assessment' : 'Create New Assessment'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Configure evaluation parameters, question set, and candidate assignments</p>
          </div>
        </div>

        {/* Step Indicator Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-2 mb-8 shadow-xs flex items-center justify-between">
          {[
            { num: 1, label: '1. Basic Config & Timing' },
            { num: 2, label: '2. Select Questions & Challenges' },
            { num: 3, label: '3. Candidates & Access' }
          ].map((step) => {
            const isActive = activeStep === step.num;
            return (
              <button
                key={step.num}
                onClick={() => setActiveStep(step.num as any)}
                className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all text-center ${isActive
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {step.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Basic Config */}
          {activeStep === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Basic Assessment Parameters</h2>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full-Stack Senior Developer Assessment 2026"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter candidate instructions, rules, and background guidelines..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Duration (Minutes) *</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Marks *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalMarks}
                    onChange={e => setTotalMarks(Number(e.target.value))}
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Passing Marks *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={passingMarks}
                    onChange={e => setPassingMarks(Number(e.target.value))}
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Professional Scheduling & Timezone Configuration */}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Exam Schedule & Timezone Settings</h3>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Timezone *</label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white"
                  >
                    <option value="Asia/Kolkata">India Standard Time (IST - UTC+05:30)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                    <option value="America/New_York">Eastern Time (EST/EDT - UTC-05:00/04:00)</option>
                    <option value="America/Chicago">Central Time (CST/CDT - UTC-06:00/05:00)</option>
                    <option value="America/Los_Angeles">Pacific Time (PST/PDT - UTC-08:00/07:00)</option>
                    <option value="Europe/London">Greenwich Mean Time (GMT/BST - UTC+00:00/01:00)</option>
                    <option value="Asia/Dubai">Gulf Standard Time (GST - UTC+04:00)</option>
                    <option value="Asia/Singapore">Singapore Standard Time (SST - UTC+08:00)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Start Time (24h format)</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">End Time (24h format)</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <input
                      type="checkbox"
                      id="allowLateEntry"
                      checked={allowLateEntry}
                      onChange={e => setAllowLateEntry(e.target.checked)}
                      className="h-4 w-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                    />
                    <label htmlFor="allowLateEntry" className="text-xs font-bold text-gray-700 cursor-pointer">
                      Allow Late Entry
                    </label>
                  </div>

                  {allowLateEntry && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Late Entry Window (Minutes)</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={lateEntryWindowMinutes}
                        onChange={e => setLateEntryWindowMinutes(Number(e.target.value))}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <input
                      type="checkbox"
                      id="autoSubmit"
                      checked={autoSubmit}
                      onChange={e => setAutoSubmit(e.target.checked)}
                      className="h-4 w-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                    />
                    <label htmlFor="autoSubmit" className="text-xs font-bold text-gray-700 cursor-pointer">
                      Auto-Submit when Timer Expires
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Result Publication Release (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Publish Date</label>
                      <input
                        type="date"
                        value={resultPublishDate}
                        onChange={e => setResultPublishDate(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Publish Time</label>
                      <input
                        type="time"
                        value={resultPublishTime}
                        onChange={e => setResultPublishTime(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="button" onClick={() => setActiveStep(2)}>Next: Select Questions →</Button>
              </div>
            </div>
          )}

          {/* STEP 2: Question Selection */}
          {activeStep === 2 && (
            <div className="space-y-6">
              {/* MCQ Selection */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Select Multiple Choice Questions (MCQs)</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Selected {selectedQuestions.length} MCQ question(s)</p>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {availableQuestions.map((q) => {
                    const qId = q._id || q.id || '';
                    const isSelected = selectedQuestions.includes(qId);
                    return (
                      <div
                        key={qId}
                        onClick={() => toggleQuestionSelection(qId)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${isSelected
                          ? 'border-violet-300 bg-violet-50/70 text-violet-900 font-medium'
                          : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 text-gray-700'
                          }`}
                      >
                        <div className="pr-4">
                          <p className="font-bold text-gray-900 mb-0.5">{q.question}</p>
                          <span className="text-[11px] text-gray-500">Difficulty: {q.difficulty || 'Medium'}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-violet-600 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coding Challenges Selection */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Select Coding Challenges</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Selected {selectedCodingQuestions.length} challenge(s)</p>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {availableCodingQuestions.map((cq) => {
                    const cqId = cq._id || cq.id || '';
                    const isSelected = selectedCodingQuestions.includes(cqId);
                    return (
                      <div
                        key={cqId}
                        onClick={() => toggleCodingSelection(cqId)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${isSelected
                          ? 'border-indigo-300 bg-indigo-50/70 text-indigo-900 font-medium'
                          : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 text-gray-700'
                          }`}
                      >
                        <div className="pr-4">
                          <p className="font-bold text-gray-900 mb-0.5">{cq.title}</p>
                          <span className="text-[11px] text-gray-500 font-medium">Marks: {cq.marks || 100} · Difficulty: {cq.difficulty || 'Medium'}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-indigo-600 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subjective Questions Selection */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Select Subjective Questions</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Selected {selectedSubjectiveQuestions.length} subjective question(s)</p>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {availableSubjectiveQuestions.length === 0 ? (
                    <p className="text-xs text-gray-400 py-3 text-center">No subjective questions found in library. Create them under Subjective Questions first.</p>
                  ) : (
                    availableSubjectiveQuestions.map((sq) => {
                      const sqId = sq._id || sq.id || '';
                      const isSelected = selectedSubjectiveQuestions.includes(sqId);
                      return (
                        <div
                          key={sqId}
                          onClick={() => toggleSubjectiveSelection(sqId)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${isSelected
                            ? 'border-purple-300 bg-purple-50/70 text-purple-900 font-medium'
                            : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 text-gray-700'
                            }`}
                        >
                          <div className="pr-4">
                            <p className="font-bold text-gray-900 mb-0.5">{sq.title}</p>
                            <span className="text-[11px] text-gray-500 font-medium">Max Marks: {sq.maxMarks || 10} · Difficulty: {sq.difficulty || 'Medium'}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={18} className="text-purple-600 flex-shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveStep(1)}>← Back: Basic Config</Button>
                <Button type="button" onClick={() => setActiveStep(3)}>Next: Candidate Access →</Button>
              </div>
            </div>
          )}

          {/* STEP 3: Candidate Selection & Save */}
          {activeStep === 3 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Candidate Directory & Access Permissions</h2>

              <p className="text-xs text-gray-500">
                Select specific candidates to restrict exam eligibility, or leave unselected to allow any student with the token link to take this exam.
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableStudents.map((s) => {
                  const isSelected = selectedStudents.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleStudentSelection(s.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${isSelected
                        ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900 font-medium'
                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 text-gray-700'
                        }`}
                    >
                      <div>
                        <p className="font-bold">{s.name}</p>
                        <p className="text-[11px] text-gray-500">{s.email}</p>
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-emerald-600" />}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sendEmailNotification"
                  checked={sendEmailNotification}
                  onChange={e => setSendEmailNotification(e.target.checked)}
                  className="rounded text-violet-600 focus:ring-violet-500 h-4 w-4"
                />
                <label htmlFor="sendEmailNotification" className="text-xs font-semibold text-gray-700">
                  Send email invitations with SEB access links to selected candidates
                </label>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setActiveStep(2)}>← Back: Questions</Button>
                <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  {isLoading ? 'Saving Assessment...' : isEditMode ? 'Update Assessment' : 'Save & Publish Assessment'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default CreateExam;
