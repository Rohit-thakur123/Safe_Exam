# Student Assignment Feature Documentation

## Overview
Teachers now have full control to assign specific students to exams. Students will only see exams they are assigned to, or exams that are open to all students (no assignments).

## ✅ What's Implemented

### 1. Registration & Login (Already Available)
Both teachers and students can register and login through:
- **POST** `/api/auth/register`
- **POST** `/api/auth/login`

### 2. Exam Creation with Student Assignment
Teachers can now assign students when creating an exam:

**POST** `/api/exams/new`
```json
{
  "title": "Mathematics Quiz",
  "description": "Basic math questions",
  "questions": ["question_id_1", "question_id_2"],
  "duration": 30,
  "totalMarks": 50,
  "passingMarks": 30,
  "assignedStudents": ["student_id_1", "student_id_2"]  // NEW!
}
```

### 3. New Teacher Endpoints

#### Assign Students to Existing Exam
**POST** `/api/exams/:id/assign-students`
```json
Request:
{
  "studentIds": ["670abc123", "670def456"]
}

Response:
{
  "success": true,
  "message": "Students assigned to exam successfully",
  "assignedCount": 2
}
```

#### Get All Students (for selection)
**GET** `/api/exams/students/all`
```json
Response:
{
  "success": true,
  "count": 15,
  "students": [
    {
      "id": "670abc123",
      "name": "John Student",
      "email": "john@example.com"
    }
  ]
}
```

#### View Assigned Students for an Exam
**GET** `/api/exams/:id/assigned-students`
```json
Response:
{
  "success": true,
  "exam": {
    "id": "670exam123",
    "title": "Mathematics Quiz"
  },
  "assignedStudents": [
    {
      "id": "670student1",
      "name": "John Student",
      "email": "john@example.com"
    }
  ],
  "count": 1
}
```

## 🔒 Student Access Control

### How It Works:
1. **Exams with assigned students**: Only those specific students can see and take the exam
2. **Exams without assigned students** (empty array): All students can see and take the exam
3. Students attempting to access unauthorized exams get: `"You are not assigned to this exam"`

### Automatic Filtering:
When students call `GET /api/exams/all`, the backend automatically filters to show only:
- Exams assigned to them
- OR exams with no student assignments (open to all)

## 📊 Database Model

The `assignedCandidates` field in the Exam model stores student ObjectIds:
```javascript
{
  assignedCandidates: [
    ObjectId("670student1"),
    ObjectId("670student2")
  ]
}
```

## 🎯 Usage Examples

### Example 1: Create Exam for Specific Students
```javascript
// Teacher creates exam and assigns 2 students
POST /api/exams/new
{
  "title": "Advanced Math Test",
  "questions": ["q1", "q2", "q3"],
  "duration": 45,
  "totalMarks": 100,
  "passingMarks": 60,
  "assignedStudents": ["student_id_1", "student_id_2"]
}
```

### Example 2: Update Student Assignments
```javascript
// Teacher changes which students are assigned
POST /api/exams/670exam123/assign-students
{
  "studentIds": ["new_student_1", "new_student_2", "new_student_3"]
}
// This replaces the previous assignments
```

### Example 3: Make Exam Open to All
```javascript
// Teacher removes all student assignments
POST /api/exams/670exam123/assign-students
{
  "studentIds": []
}
// Now all students can see and take this exam
```

### Example 4: Get List of Students for Assignment
```javascript
// Teacher gets all students to choose from
GET /api/exams/students/all
Authorization: Bearer <teacher_token>

// Returns list of all active students
```

## 🔑 Authentication & Authorization

### Teacher Routes (Require teacher role):
- POST `/api/exams/new` - Create exam with assignments
- POST `/api/exams/:id/assign-students` - Assign students
- GET `/api/exams/:id/assigned-students` - View assignments
- GET `/api/exams/students/all` - List all students

### Student Routes:
- GET `/api/exams/all` - Automatically filtered
- POST `/api/exam-attempts/start` - Validates assignment

### Both Roles:
- POST `/api/auth/register` - Register new account
- POST `/api/auth/login` - Login

## ⚠️ Validation Rules

1. **Student IDs must be valid** MongoDB ObjectIds
2. **Students must exist** in the database
3. **Students must be active** (isActive: true)
4. **Students must have role: 'student'** (not teachers)
5. **Only exam creator** can assign students
6. **Students can only start exams** they're assigned to (or open exams)

## 🔄 Workflow

### Teacher Workflow:
1. Login as teacher
2. Create questions
3. Create exam with optional student assignments
4. OR assign students later using assign-students endpoint
5. View which students are assigned
6. View exam attempts and analytics

### Student Workflow:
1. Login as student
2. See only assigned exams (or open exams)
3. Start exam (validates assignment)
4. Submit exam
5. View results

## 📝 Testing

### Test Scenario 1: Assigned Exam
```bash
# 1. Teacher creates exam for specific student
POST /api/exams/new
{
  "assignedStudents": ["student_1_id"]
}

# 2. student_1 can see and take the exam
GET /api/exams/all (as student_1) ✅

# 3. student_2 cannot see the exam
GET /api/exams/all (as student_2) ❌
```

### Test Scenario 2: Open Exam
```bash
# 1. Teacher creates exam without assignments
POST /api/exams/new
{
  "assignedStudents": []
}

# 2. All students can see and take the exam
GET /api/exams/all (as any student) ✅
```

## 🎉 Summary

**✅ Registration/Login**: Available for both teachers and students
**✅ Student Assignment**: Teachers can assign specific students to exams
**✅ Access Control**: Students only see their assigned exams
**✅ Automatic Filtering**: Backend handles all permission checks
**✅ Validation**: Comprehensive validation of student IDs
**✅ MongoDB Integration**: Uses ObjectId references properly

All features are fully implemented and ready to use!

