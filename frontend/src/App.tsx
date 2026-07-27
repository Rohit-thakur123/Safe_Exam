import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing/Landing';
import TeacherDashboard from './pages/teacher/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import CreateQuestion from './pages/teacher/CreateQuestion';
import CreateExam from './pages/teacher/CreateExam';
import ManageQuestions from './pages/teacher/ManageQuestions';
import ManageExams from './pages/teacher/ManageExams';
import ManageMCQ from './pages/teacher/ManageMCQ';
import DebugPage from './pages/teacher/DebugPage';
import TakeExam from './pages/student/TakeExam';
import Result from './pages/student/Result';
import ExamVerification from './pages/student/ExamVerification';
import ExamStart from './pages/student/ExamStart';
import ExamLaunch from './pages/student/ExamLaunch';
import CodingQuestions from './pages/teacher/CodingQuestions';
import CreateCodingQuestion from './pages/teacher/CreateCodingQuestion';
import CodingQuestionDetails from './pages/teacher/CodingQuestionDetails';
import CodingSubmissions from './pages/teacher/CodingSubmissions';
import CodingQuestionPreview from './pages/teacher/CodingQuestionPreview';
import ExamResults from './pages/teacher/ExamResults';
import SubjectiveQuestions from './pages/teacher/SubjectiveQuestions';
import CreateSubjectiveQuestion from './pages/teacher/CreateSubjectiveQuestion';
import SubjectiveGrading from './pages/teacher/SubjectiveGrading';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: 'teacher' | 'student' }> = ({
  children,
  role
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-5"
        style={{ background: 'var(--bg-primary)' }}
      >
        {/* Brand mark */}
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))',
            boxShadow: '0 0 40px color-mix(in srgb, var(--accent-purple) 35%, transparent)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        {/* Spinner */}
        <div className="relative h-8 w-8">
          <div
            className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `color-mix(in srgb, var(--accent-purple) 20%, transparent)`, borderTopColor: 'var(--accent-purple)' }}
          />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Authenticating…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{
          redirectTo: window.location.pathname
        }}
        replace
      />
    );
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
    <Router>
      <AuthProvider>

        <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Landing />} />

            {/* Teacher Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/create-question"
              element={
                <ProtectedRoute role="teacher">
                  <CreateQuestion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/create-exam"
              element={
                <ProtectedRoute role="teacher">
                  <CreateExam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/edit-exam/:examId"
              element={
                <ProtectedRoute role="teacher">
                  <CreateExam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/questions"
              element={
                <ProtectedRoute role="teacher">
                  <ManageQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/mcq"
              element={
                <ProtectedRoute role="teacher">
                  <ManageMCQ />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/exams"
              element={
                <ProtectedRoute role="teacher">
                  <ManageExams />
                </ProtectedRoute>
              }
            />

            {/* Debug route: only available in development, never in production */}
            {import.meta.env.DEV && (
              <Route
                path="/teacher/debug"
                element={
                  <ProtectedRoute role="teacher">
                    <DebugPage />
                  </ProtectedRoute>
                }
              />
            )}

            <Route path="/teacher/coding-questions" element={<ProtectedRoute role="teacher"><CodingQuestions /></ProtectedRoute>} />
            <Route path="/teacher/coding-questions/create" element={<ProtectedRoute role="teacher"><CreateCodingQuestion /></ProtectedRoute>} />
            <Route path="/teacher/coding-questions/edit/:questionId" element={<ProtectedRoute role="teacher"><CreateCodingQuestion /></ProtectedRoute>} />
            <Route path="/teacher/coding-questions/:questionId/testcases" element={<ProtectedRoute role="teacher"><CodingQuestionDetails /></ProtectedRoute>} />
            <Route path="/teacher/coding-questions/:questionId/preview" element={<ProtectedRoute role="teacher"><CodingQuestionPreview /></ProtectedRoute>} />
            <Route path="/teacher/coding-questions/:questionId" element={<ProtectedRoute role="teacher"><CodingQuestionDetails /></ProtectedRoute>} />
            <Route path="/teacher/exams/:examId/results" element={<ProtectedRoute role="teacher"><ExamResults /></ProtectedRoute>} />
            <Route path="/teacher/exams/:examId/coding-submissions" element={<ProtectedRoute role="teacher"><CodingSubmissions /></ProtectedRoute>} />
            <Route path="/teacher/subjective-questions" element={<ProtectedRoute role="teacher"><SubjectiveQuestions /></ProtectedRoute>} />
            <Route path="/teacher/subjective-questions/create" element={<ProtectedRoute role="teacher"><CreateSubjectiveQuestion /></ProtectedRoute>} />
            <Route path="/teacher/subjective-questions/edit/:questionId" element={<ProtectedRoute role="teacher"><CreateSubjectiveQuestion /></ProtectedRoute>} />
            <Route path="/teacher/exams/:examId/grade-subjective" element={<ProtectedRoute role="teacher"><SubjectiveGrading /></ProtectedRoute>} />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exam/:examId"
              element={
                <ProtectedRoute role="student">
                  <TakeExam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/result/:attemptId"
              element={
                <ProtectedRoute role="student">
                  <Result />
                </ProtectedRoute>
              }
            />

            {/* Public Exam Verification Routes (no auth required) */}
            <Route path="/exam/launch" element={<ExamLaunch />} />
            {/* Handle query parameter format: /exam/start?examId=xxx&token=xxx */}
            <Route path="/exam/start" element={<ExamStart />} />
            {/* Handle path parameter format: /exam/:token */}
            <Route path="/exam/:token" element={<ExamStart />} />
            {/* Handle path parameter format: /exam-verify/:examId/:studentId/:token */}
            <Route path="/exam-verify/:examId/:studentId/:token" element={<ExamVerification />} />
          </Routes>
        </div>
      </AuthProvider >
    </Router>
    </ThemeProvider>

  );
}

export default App;
