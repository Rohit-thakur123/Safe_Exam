# 🔐 SEB (Safe Exam Browser) Integration Guide
## For Primary & Secondary Frontend Teams

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Flow](#architecture-flow)
3. [Token Types & Security](#token-types--security)
4. [Primary Frontend Requirements](#primary-frontend-requirements)
5. [Secondary (SEB) Frontend Requirements](#secondary-seb-frontend-requirements)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Implementation Steps](#implementation-steps)
8. [Error Handling](#error-handling)
9. [Testing Checklist](#testing-checklist)

---

## 🎯 System Overview

### Current Situation
- Single frontend handles all exam workflows
- No secure browser enforcement
- Students can access exams from any browser

### New Architecture
- **Primary Frontend**: Main application for browsing, authentication, and verification
- **Secondary (SEB) Frontend**: Secure exam-taking interface that runs ONLY inside Safe Exam Browser
- **Unique Links**: Each student receives a personalized, time-limited exam link via email

### Key Benefits
- ✅ Enhanced security through browser lockdown
- ✅ Prevents cheating via tab switching, screenshots, etc.
- ✅ Unique student links for better tracking
- ✅ Separation of concerns (browsing vs. exam-taking)

---

## 🏗️ Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Student receives email with unique exam link            │
│ Link: https://app.yourexam.com/exam/start?examId=XXX&token=YYY │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Student clicks link → Opens Primary Frontend            │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Primary Frontend parses examId & token from URL         │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Frontend calls: POST /api/seb/verify-exam-link          │
│ Body: { examId, studentId, token }                              │
│                                                                  │
│ Backend Response:                                                │
│ - ✅ SUCCESS: Exam is valid, student can attempt                │
│ - ❌ ERROR: Various reasons (expired, already taken, etc.)      │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: If valid, show "Download SEB Config" button             │
│                                                                  │
│ Frontend triggers download via API Server call (EXTERNAL)       │
│ API Server URL: https://api-server.com/api/seb/generate-config │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Student downloads .seb file                             │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Student double-clicks .seb file                         │
│ → Safe Exam Browser launches with lockdown settings             │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: SEB navigates to Secondary Frontend                     │
│ URL: https://seb.yourexam.com/exam/{examId}/{sebToken}         │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: Secondary Frontend validates sebToken                   │
│ Then loads exam via: POST /api/exam-attempts/start              │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 10: Student takes exam in secure environment               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Token Types & Security

### 1️⃣ **Exam Access Token** (Email Token)
- **Purpose**: Initial verification of exam eligibility
- **Generated**: By backend when teacher assigns exam to students
- **Sent via**: Email
- **Lifetime**: Exam duration + 24 hours buffer
- **Contains**: 
  ```javascript
  {
    type: 'exam-access',
    examId: '507f1f77bcf86cd799439011',
    studentId: '507f1f77bcf86cd799439012',
    purpose: 'exam-verification'
  }
  ```
- **Used in**: Primary frontend verification step

### 2️⃣ **SEB Session Token** (Short-lived)
- **Purpose**: Secure exam attempt inside SEB browser
- **Generated**: By backend after successful verification
- **Lifetime**: Exam duration + 30 minutes grace period
- **Contains**:
  ```javascript
  {
    type: 'seb-session',
    examId: '507f1f77bcf86cd799439011',
    studentId: '507f1f77bcf86cd799439012',
    purpose: 'seb-exam-attempt'
  }
  ```
- **Used in**: Secondary (SEB) frontend URL and API calls

---

## 💻 Primary Frontend Requirements

### 📁 New Route to Create

**Route**: `/exam/start`

**Query Parameters**:
- `examId`: MongoDB ObjectId of the exam
- `token`: Exam access token from email

### 🎨 UI Components Needed

#### 1. **Exam Verification Page** (`/exam/start`)

**Functionality**:
```javascript
// When page loads:
1. Parse examId and token from URL query params
2. Get studentId from current user context (logged in user)
3. Call verification API
4. Show loading state during verification
5. Display result based on API response
```

**States to Handle**:

##### ✅ Success State
```javascript
// When API returns success: true
Display:
- ✅ Exam title and details
- ✅ Duration, marks, schedule info
- ✅ "Download SEB Configuration" button
- ℹ️ Instructions on how to use SEB

Button Action:
- Calls external API server to download .seb file
```

##### ❌ Error States

| Error Code | Display Message | UI Action |
|------------|----------------|-----------|
| `TOKEN_INVALID` | "Your exam link is invalid or expired" | Show "Request New Link" button |
| `TOKEN_MISMATCH` | "This link is not for your account" | Show logout option |
| `EXAM_NOT_FOUND` | "Exam not found" | Show back to dashboard |
| `EXAM_INACTIVE` | "This exam is not active" | Show exam details (read-only) |
| `EXAM_NOT_STARTED` | "Exam hasn't started yet" | Show countdown timer |
| `EXAM_ENDED` | "This exam has ended" | Show end date |
| `ACTIVE_ATTEMPT_EXISTS` | "You have an active attempt" | Show "Resume Exam" button |
| `RETAKE_NOT_ALLOWED` | "You've already taken this exam" | Show previous score |
| `NOT_ASSIGNED` | "You're not assigned to this exam" | Show contact instructor |

### 📝 Code Example for Primary Frontend

```javascript
// ExamStartPage.jsx (React) or ExamStart.vue (Vue)

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ExamStartPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  const examId = searchParams.get('examId');
  const token = searchParams.get('token');
  const studentId = getCurrentUserId(); // Your auth context

  useEffect(() => {
    verifyExamEligibility();
  }, [examId, token]);

  const verifyExamEligibility = async () => {
    try {
      setLoading(true);
      
      // Validate params exist
      if (!examId || !token) {
        setError({ message: 'Invalid exam link' });
        return;
      }

      // Call your main backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/seb/verify-exam-link`,
        {
          examId,
          studentId,
          token
        }
      );

      if (response.data.success) {
        setVerificationResult(response.data.data);
      } else {
        setError(response.data);
      }
    } catch (err) {
      const errorData = err.response?.data || {};
      setError({
        code: errorData.code || 'UNKNOWN_ERROR',
        message: errorData.error || 'Failed to verify exam eligibility'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadSEBConfig = async () => {
    try {
      // ⚠️ IMPORTANT: This calls the EXTERNAL API server (not your main backend)
      const API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL; // e.g., https://api-server.com
      const SEB_FRONTEND_URL = process.env.REACT_APP_SEB_FRONTEND_URL; // e.g., https://seb.yourexam.com
      
      const response = await axios.post(
        `${API_SERVER_URL}/api/seb/generate-seb-config`,
        {
          examId,
          studentId,
          token, // Original exam access token
          backendUrl: process.env.REACT_APP_API_URL, // Your main backend
          sebFrontendUrl: SEB_FRONTEND_URL
        },
        {
          responseType: 'blob' // Important for file download
        }
      );

      // Trigger file download
      const blob = new Blob([response.data], { type: 'application/seb' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `secure-exam-${examId}-${Date.now()}.seb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      alert('SEB configuration downloaded! Please open the .seb file to start your exam.');
    } catch (err) {
      console.error('Failed to download SEB config:', err);
      alert('Failed to download SEB configuration. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-border"></div>
          <p className="mt-3">Verifying exam eligibility...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            ❌ Cannot Start Exam
          </h2>
          <p className="text-red-600">{error.message}</p>
          
          {/* Handle different error codes */}
          {error.code === 'EXAM_NOT_STARTED' && verificationResult?.exam && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                This exam starts on: {new Date(verificationResult.exam.startDate).toLocaleString()}
              </p>
            </div>
          )}
          
          {error.code === 'ACTIVE_ATTEMPT_EXISTS' && (
            <button 
              onClick={() => navigate('/student/attempts')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Resume Exam
            </button>
          )}
          
          <button 
            onClick={() => navigate('/student/dashboard')}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-green-800 mb-2">
          ✅ Exam Eligibility Verified
        </h2>
        <p className="text-green-600">
          You are eligible to take this exam. Download the SEB configuration to begin.
        </p>
      </div>

      {/* Exam Details */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-2xl font-bold mb-4">{verificationResult.exam.title}</h3>
        
        {verificationResult.exam.description && (
          <p className="text-gray-600 mb-4">{verificationResult.exam.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-sm text-gray-600">Duration</div>
            <div className="text-2xl font-bold text-blue-600">
              {verificationResult.exam.duration} min
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <div className="text-sm text-gray-600">Total Marks</div>
            <div className="text-2xl font-bold text-purple-600">
              {verificationResult.exam.totalMarks}
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded">
            <div className="text-sm text-gray-600">Passing Marks</div>
            <div className="text-2xl font-bold text-yellow-600">
              {verificationResult.exam.passingMarks}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <div className="text-sm text-gray-600">Retakes</div>
            <div className="text-xl font-bold text-green-600">
              {verificationResult.exam.allowRetakes ? 'Allowed' : 'Not Allowed'}
            </div>
          </div>
        </div>

        {/* Schedule */}
        {verificationResult.exam.startDate && (
          <div className="bg-red-50 p-4 rounded mb-4">
            <div className="text-sm font-semibold text-red-800 mb-2">📅 Schedule</div>
            <div className="text-sm text-red-700">
              <div>Start: {new Date(verificationResult.exam.startDate).toLocaleString()}</div>
              {verificationResult.exam.endDate && (
                <div>End: {new Date(verificationResult.exam.endDate).toLocaleString()}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-yellow-800 mb-3">⚠️ Important Instructions</h4>
        <ol className="list-decimal list-inside space-y-2 text-yellow-700 text-sm">
          <li>Click "Download SEB Configuration" button below</li>
          <li>Open the downloaded .seb file (Safe Exam Browser will launch)</li>
          <li>SEB will lock down your computer and open the exam interface</li>
          <li>Complete your exam within the time limit</li>
          <li>Submit your answers before time expires</li>
          <li>You can quit SEB only after submitting the exam</li>
        </ol>
        
        <div className="mt-4 p-3 bg-yellow-100 rounded">
          <p className="text-xs text-yellow-900">
            <strong>Note:</strong> If you don't have Safe Exam Browser installed, 
            download it from <a href="https://safeexambrowser.org/download_en.html" 
            target="_blank" className="underline">safeexambrowser.org</a>
          </p>
        </div>
      </div>

      {/* Download Button */}
      <div className="text-center">
        <button
          onClick={downloadSEBConfig}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition"
        >
          🔐 Download SEB Configuration & Start Exam
        </button>
      </div>
    </div>
  );
};

export default ExamStartPage;
```

### 🔧 Environment Variables for Primary Frontend

Add to your `.env` file:

```bash
# Main Backend API
REACT_APP_API_URL=https://api.yourexam.com

# External API Server (handles SEB config generation)
REACT_APP_API_SERVER_URL=https://api-server.yourexam.com

# Secondary Frontend (SEB Frontend)
REACT_APP_SEB_FRONTEND_URL=https://seb.yourexam.com
```

---

## 🔒 Secondary (SEB) Frontend Requirements

### 📁 New Route to Create

**Route**: `/exam/:examId/:sebToken`

### 🎨 UI Components Needed

#### 1. **SEB Exam Interface**

**Functionality**:
```javascript
// When page loads:
1. Extract examId and sebToken from URL params
2. Verify sebToken with backend
3. If valid, call POST /api/exam-attempts/start
4. Display exam questions
5. Auto-save progress periodically
6. Submit exam when time expires or student clicks submit
```

### 📝 Code Example for SEB Frontend

```javascript
// SEBExamPage.jsx (React)

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const SEBExamPage = () => {
  const { examId, sebToken } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [error, setError] = useState(null);
  
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);

  useEffect(() => {
    validateTokenAndStartExam();
    
    return () => {
      // Cleanup timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [examId, sebToken]);

  const validateTokenAndStartExam = async () => {
    try {
      setLoading(true);

      // 1. Decode and validate SEB token
      let decoded;
      try {
        decoded = jwt_decode(sebToken);
      } catch (err) {
        setError('Invalid token format');
        return;
      }

      // 2. Check token type
      if (decoded.type !== 'seb-session') {
        setError('Invalid token type');
        return;
      }

      // 3. Check if token matches exam
      if (decoded.examId !== examId) {
        setError('Token does not match exam');
        return;
      }

      // 4. Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        setError('Token has expired');
        return;
      }

      // 5. Start exam attempt
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/exam-attempts/start`,
        { examId },
        {
          headers: {
            'Authorization': `Bearer ${sebToken}` // Use SEB token for auth
          }
        }
      );

      if (response.data.success) {
        const attemptData = response.data.attempt;
        setAttempt(attemptData);
        setExam(attemptData.exam);
        
        // Calculate time remaining
        const startTime = new Date(attemptData.startTime).getTime();
        const duration = attemptData.exam.duration * 60 * 1000; // Convert to ms
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        
        setTimeRemaining(Math.floor(remaining / 1000)); // in seconds
        
        // Start timer
        startTimer();
        
        // Start auto-save
        startAutoSave();
      } else {
        setError(response.data.error || 'Failed to start exam');
      }
    } catch (err) {
      console.error('Error starting exam:', err);
      setError(err.response?.data?.error || 'Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up! Auto-submit
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startAutoSave = () => {
    // Auto-save every 30 seconds
    autoSaveRef.current = setInterval(() => {
      saveProgress();
    }, 30000);
  };

  const saveProgress = async () => {
    // Optional: Implement progress saving
    console.log('Auto-saving progress...', answers);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitExam = async (autoSubmit = false) => {
    try {
      // Calculate time spent
      const startTime = new Date(attempt.startTime).getTime();
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/exam-attempts/submit`,
        {
          attemptId: attempt.id,
          answers,
          timeSpent
        },
        {
          headers: {
            'Authorization': `Bearer ${sebToken}`
          }
        }
      );

      if (response.data.success) {
        // Clear timers
        if (timerRef.current) clearInterval(timerRef.current);
        if (autoSaveRef.current) clearInterval(autoSaveRef.current);
        
        // Show results
        navigate(`/exam-result/${attempt.id}`, {
          state: { result: response.data.result }
        });
      } else {
        alert('Failed to submit exam: ' + response.data.error);
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
      alert('Failed to submit exam. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="spinner-border"></div>
          <p className="mt-3">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">❌ Error</h2>
          <p className="text-gray-700">{error}</p>
          <p className="mt-4 text-sm text-gray-500">
            Please contact your instructor if this problem persists.
          </p>
        </div>
      </div>
    );
  }

  // Exam interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with timer */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{exam.title}</h1>
            <p className="text-sm text-gray-500">
              {exam.questions.length} Questions • {exam.totalMarks} Marks
            </p>
          </div>
          <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {exam.questions.map((question, index) => (
          <div key={question.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start mb-4">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="text-lg font-medium">{question.question}</p>
                {question.difficulty && (
                  <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                    question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {question.difficulty}
                  </span>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="ml-11 space-y-2">
              {question.options.map((option, optIndex) => (
                <label 
                  key={optIndex}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition ${
                    answers[question.id] === option 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="mr-3"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit button */}
      <div className="bg-white border-t shadow-lg sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Answered: {Object.keys(answers).length} / {exam.questions.length}
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
                submitExam();
              }
            }}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
          >
            Submit Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default SEBExamPage;
```

### 🔧 Environment Variables for SEB Frontend

```bash
# Main Backend API
REACT_APP_API_URL=https://api.yourexam.com
```

---

## 📡 API Endpoints Reference

### 1. **Verify Exam Link** (Main Backend)

**Endpoint**: `POST /api/seb/verify-exam-link`

**Purpose**: Check if student can attempt the exam

**Request Body**:
```json
{
  "examId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Exam eligibility verified successfully",
  "data": {
    "canAttempt": true,
    "exam": {
      "id": "507f1f77bcf86cd799439011",
      "title": "Mathematics Final Exam",
      "description": "Final exam covering all topics",
      "duration": 120,
      "totalMarks": 100,
      "passingMarks": 40,
      "startDate": "2025-10-05T09:00:00Z",
      "endDate": "2025-10-05T12:00:00Z",
      "allowRetakes": false
    },
    "student": {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | - | Missing required fields |
| 401 | `TOKEN_INVALID` | Invalid or expired exam access token |
| 403 | `TOKEN_MISMATCH` | Token does not match exam or student |
| 403 | `EXAM_INACTIVE` | This exam is not active |
| 403 | `EXAM_NOT_STARTED` | Exam has not started yet |
| 403 | `EXAM_ENDED` | Exam has ended |
| 403 | `STUDENT_INVALID` | Student not found or not active |
| 403 | `NOT_ASSIGNED` | You are not assigned to this exam |
| 404 | `EXAM_NOT_FOUND` | Exam not found |
| 409 | `ACTIVE_ATTEMPT_EXISTS` | You already have an active attempt |
| 409 | `RETAKE_NOT_ALLOWED` | Retakes are not allowed |

### 2. **Generate SEB Config** (External API Server)

**⚠️ IMPORTANT**: This is called on the EXTERNAL API server, NOT your main backend!

**Endpoint**: `POST https://api-server.com/api/seb/generate-seb-config`

**Purpose**: Generate SEB configuration file with embedded exam link

**Request Body**:
```json
{
  "examId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "token": "eyJhbGci... (exam access token)",
  "backendUrl": "https://api.yourexam.com",
  "sebFrontendUrl": "https://seb.yourexam.com"
}
```

**Response**: Binary file (.seb) with Content-Type: `application/seb`

### 3. **Start Exam Attempt** (Main Backend)

**Endpoint**: `POST /api/exam-attempts/start`

**Headers**: `Authorization: Bearer {sebToken}`

**Request Body**:
```json
{
  "examId": "507f1f77bcf86cd799439011"
}
```

**Response**: Exam data with questions (without answers)

### 4. **Submit Exam** (Main Backend)

**Endpoint**: `POST /api/exam-attempts/submit`

**Headers**: `Authorization: Bearer {sebToken}`

**Request Body**:
```json
{
  "attemptId": "507f1f77bcf86cd799439013",
  "answers": {
    "questionId1": "Option A",
    "questionId2": "Option C"
  },
  "timeSpent": 5400
}
```

**Response**: Score and detailed results

---

## 🚀 Implementation Steps

### For Primary Frontend Team

1. **Create exam start route** (`/exam/start`)
2. **Parse URL params** (examId, token)
3. **Implement verification call** to `/api/seb/verify-exam-link`
4. **Handle all error codes** with appropriate UI
5. **Add download button** that calls external API server
6. **Test with various scenarios** (see testing checklist)

### For Secondary (SEB) Frontend Team

1. **Create exam interface route** (`/exam/:examId/:sebToken`)
2. **Validate SEB token** (decode JWT, check type and expiry)
3. **Call start exam API** with token in header
4. **Implement timer** with auto-submit
5. **Add auto-save** functionality
6. **Handle submission** with confirmation
7. **Prevent browser back/refresh** (show warning)

---

## 🐛 Error Handling

### Primary Frontend

```javascript
const handleVerificationError = (errorCode, errorData) => {
  switch (errorCode) {
    case 'TOKEN_INVALID':
      return {
        title: 'Invalid Link',
        message: 'Your exam link is invalid or has expired.',
        action: 'requestNewLink'
      };
    
    case 'EXAM_NOT_STARTED':
      return {
        title: 'Exam Not Started',
        message: `This exam starts on ${new Date(errorData.exam.startDate).toLocaleString()}`,
        action: 'showCountdown'
      };
    
    case 'ACTIVE_ATTEMPT_EXISTS':
      return {
        title: 'Active Attempt',
        message: 'You have an active exam attempt.',
        action: 'resumeExam',
        attemptId: errorData.attemptId
      };
    
    // ... handle other cases
  }
};
```

### SEB Frontend

```javascript
// Prevent accidental navigation
window.onbeforeunload = () => {
  if (attempt && !submitted) {
    return 'Your exam is in progress. Are you sure you want to leave?';
  }
};

// Handle network errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      // Network error
      alert('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);
```

---

## ✅ Testing Checklist

### Primary Frontend Tests

- [ ] Valid exam link loads successfully
- [ ] Invalid token shows error
- [ ] Expired token shows error
- [ ] Exam not started shows countdown
- [ ] Exam ended shows appropriate message
- [ ] Active attempt redirects to resume
- [ ] Already taken exam shows previous score
- [ ] Not assigned shows contact instructor
- [ ] Download button triggers .seb file download
- [ ] File downloads with correct name format
- [ ] UI is responsive on mobile/tablet

### SEB Frontend Tests

- [ ] Valid SEB token loads exam
- [ ] Invalid token shows error
- [ ] Expired token shows error
- [ ] Timer counts down correctly
- [ ] Auto-submit works when time expires
- [ ] Manual submit works with confirmation
- [ ] Answer selection saves correctly
- [ ] Auto-save works every 30 seconds
- [ ] All questions are displayed
- [ ] Navigation warning on browser back
- [ ] Results page shows after submission

### Integration Tests

- [ ] Email contains correct unique link
- [ ] Primary frontend → API server flow works
- [ ] SEB config file opens in SEB browser
- [ ] SEB browser navigates to correct URL
- [ ] SEB frontend → Main backend auth works
- [ ] Exam attempt tracks correctly
- [ ] Results are saved properly
- [ ] Teacher can view student attempts

---

## 🔗 Additional Resources

- **Safe Exam Browser**: https://safeexambrowser.org/
- **SEB Documentation**: https://www.safeexambrowser.org/developer/seb-file-format.html
- **JWT Decoder**: https://jwt.io/

---

## 📞 Support

If you have questions or need clarification:
1. Check this documentation first
2. Review the API endpoint responses
3. Test with the provided Postman collection
4. Contact backend team lead

---

**Good luck with the implementation! 🚀**

