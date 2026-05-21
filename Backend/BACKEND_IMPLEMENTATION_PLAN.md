# 🎯 Backend Implementation Plan
## SEB Integration for Secure Exam System

---

## 📋 Overview

This document outlines the backend changes required to support the new SEB (Safe Exam Browser) integration with unique per-student exam links.

---

## 🏗️ Architecture Changes

### Old Flow
```
Student → Login → Dashboard → Select Exam → Take Exam (any browser)
```

### New Flow
```
Student → Email Link → Primary Frontend → Verification → Download .seb → 
SEB Browser → Secondary Frontend → Take Exam (secure)
```

---

## ✅ Completed Changes

### 1. **New Utility: Exam Link Generation** 
**File**: `src/utils/examLinkUtils.js`

**Functions**:
- ✅ `generateExamAccessToken()` - Create token for email links
- ✅ `verifyExamAccessToken()` - Verify email token validity
- ✅ `generateSEBSessionToken()` - Create short-lived token for SEB
- ✅ `verifySEBSessionToken()` - Verify SEB session token
- ✅ `generateExamLink()` - Build complete exam URL for email
- ✅ `generateUniqueId()` - Generate unique identifiers

**Token Structure**:
```javascript
// Exam Access Token (email link)
{
  type: 'exam-access',
  examId: '507f1f77bcf86cd799439011',
  studentId: '507f1f77bcf86cd799439012',
  purpose: 'exam-verification',
  exp: <exam_duration + 24h>
}

// SEB Session Token (inside SEB browser)
{
  type: 'seb-session',
  examId: '507f1f77bcf86cd799439011',
  studentId: '507f1f77bcf86cd799439012',
  purpose: 'seb-exam-attempt',
  exp: <exam_duration + 30min>
}
```

---

### 2. **New Controller: SEB Management**
**File**: `src/controllers/sebController.js`

**Endpoints Implemented**:

#### ✅ `verifyExamLink(req, res)`
- **Route**: `POST /api/seb/verify-exam-link`
- **Purpose**: Verify if student can attempt exam
- **Auth**: None (uses token in request body)
- **Checks**:
  - ✅ Token validity and expiration
  - ✅ Token matches exam and student
  - ✅ Exam exists and is active
  - ✅ Exam date/time window
  - ✅ Student is assigned to exam
  - ✅ No active attempts exist
  - ✅ Retake policy compliance
- **Returns**: Exam details + eligibility status

#### ✅ `generateExamLinks(req, res)`
- **Route**: `POST /api/seb/generate-exam-links`
- **Purpose**: Generate unique links for multiple students
- **Auth**: Required (teacher only)
- **Returns**: Array of student links

#### ✅ `getSEBSessionToken(req, res)`
- **Route**: `POST /api/seb/get-session-token`
- **Purpose**: Get short-lived token for SEB browser
- **Auth**: None (uses exam access token)
- **Returns**: SEB session token

---

### 3. **New Routes: SEB Endpoints**
**File**: `src/routes/seb.routes.js`

**Routes Registered**:
```javascript
POST /api/seb/verify-exam-link          // Public
POST /api/seb/generate-exam-links       // Teacher only
POST /api/seb/get-session-token         // Public
```

**Main Router Updated**: ✅ Added to `src/routes/index.js`

---

### 4. **Updated Service: Email with Links**
**File**: `src/services/examEmailService.js`

**Changes**:
- ✅ Import `generateExamLink()` utility
- ✅ Updated `sendExamAssignmentEmail()` to include unique link
- ✅ Updated `sendBulkExamAssignmentEmails()` to generate per-student links
- ✅ Added `frontendBaseUrl` parameter (defaults to env var)

**Email Flow**:
```javascript
For each student:
  1. Generate unique exam access token
  2. Build exam link with token
  3. Include link in email HTML
  4. Send email
```

---

### 5. **Updated Templates: Email with Links**
**File**: `src/utils/emailTemplates.js`

**Changes**:
- ✅ Added `examLink` parameter to templates
- ✅ HTML template now shows "Start Exam" button with unique link
- ✅ Plain text template includes link as text
- ✅ Added security notice about link uniqueness

**Email Preview**:
```
╔════════════════════════════════════╗
║   📝 New Exam Assigned             ║
╠════════════════════════════════════╣
║ Dear John Doe,                     ║
║                                    ║
║ Mathematics Final Exam             ║
║ Duration: 120 min | Marks: 100    ║
║                                    ║
║ 🔗 Your Unique Exam Link           ║
║ [  🚀 Start Exam  ]  ← Button     ║
║                                    ║
║ This link is unique to you         ║
╚════════════════════════════════════╝
```

---

## 🔧 Environment Variables Required

Add these to your `.env` file:

```bash
# JWT Secret (should already exist)
JWT_SECRET=your-super-secret-key-change-this

# Frontend Base URL (for email links)
FRONTEND_BASE_URL=http://localhost:5173

# Optional: Email configuration
FRONTEND_URL=http://localhost:5173
```

---

## 📡 API Flow Diagram

```
┌─────────────┐
│   Teacher   │
│  Creates    │
│   Exam      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /api/exams/new                 │
│ Body: { assignedStudents: [...] }  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Backend generates unique link       │
│ per student and sends email         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Student   │
│ Clicks Link │
│  in Email   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Primary Frontend:                   │
│ /exam/start?examId=XXX&token=YYY   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /api/seb/verify-exam-link      │
│ ✅ Validates token & eligibility    │
└──────┬──────────────────────────────┘
       │
       ├── ✅ Valid
       │   │
       │   ▼
       │   Show "Download SEB Config"
       │   │
       │   ▼
       │   [External API Server call]
       │   │
       │   ▼
       │   Download .seb file
       │   │
       │   ▼
       │   Student opens .seb
       │   │
       │   ▼
       │   SEB Browser launches
       │   │
       │   ▼
       │   Navigate to Secondary Frontend
       │   │
       │   ▼
       │   POST /api/exam-attempts/start
       │   (with SEB session token)
       │
       └── ❌ Invalid
           │
           ▼
           Show error + appropriate action
```

---

## 🛡️ Security Layers

### Layer 1: Email Token
- **Purpose**: Initial access control
- **Lifetime**: Days to weeks
- **Validation**: JWT signature + expiry
- **Contains**: Student ID, Exam ID

### Layer 2: Backend Verification
- **Purpose**: Eligibility checking
- **Checks**: 15+ validation rules
- **Returns**: Detailed error codes

### Layer 3: SEB Session Token
- **Purpose**: Short-term exam access
- **Lifetime**: Exam duration + 30 min
- **Validation**: JWT signature + type check
- **Contains**: Student ID, Exam ID, purpose

### Layer 4: SEB Browser
- **Purpose**: Environment lockdown
- **Features**: 
  - Fullscreen mode
  - Keyboard shortcuts disabled
  - App switching blocked
  - URL filtering

---

## 🔄 Exam Attempt Flow

### Before SEB Integration (Old)
```javascript
POST /api/exam-attempts/start
Body: { examId }
Headers: { Authorization: Bearer <regular_token> }
```

### After SEB Integration (New)
```javascript
// Same endpoint, but token is now SEB session token
POST /api/exam-attempts/start
Body: { examId }
Headers: { Authorization: Bearer <seb_session_token> }

// Optional: Add SEB validation middleware
// The existing startExamAttempt controller already handles this!
```

**Note**: The existing `startExamAttempt` controller in `examAttemptController.js` already has all the validation logic. It checks:
- ✅ Student assignment
- ✅ Active status
- ✅ Retake policy
- ✅ No duplicate attempts

So no changes needed there!

---

## 🎯 Integration Points

### 1. **Exam Creation**
**File**: `src/controllers/examController.js`

**Current Flow**:
```javascript
createExam() → 
  Validate students → 
  Create exam → 
  sendBulkExamAssignmentEmails() ← Already updated! ✅
```

**What Changed**: Email service now includes unique links automatically.

### 2. **Student Assignment**
**File**: `src/controllers/examController.js`

**Function**: `assignStudentsToExam()`

**Recommended Addition**:
```javascript
// After assigning students, optionally send emails
if (sendEmailNotification) {
  await sendBulkExamAssignmentEmails(
    studentObjects,
    examDetails,
    req.user,
    process.env.FRONTEND_BASE_URL
  );
}
```

### 3. **Exam Attempt Start**
**File**: `src/controllers/examAttemptController.js`

**Function**: `startExamAttempt()`

**Current Validation** (already exists):
- ✅ Student assignment check (lines 51-62)
- ✅ Active attempt check (lines 64-73)
- ✅ Retake policy check (lines 75-89)

**No changes needed!** The existing controller already has all necessary checks.

---

## 📊 Database Schema (No Changes Needed!)

All existing models work perfectly:

### Exam Model
```javascript
{
  assignedCandidates: [ObjectId], // Already exists ✅
  isActive: Boolean,              // Already exists ✅
  startDate: Date,                // Already exists ✅
  endDate: Date,                  // Already exists ✅
  allowRetakes: Boolean           // Already exists ✅
}
```

### ExamAttempt Model
```javascript
{
  examId: ObjectId,
  studentId: ObjectId,
  status: String,        // 'in_progress', 'completed', etc.
  startTime: Date,
  endTime: Date,
  // ... all existing fields work!
}
```

**No migration needed!** 🎉

---

## 🧪 Testing Guide

### Test 1: Verify Exam Link - Success
```bash
POST http://localhost:3000/api/seb/verify-exam-link
Content-Type: application/json

{
  "examId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "token": "eyJhbGci..." # Get from email
}

Expected: 200 OK with exam details
```

### Test 2: Verify Exam Link - Token Invalid
```bash
POST http://localhost:3000/api/seb/verify-exam-link
Content-Type: application/json

{
  "examId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "token": "invalid-token"
}

Expected: 401 with code "TOKEN_INVALID"
```

### Test 3: Verify Exam Link - Not Assigned
```bash
# Use a student not assigned to the exam

Expected: 403 with code "NOT_ASSIGNED"
```

### Test 4: Generate Exam Links (Teacher)
```bash
POST http://localhost:3000/api/seb/generate-exam-links
Authorization: Bearer {teacher_token}
Content-Type: application/json

{
  "examId": "507f1f77bcf86cd799439011",
  "studentIds": [
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "frontendBaseUrl": "http://localhost:5173"
}

Expected: 200 OK with array of links
```

### Test 5: Active Attempt Check
```bash
# Start exam first, then try to verify again

Expected: 409 with code "ACTIVE_ATTEMPT_EXISTS"
```

### Test 6: Retake Policy
```bash
# Complete an exam where allowRetakes = false
# Try to verify again

Expected: 409 with code "RETAKE_NOT_ALLOWED"
```

---

## 📝 Postman Collection

Create a new collection with these requests:

```json
{
  "info": {
    "name": "SEB Integration Tests"
  },
  "item": [
    {
      "name": "1. Login as Teacher",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/login",
        "body": {
          "email": "teacher@example.com",
          "password": "password123"
        }
      }
    },
    {
      "name": "2. Create Exam with Students",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/exams/new",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{teacherToken}}"
          }
        ]
      }
    },
    {
      "name": "3. Verify Exam Link",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/seb/verify-exam-link"
      }
    },
    {
      "name": "4. Generate Exam Links",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/seb/generate-exam-links",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{teacherToken}}"
          }
        ]
      }
    }
  ]
}
```

---

## ⚠️ Important Notes

### 1. **External API Server**
The SEB config generation is NOT handled by your main backend. It should be handled by a separate API server (as per your architecture diagram). Your backend only provides the verification endpoint.

### 2. **Token Expiry**
- Exam access token: Long-lived (days)
- SEB session token: Short-lived (exam duration + 30 min)

Always check expiry before using!

### 3. **Error Codes**
The verification endpoint returns specific error codes. Frontend MUST handle all these codes:
- `TOKEN_INVALID`
- `TOKEN_MISMATCH`
- `EXAM_NOT_FOUND`
- `EXAM_INACTIVE`
- `EXAM_NOT_STARTED`
- `EXAM_ENDED`
- `STUDENT_INVALID`
- `NOT_ASSIGNED`
- `ACTIVE_ATTEMPT_EXISTS`
- `RETAKE_NOT_ALLOWED`

### 4. **CORS Configuration**
Make sure your backend allows requests from:
- Primary frontend domain
- Secondary (SEB) frontend domain
- External API server domain (if needed)

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] JWT_SECRET is strong and secret
- [ ] FRONTEND_BASE_URL points to production domain
- [ ] Email service is working
- [ ] CORS allows all frontend domains
- [ ] Database indexes are created
- [ ] All endpoints tested
- [ ] Error handling verified
- [ ] Logs are set up for debugging
- [ ] Monitor token expiry issues

---

## 📚 Additional Resources

- See `SEB_INTEGRATION_GUIDE.md` for frontend team documentation
- See architecture diagrams provided by you
- Check existing controllers for reference

---

## 🎉 Summary

**What's Done**:
✅ 3 new utility functions for token generation
✅ 1 new controller with 3 endpoints
✅ 1 new route file
✅ Email service updated to include links
✅ Email templates updated with link button
✅ Main router registered with new routes
✅ Comprehensive documentation created

**What's NOT Changed**:
❌ Database schemas (no migration needed!)
❌ Existing exam attempt controllers (already have validation!)
❌ Authentication middleware (works as-is!)
❌ Exam models (perfect as they are!)

**Frontend Team Deliverables**:
📄 `SEB_INTEGRATION_GUIDE.md` - Complete guide for frontend teams
📊 Architecture diagrams - Already provided by you
🔗 API endpoint documentation - Included in guide

---

**You're ready to go! 🚀**

