# 📧 Frontend Team: SEB Integration Requirements

## 🎯 Executive Summary

Your backend team has implemented a new secure exam workflow using **Safe Exam Browser (SEB)** with **unique per-student exam links**. This document outlines what you need to implement on the frontend.

---

## 🏗️ What Changed?

### Before
- Students browse to dashboard → click exam → take exam (any browser)
- No security enforcement
- Generic exam access

### After
- Students receive **unique email link** → click link → verify eligibility → download SEB config → take exam in **locked-down browser**
- Multiple security layers
- Per-student tracking

---

## 📋 Your Tasks

### Primary Frontend Team

#### 1️⃣ Create New Route: `/exam/start`

**Purpose**: Handle exam links from student emails

**URL Format**: 
```
https://yourapp.com/exam/start?examId=507f1f77bcf86cd799439011&token=eyJhbGci...
```

**What to Do**:
1. Parse `examId` and `token` from URL query params
2. Get `studentId` from current logged-in user
3. Call backend API to verify eligibility
4. Show appropriate UI based on response

#### 2️⃣ Call Verification API

**Endpoint**: `POST /api/seb/verify-exam-link`

**Request**:
```javascript
{
  "examId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "token": "eyJhbGci..."  // from URL
}
```

**Success Response** (200):
```javascript
{
  "success": true,
  "data": {
    "canAttempt": true,
    "exam": {
      "id": "...",
      "title": "Mathematics Final Exam",
      "duration": 120,
      "totalMarks": 100,
      "passingMarks": 40,
      "startDate": "2025-10-05T09:00:00Z",
      "endDate": "2025-10-05T12:00:00Z",
      "allowRetakes": false
    },
    "student": { ... }
  }
}
```

**Error Response** (4xx):
```javascript
{
  "success": false,
  "error": "Error message",
  "code": "TOKEN_INVALID" // or other codes
}
```

#### 3️⃣ Handle Error Codes

You MUST handle these error codes with appropriate UI:

| Code | UI Action |
|------|-----------|
| `TOKEN_INVALID` | Show "Link expired, request new link" |
| `TOKEN_MISMATCH` | Show "Wrong account, please logout" |
| `EXAM_NOT_FOUND` | Show "Exam not found" |
| `EXAM_INACTIVE` | Show "Exam is not active" |
| `EXAM_NOT_STARTED` | Show countdown to start time |
| `EXAM_ENDED` | Show "Exam has ended" |
| `ACTIVE_ATTEMPT_EXISTS` | Show "Resume Exam" button |
| `RETAKE_NOT_ALLOWED` | Show "Already taken" + previous score |
| `NOT_ASSIGNED` | Show "Contact instructor" |

#### 4️⃣ Add Download Button (Success State)

When verification succeeds, show a button to download SEB configuration.

**⚠️ CRITICAL**: This button calls the **EXTERNAL API SERVER**, not your main backend!

```javascript
const downloadSEBConfig = async () => {
  const response = await axios.post(
    'https://api-server.com/api/seb/generate-seb-config',  // External!
    {
      examId,
      studentId,
      token,
      backendUrl: 'https://api.yourexam.com',       // Your backend
      sebFrontendUrl: 'https://seb.yourexam.com'    // SEB frontend
    },
    { responseType: 'blob' }
  );
  
  // Trigger file download
  const blob = new Blob([response.data], { type: 'application/seb' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `exam-${examId}.seb`;
  link.click();
};
```

---

### Secondary (SEB) Frontend Team

#### 1️⃣ Create New Route: `/exam/:examId/:sebToken`

**Purpose**: Display exam interface inside SEB browser

**What to Do**:
1. Extract `examId` and `sebToken` from URL params
2. Decode and validate the JWT token
3. Call existing `POST /api/exam-attempts/start` (with token in header)
4. Display exam questions
5. Handle timer and auto-save
6. Submit exam

#### 2️⃣ Token Validation

```javascript
import jwt_decode from 'jwt-decode';

const validateToken = (sebToken) => {
  try {
    const decoded = jwt_decode(sebToken);
    
    // Check token type
    if (decoded.type !== 'seb-session') {
      throw new Error('Invalid token type');
    }
    
    // Check expiry
    if (decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    return decoded; // { examId, studentId, exp, ... }
  } catch (err) {
    console.error('Token validation failed:', err);
    return null;
  }
};
```

#### 3️⃣ Use Existing Endpoints

The SEB frontend uses your **EXISTING** exam attempt endpoints:

```javascript
// Start exam
POST /api/exam-attempts/start
Headers: { Authorization: Bearer <sebToken> }
Body: { examId }

// Submit exam
POST /api/exam-attempts/submit
Headers: { Authorization: Bearer <sebToken> }
Body: { attemptId, answers, timeSpent }
```

**No changes to these endpoints!** Just use the SEB token for authentication.

---

## 🔧 Environment Variables

Add to your frontend `.env`:

```bash
# Primary Frontend
REACT_APP_API_URL=https://api.yourexam.com
REACT_APP_API_SERVER_URL=https://api-server.com
REACT_APP_SEB_FRONTEND_URL=https://seb.yourexam.com

# SEB Frontend
REACT_APP_API_URL=https://api.yourexam.com
```

---

## 📚 Complete Documentation

**🔗 Full Guide**: See `SEB_INTEGRATION_GUIDE.md` for:
- Complete React/Vue code examples
- All API endpoint details
- Error handling patterns
- Testing checklist
- Step-by-step implementation

**📊 Architecture**: See system diagrams provided

---

## 🎨 UI Mockups

### Verification Success Page
```
╔════════════════════════════════════════╗
║  ✅ Exam Eligibility Verified          ║
╠════════════════════════════════════════╣
║                                        ║
║  📝 Mathematics Final Exam             ║
║                                        ║
║  ⏱️ Duration: 120 minutes              ║
║  📊 Total Marks: 100                   ║
║  ✓ Passing Marks: 40                   ║
║                                        ║
║  ⚠️ Important Instructions:            ║
║  1. Download SEB config below          ║
║  2. Open the .seb file                 ║
║  3. SEB will launch automatically      ║
║  4. Complete exam in SEB               ║
║                                        ║
║  [ 🔐 Download SEB Config ]  ← Button ║
║                                        ║
╚════════════════════════════════════════╝
```

### Error Page Example
```
╔════════════════════════════════════════╗
║  ❌ Cannot Start Exam                  ║
╠════════════════════════════════════════╣
║                                        ║
║  This exam has not started yet.        ║
║                                        ║
║  Start time:                           ║
║  October 5, 2025 at 9:00 AM           ║
║                                        ║
║  ⏱️ Countdown: 2 hours 15 minutes      ║
║                                        ║
║  [ ← Back to Dashboard ]               ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## 🧪 Testing Checklist

### Primary Frontend
- [ ] Valid link loads successfully
- [ ] Invalid token shows error
- [ ] Exam not started shows countdown
- [ ] Already attempted shows previous score
- [ ] Download button works
- [ ] .seb file downloads correctly
- [ ] All error codes handled

### SEB Frontend
- [ ] Token validation works
- [ ] Exam loads correctly
- [ ] Timer counts down
- [ ] Auto-submit on time expiry
- [ ] Manual submit works
- [ ] Results page displays

---

## 🚀 Implementation Priority

### Phase 1: Critical (Week 1)
1. Primary Frontend: Verification page
2. Primary Frontend: Error handling
3. Primary Frontend: Download functionality
4. Test with backend team

### Phase 2: SEB Interface (Week 2)
1. SEB Frontend: Token validation
2. SEB Frontend: Exam interface
3. SEB Frontend: Timer & auto-save
4. SEB Frontend: Submission

### Phase 3: Polish (Week 3)
1. UI/UX improvements
2. Loading states
3. Error messages refinement
4. End-to-end testing

---

## 🤝 Coordination Points

### With Backend Team
- ✅ Backend endpoints are ready
- ✅ API documentation provided
- ⏳ Need to coordinate on API server setup

### Between Frontend Teams
- Primary team handles verification & download
- SEB team handles exam interface
- Both use same backend API

---

## 📞 Questions?

**For implementation details**: See `SEB_INTEGRATION_GUIDE.md`

**For API reference**: See API section in the guide

**For backend questions**: Contact backend team lead

---

## 🎯 Success Criteria

✅ Student receives email with unique link  
✅ Link opens in Primary Frontend  
✅ Verification works correctly  
✅ Error states display properly  
✅ SEB config downloads successfully  
✅ SEB browser opens and locks down  
✅ Exam loads in SEB Frontend  
✅ Student can complete exam  
✅ Submission works correctly  
✅ Results are recorded  

---

**Let's make this secure! 🔐**

