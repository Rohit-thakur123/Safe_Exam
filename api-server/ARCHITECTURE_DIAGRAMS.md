# System Architecture Diagrams

## 📊 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURE EXAM SYSTEM ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────────┘

                                  STUDENT JOURNEY
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Student receives email with exam link                                │
│ Link format: https://app.yourexam.com/exam/start?token=eyJhbGci...          │
└───────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Student clicks "Start Exam" button on Primary Frontend               │
└───────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRIMARY FRONTEND (React/Vue)                         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  Frontend makes API call:                                       │        │
│  │  POST /api/seb/generate-seb-config                             │        │
│  │  {                                                              │        │
│  │    examId: "507f...",                                           │        │
│  │    studentId: "507f...",                                        │        │
│  │    token: "eyJhbGci...",                                        │        │
│  │    backendUrl: "https://api.yourexam.com",                    │        │
│  │    sebFrontendUrl: "https://seb.yourexam.com"                 │        │
│  │  }                                                              │        │
│  └────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API SERVER (This Implementation)                          │
│                         Port: 4000                                           │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 3: Validate request                                     │          │
│  │  - Check required fields                                      │          │
│  │  - Validate formats                                           │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 4: Call Main Backend                                    │          │
│  │  POST https://api.yourexam.com/api/seb/verify-exam-link      │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MAIN BACKEND (Your Backend)                          │
│                              Port: 3000                                      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 5: Verify exam eligibility                             │          │
│  │  - Validate token                                             │          │
│  │  - Check exam dates                                           │          │
│  │  - Verify student access                                      │          │
│  │  - Check previous attempts                                    │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Returns:                                                     │          │
│  │  {                                                            │          │
│  │    success: true,                                             │          │
│  │    data: {                                                    │          │
│  │      exam: { title, duration, ... },                         │          │
│  │      canAttempt: true                                         │          │
│  │    }                                                          │          │
│  │  }                                                            │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API SERVER (Continued)                               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 6: Generate SEB Session Token (JWT)                    │          │
│  │  Payload: {                                                   │          │
│  │    type: 'seb-session',                                       │          │
│  │    examId: '507f...',                                         │          │
│  │    studentId: '507f...',                                      │          │
│  │    purpose: 'seb-exam',                                       │          │
│  │    exp: <exam-duration + 30 min>                             │          │
│  │  }                                                            │          │
│  │  Token: eyJhbGci... (150 min validity)                       │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 7: Build Start URL                                     │          │
│  │  https://seb.yourexam.com/exam/507f.../eyJhbGci...           │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 8: Generate SEB Config XML                             │          │
│  │  - Set startURL                                               │          │
│  │  - Configure security settings                                │          │
│  │  - Add URL filter rules                                       │          │
│  │  - Disable keyboard shortcuts                                 │          │
│  │  - Set browser restrictions                                   │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 9: Return .seb file                                    │          │
│  │  Content-Type: application/seb                                │          │
│  │  Content-Disposition: attachment; filename="exam.seb"        │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRIMARY FRONTEND                                     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 10: Download .seb file to student's computer           │          │
│  │  File: secure-exam-507f1f77bcf86cd799439011-1728086400.seb   │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STUDENT'S COMPUTER                                      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 11: Student double-clicks .seb file                    │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 12: Safe Exam Browser launches                         │          │
│  │  - Reads configuration from .seb file                         │          │
│  │  - Applies security settings                                  │          │
│  │  - Locks down computer                                        │          │
│  │  - Disables shortcuts                                         │          │
│  │  - Enters fullscreen mode                                     │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  SAFE EXAM BROWSER (Locked Down)                            │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 13: SEB navigates to start URL                         │          │
│  │  https://seb.yourexam.com/exam/507f.../eyJhbGci...           │          │
│  │                                                               │          │
│  │  Browser is now:                                              │          │
│  │  ✅ Fullscreen mode                                          │          │
│  │  ✅ All shortcuts disabled                                   │          │
│  │  ✅ Cannot switch applications                               │          │
│  │  ✅ Can only access exam domain                              │          │
│  │  ✅ No downloads/uploads                                     │          │
│  │  ✅ No screen capture                                        │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SEB FRONTEND (Exam Interface)                            │
│                        https://seb.yourexam.com                              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 14: Validate SEB session token                         │          │
│  │  - Verify JWT signature                                       │          │
│  │  - Check expiration                                           │          │
│  │  - Validate exam ID                                           │          │
│  │  - Verify student ID                                          │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 15: Load exam questions                                │          │
│  │  - Fetch from main backend                                    │          │
│  │  - Display exam interface                                     │          │
│  │  - Start timer                                                │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Step 16: Student takes exam                                 │          │
│  │  - Answer questions                                           │          │
│  │  - Auto-save progress                                         │          │
│  │  - Submit exam                                                │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                                 EXAM COMPLETE!
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYERS                            │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Email Token (from Main Backend)
  ↓
  • Validates student identity
  • Time-limited access
  • One-time use (optional)

Layer 2: API Server Validation
  ↓
  • Verifies email token with backend
  • Checks exam eligibility
  • Validates exam dates

Layer 3: SEB Session Token (JWT)
  ↓
  • Short-lived (exam duration + 30 min)
  • Contains exam & student IDs
  • Cannot be forged (signed with JWT_SECRET)

Layer 4: SEB Configuration
  ↓
  • Locks down browser
  • Restricts URLs
  • Disables shortcuts
  • Prevents cheating tools

Layer 5: SEB Frontend Validation
  ↓
  • Verifies SEB session token
  • Checks exam access
  • Monitors exam state

Layer 6: Browser Exam Key (Optional)
  ↓
  • Special header sent by SEB
  • Verifies request comes from SEB
  • Cannot be spoofed by regular browser
```

---

## 📡 API Communication Flow

```
┌────────────────┐         ┌────────────────┐         ┌────────────────┐
│   Primary      │         │   API Server   │         │   Main         │
│   Frontend     │         │   (Port 4000)  │         │   Backend      │
│                │         │                │         │   (Port 3000)  │
└────────────────┘         └────────────────┘         └────────────────┘
        │                          │                          │
        │  1. POST /generate-seb   │                          │
        │─────────────────────────>│                          │
        │                          │                          │
        │                          │  2. POST /verify-exam    │
        │                          │─────────────────────────>│
        │                          │                          │
        │                          │  3. Validation Result    │
        │                          │<─────────────────────────│
        │                          │                          │
        │                          │  4. Generate JWT Token   │
        │                          │  5. Create .seb XML      │
        │                          │                          │
        │  6. .seb file download   │                          │
        │<─────────────────────────│                          │
        │                          │                          │

┌────────────────┐         ┌────────────────┐         ┌────────────────┐
│   Student's    │         │   SEB Frontend │         │   Main         │
│   Computer     │         │   (Port 5174)  │         │   Backend      │
│   (SEB)        │         │                │         │                │
└────────────────┘         └────────────────┘         └────────────────┘
        │                          │                          │
        │  7. Opens .seb file      │                          │
        │  8. SEB launches         │                          │
        │                          │                          │
        │  9. Navigate to URL      │                          │
        │─────────────────────────>│                          │
        │                          │                          │
        │                          │  10. Validate JWT Token  │
        │                          │  11. Load Exam           │
        │                          │─────────────────────────>│
        │                          │                          │
        │                          │  12. Exam Data           │
        │                          │<─────────────────────────│
        │                          │                          │
        │  13. Display Exam        │                          │
        │<─────────────────────────│                          │
        │                          │                          │
```

---

## 🗄️ Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          DATA TRANSFORMATION                     │
└─────────────────────────────────────────────────────────────────┘

INPUT: Request from Frontend
{
  "examId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "token": "email-access-token",
  "backendUrl": "https://api.yourexam.com",
  "sebFrontendUrl": "https://seb.yourexam.com"
}
        │
        ▼
VALIDATION: Check Required Fields
✓ examId present
✓ studentId present
✓ token present
✓ backendUrl present
✓ sebFrontendUrl present
        │
        ▼
BACKEND CALL: Verify Eligibility
Request: POST /api/seb/verify-exam-link
Response: {
  success: true,
  data: {
    exam: { title, duration, ... },
    canAttempt: true
  }
}
        │
        ▼
TOKEN GENERATION: Create JWT
Payload: {
  type: 'seb-session',
  examId: '507f...',
  studentId: '507f...',
  purpose: 'seb-exam',
  iat: 1728086400,
  exp: 1728095400  // +150 minutes
}
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        │
        ▼
URL BUILDING: Create Start URL
https://seb.yourexam.com/exam/507f.../eyJhbGci...
        │
        ▼
XML GENERATION: Build .seb Configuration
<?xml version="1.0"?>
<plist version="1.0">
  <dict>
    <key>examName</key>
    <string>Mathematics Final Exam</string>
    <key>startURL</key>
    <string>https://seb.yourexam.com/exam/...</string>
    <!-- Security settings -->
    <key>allowQuit</key>
    <false/>
    <!-- URL filtering -->
    <key>urlFilterRules</key>
    <array>...</array>
  </dict>
</plist>
        │
        ▼
OUTPUT: .seb File
Content-Type: application/seb
Content-Disposition: attachment; filename="secure-exam-507f...-1728086400.seb"
Body: [XML configuration]
```

---

## 🔄 Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                         TOKEN TIMELINE                           │
└─────────────────────────────────────────────────────────────────┘

T-0: Email Token Generated (Main Backend)
│
│    Purpose: Initial access
│    Lifetime: Days to weeks
│    Scope: View exam details, start exam
│
├─> T+0: Student clicks "Start Exam"
│
├─> T+1: API Server validates email token
│
├─> T+2: SEB Session Token Generated (API Server)
│         │
│         │    Purpose: Exam access in SEB
│         │    Lifetime: Exam duration + 30 min (e.g., 150 min)
│         │    Scope: Access exam questions, submit answers
│         │
│         ├─> T+3: Token embedded in .seb file
│         │
│         ├─> T+4: Student opens .seb file
│         │
│         ├─> T+5: SEB navigates to URL with token
│         │
│         ├─> T+6: SEB Frontend validates token
│         │
│         ├─> T+7-149: Student takes exam
│         │
│         ├─> T+150: Token expires (30 min buffer)
│         │
│         └─> Token no longer valid

Timeline Example (120 min exam):
00:00 - Email token used
00:01 - SEB session token created (expires 02:30)
00:02 - Exam starts
02:00 - Exam ends
02:30 - Token expires (grace period used)
```

---

## 🏗️ Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVER COMPONENTS                         │
└─────────────────────────────────────────────────────────────────┘

index.js (Main App)
    │
    ├─> Express Setup
    ├─> Middleware Registration
    │   ├─> CORS
    │   ├─> JSON Parser
    │   ├─> Error Handler
    │   └─> Logging
    │
    ├─> Route Registration
    │   └─> /api/seb/* → seb.routes.js
    │
    └─> Server Start

seb.routes.js (Routes)
    │
    ├─> POST /verify-exam-link → verifyExamLink
    ├─> POST /generate-exam-links → generateExamLinks
    └─> POST /generate-seb-config → generateSEBConfig

sebController.js (Business Logic)
    │
    ├─> generateSEBConfig()
    │   ├─> Validate input
    │   ├─> Call backend
    │   ├─> Generate token
    │   ├─> Generate config
    │   └─> Return file
    │
    ├─> verifyExamLink() [placeholder]
    └─> generateExamLinks() [placeholder]

Utilities:
    │
    ├─> tokenUtils.js
    │   ├─> generateSEBSessionToken()
    │   └─> verifySEBSessionToken()
    │
    ├─> sebConfigGenerator.js
    │   ├─> generateSEBConfigXML()
    │   ├─> escapeXml()
    │   └─> hashPassword()
    │
    ├─> validators.js
    │   ├─> validateRequiredFields()
    │   ├─> isValidExamId()
    │   ├─> isValidStudentId()
    │   └─> isValidUrl()
    │
    └─> logger.js
        ├─> info()
        ├─> warn()
        ├─> error()
        └─> debug()

Middleware:
    │
    ├─> auth.middleware.js
    │   ├─> authenticateToken()
    │   └─> authorizeRole()
    │
    ├─> cors.middleware.js
    │   └─> configureCors()
    │
    └─> errorHandler.middleware.js
        ├─> errorHandler()
        └─> notFoundHandler()
```

---

## 📊 Request/Response Flow Diagram

```
CLIENT REQUEST
    │
    ▼
┌─────────────────────────┐
│   CORS Middleware       │  ← Check origin
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│   JSON Parser           │  ← Parse request body
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│   Route Handler         │  ← Match route
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│   Auth Middleware       │  ← Check JWT (if protected)
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│   Controller Logic      │  ← Execute business logic
└─────────────────────────┘
    │
    ├─> Success Path
    │   │
    │   ▼
    │   Send Response
    │   (200 OK)
    │
    └─> Error Path
        │
        ▼
    ┌─────────────────────────┐
    │   Error Handler         │  ← Format error
    └─────────────────────────┘
        │
        ▼
        Send Error Response
        (4xx or 5xx)
```

---

**Use these diagrams to understand the system architecture and explain it to your team!**
