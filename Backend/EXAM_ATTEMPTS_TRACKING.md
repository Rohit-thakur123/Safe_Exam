# 🎓 Student Exam Attempts Tracking - Feature Documentation

**Date:** October 4, 2025  
**Feature:** Track exam attempts directly in User model  
**Status:** ✅ COMPLETED

---

## 📝 What Was Added

### New Field in User Model: `examAttempts`

Students now have an embedded array in their user document that tracks all their exam attempts with key information:

```javascript
examAttempts: [
  {
    examId: ObjectId,           // Reference to the exam
    attemptId: ObjectId,         // Reference to the full attempt record
    status: String,              // 'in_progress', 'completed', 'abandoned', 'expired'
    score: Number,               // Final score achieved
    percentage: Number,          // Score as percentage
    passed: Boolean,             // Whether student passed
    totalMarks: Number,          // Total possible marks
    startedAt: Date,            // When exam was started
    completedAt: Date           // When exam was completed (if finished)
  }
]
```

---

## 🎯 Benefits

### 1. **Fast Query Access**
```javascript
// Get student with all their exam attempts in ONE query
GET /api/auth/profile

// Response includes all attempts WITHOUT joining collections
{
  "id": "student-id",
  "name": "John Doe",
  "email": "john@example.com",
  "examAttempts": [
    {
      "examId": "exam-id",
      "examTitle": "Midterm Exam",
      "status": "completed",
      "score": 85,
      "percentage": 85,
      "passed": true
    }
  ]
}
```

### 2. **Quick Status Check**
Check if student has taken/passed an exam without querying ExamAttempt collection.

### 3. **Better Performance**
No need to join multiple collections to get student's exam history.

### 4. **Automatic Updates**
The array is automatically updated when student:
- Starts an exam (adds entry with status 'in_progress')
- Submits an exam (updates with score and status 'completed')

---

## 🚀 API Endpoints

### 1. Get User Profile with Exam Attempts

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "6706f1a2b8e9c123456789ab",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "isActive": true,
    "createdAt": "2025-10-01T10:00:00.000Z",
    "examAttempts": [
      {
        "examId": "6706f1a2b8e9c123456789cd",
        "examTitle": "Midterm Exam",
        "attemptId": "6706f1a2b8e9c123456789ef",
        "status": "completed",
        "score": 85,
        "percentage": 85,
        "passed": true,
        "totalMarks": 100,
        "startedAt": "2025-10-04T10:00:00.000Z",
        "completedAt": "2025-10-04T11:00:00.000Z"
      },
      {
        "examId": "6706f1a2b8e9c123456789gh",
        "examTitle": "Final Exam",
        "attemptId": "6706f1a2b8e9c123456789ij",
        "status": "in_progress",
        "score": 0,
        "percentage": 0,
        "passed": false,
        "totalMarks": 100,
        "startedAt": "2025-10-04T14:00:00.000Z",
        "completedAt": null
      }
    ]
  }
}
```

### 2. Start Exam (Auto-updates User.examAttempts)

```http
POST /api/exam-attempts/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "examId": "exam-id-here"
}
```

**What Happens:**
1. Creates ExamAttempt record
2. **Automatically adds entry to User.examAttempts array** with status 'in_progress'

### 3. Submit Exam (Auto-updates scores)

```http
POST /api/exam-attempts/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "attemptId": "attempt-id-here",
  "answers": { ... },
  "timeSpent": 1800
}
```

**What Happens:**
1. Calculates score and updates ExamAttempt record
2. **Automatically updates User.examAttempts array** with final score, percentage, and passed status

---

## 💡 Use Cases

### Use Case 1: Student Dashboard

Show all exams with their attempt status:

```javascript
// Frontend code
const { data } = await api.auth.getProfile();
const { examAttempts } = data.user;

// Display:
examAttempts.forEach(attempt => {
  console.log(`${attempt.examTitle}: ${attempt.status}`);
  if (attempt.status === 'completed') {
    console.log(`Score: ${attempt.score}/${attempt.totalMarks} (${attempt.percentage}%)`);
    console.log(`Result: ${attempt.passed ? 'PASSED' : 'FAILED'}`);
  }
});
```

### Use Case 2: Check if Student Can Take Exam

```javascript
// Check if student already attempted this exam
const hasAttempted = examAttempts.some(
  attempt => attempt.examId === examId && attempt.status === 'completed'
);

if (hasAttempted && !exam.allowRetakes) {
  alert('You have already attempted this exam. Retakes not allowed.');
}
```

### Use Case 3: Show Exam Status Badge

```javascript
const getExamStatus = (examId) => {
  const attempt = examAttempts.find(a => a.examId === examId);
  
  if (!attempt) return 'Not Started';
  if (attempt.status === 'in_progress') return 'In Progress';
  if (attempt.status === 'completed') {
    return attempt.passed ? '✅ Passed' : '❌ Failed';
  }
  return attempt.status;
};
```

---

## 🗂️ Data Structure

### Complete User Model Schema

```javascript
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "role": "student", // or "teacher"
  "isActive": Boolean,
  "examAttempts": [
    {
      "examId": ObjectId (ref: 'Exam'),
      "attemptId": ObjectId (ref: 'ExamAttempt'),
      "status": "completed" | "in_progress" | "abandoned" | "expired",
      "score": 85,
      "percentage": 85,
      "passed": true,
      "totalMarks": 100,
      "startedAt": ISODate("2025-10-04T10:00:00Z"),
      "completedAt": ISODate("2025-10-04T11:00:00Z")
    }
  ],
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

---

## 🔄 Automatic Updates Flow

### When Student Starts Exam:

```
1. POST /api/exam-attempts/start
   ↓
2. Create ExamAttempt document
   ↓
3. User.findByIdAndUpdate() - Push to examAttempts array:
   {
     examId: exam._id,
     attemptId: attempt._id,
     status: 'in_progress',
     totalMarks: exam.totalMarks,
     startedAt: new Date()
   }
   ↓
4. Return attempt to frontend
```

### When Student Submits Exam:

```
1. POST /api/exam-attempts/submit
   ↓
2. Calculate score and update ExamAttempt
   ↓
3. User.findOneAndUpdate() - Update matching attempt in array:
   {
     $set: {
       'examAttempts.$.status': 'completed',
       'examAttempts.$.score': 85,
       'examAttempts.$.percentage': 85,
       'examAttempts.$.passed': true,
       'examAttempts.$.completedAt': new Date()
     }
   }
   ↓
4. Return result to frontend
```

---

## 📊 Example Queries

### Get All Completed Exams for Student

```javascript
const user = await User.findById(studentId);
const completedExams = user.examAttempts.filter(a => a.status === 'completed');
```

### Check if Student Passed Specific Exam

```javascript
const user = await User.findById(studentId);
const examAttempt = user.examAttempts.find(
  a => a.examId.toString() === examId && a.status === 'completed'
);
const passed = examAttempt?.passed || false;
```

### Get Student's Average Score

```javascript
const user = await User.findById(studentId);
const completedAttempts = user.examAttempts.filter(a => a.status === 'completed');
const averagePercentage = completedAttempts.reduce((sum, a) => sum + a.percentage, 0) / completedAttempts.length;
```

### Find Students Who Passed an Exam

```javascript
const passedStudents = await User.find({
  role: 'student',
  'examAttempts': {
    $elemMatch: {
      examId: examId,
      status: 'completed',
      passed: true
    }
  }
});
```

---

## 🎨 Frontend Integration

### React Example

```typescript
interface ExamAttempt {
  examId: string;
  examTitle: string;
  attemptId: string;
  status: 'in_progress' | 'completed' | 'abandoned' | 'expired';
  score: number;
  percentage: number;
  passed: boolean;
  totalMarks: number;
  startedAt: string;
  completedAt?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  examAttempts: ExamAttempt[];
}

// In your component:
const { data } = await api.auth.getProfile();
const user: UserProfile = data.user;

// Display exam history
{user.examAttempts.map(attempt => (
  <div key={attempt.attemptId}>
    <h3>{attempt.examTitle}</h3>
    <p>Status: {attempt.status}</p>
    {attempt.status === 'completed' && (
      <>
        <p>Score: {attempt.score}/{attempt.totalMarks}</p>
        <p>Result: {attempt.passed ? '✅ Passed' : '❌ Failed'}</p>
      </>
    )}
  </div>
))}
```

---

## ⚠️ Important Notes

### 1. Data Consistency
- The `examAttempts` array is a **denormalized cache**
- Full attempt details still exist in `ExamAttempt` collection
- This provides fast read access without complex joins

### 2. Array Size
- Each student's `examAttempts` array grows with each exam attempt
- Typical size: 10-50 attempts per student
- MongoDB document size limit: 16MB (plenty of room!)

### 3. When to Use Each Source

**Use `User.examAttempts` when you need:**
- Quick status check
- List of all attempts
- Summary information
- Fast filtering by status

**Use `ExamAttempt` collection when you need:**
- Detailed question-by-question results
- Full answer history
- Teacher analytics
- Detailed timestamps and metadata

---

## 🧪 Testing

### Test 1: Start Exam
```bash
# Start an exam
curl -X POST http://localhost:5000/api/exam-attempts/start \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d '{"examId": "exam-id-here"}'

# Check profile - should see new attempt with status 'in_progress'
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <student-token>"
```

### Test 2: Submit Exam
```bash
# Submit exam
curl -X POST http://localhost:5000/api/exam-attempts/submit \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "attemptId": "attempt-id-here",
    "answers": {"question-id": "answer"},
    "timeSpent": 1800
  }'

# Check profile - should see updated score and status 'completed'
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <student-token>"
```

---

## 📦 Files Modified

1. ✅ `src/models/User/user.js` - Added `examAttempts` array
2. ✅ `src/controllers/examAttemptController.js` - Auto-update on start/submit
3. ✅ `src/controllers/authController.js` - Added `getProfile` endpoint
4. ✅ `src/routes/auth.routes.js` - Added profile route

---

## 🎉 Summary

You now have a complete exam attempts tracking system embedded in the User model that:

✅ Automatically updates when students start exams  
✅ Automatically updates when students submit exams  
✅ Provides fast access to exam history  
✅ Shows status, scores, and pass/fail results  
✅ No need for complex joins or multiple queries  
✅ Ready for frontend integration  

**New Endpoint:** `GET /api/auth/profile` returns complete user info with all exam attempts!

---

**Happy Coding! 🚀**

