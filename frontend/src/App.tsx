import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
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

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: 'teacher' | 'student' }> = ({ 
  children, 
  role 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }
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
  if (role && user.role !== role && !(role === 'teacher' && user.role === 'admin')) {
    return <Navigate to={user.role === 'teacher' || user.role === 'admin' ? '/teacher' : '/student'} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            
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
            <Route 
              path="/teacher/debug" 
              element={
                <ProtectedRoute role="teacher">
                  <DebugPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/teacher/coding-questions" element={<ProtectedRoute role="teacher"><CodingQuestions /></ProtectedRoute>} />
            <Route path="/teacher/coding-questions/create" element={<ProtectedRoute role="teacher"><CreateCodingQuestion /></ProtectedRoute>} />
            <Route path="/teacher/coding-questions/edit/:questionId" element={<ProtectedRoute role="teacher"><CreateCodingQuestion /></ProtectedRoute>} />
            <Route path="/teacher/coding-questions/:questionId" element={<ProtectedRoute role="teacher"><CodingQuestionDetails /></ProtectedRoute>} />
            <Route path="/teacher/exams/:examId/coding-submissions" element={<ProtectedRoute role="teacher"><CodingSubmissions /></ProtectedRoute>} />
            
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
            <Route
              path="/exam/launch"
              element={<ExamLaunch />}
            />
            {/* Handle query parameter format: /exam/start?examId=xxx&token=xxx */}
            <Route 
              path="/exam/start" 
              element={<ExamStart />} 
            />
            {/* Handle path parameter format: /exam/:token */}
            <Route 
              path="/exam/:token" 
              element={<ExamStart />} 
            />
            {/* Handle path parameter format: /exam-verify/:examId/:studentId/:token */}
            <Route 
              path="/exam-verify/:examId/:studentId/:token" 
              element={<ExamVerification />} 
            />            
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
