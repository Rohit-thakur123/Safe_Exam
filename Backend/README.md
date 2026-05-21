# SecureExam Backend API

Complete backend implementation for the SecureExam platform with JWT authentication, role-based access control, and comprehensive exam management.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone and navigate to backend directory**
```bash
cd Backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy the example file
copy .env.example .env

# Edit .env and set your values:
# - MONGO_URI: Your MongoDB connection string
# - JWT_SECRET: Strong secret key (32+ characters)
# - REFRESH_TOKEN_SECRET: Different secret for refresh tokens
```

4. **Seed the database with test data**
```bash
npm run seed
```

5. **Start the development server**
```bash
npm run dev
```

Server will run on `http://localhost:3000`

## 👥 Test Credentials

After running `npm run seed`, use these credentials:

**Teacher Account:**
- Email: `teacher@test.com`
- Password: `teacher123`
- Role: `teacher`

**Student Account:**
- Email: `student@test.com`
- Password: `student123`
- Role: `student`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Routes (`/api/auth`)

#### POST /api/auth/register
Register a new user (teacher or student).

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "teacher"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "670abc123def456",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "teacher"
  }
}
```

#### POST /api/auth/login ⭐ (CRITICAL)
Login with email, password, and role.

**Request:**
```json
{
  "email": "teacher@test.com",
  "password": "teacher123",
  "role": "teacher"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_string",
  "user": {
    "id": "670abc123def456",
    "name": "John Teacher",
    "email": "teacher@test.com",
    "role": "teacher"
  }
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

#### POST /api/auth/logout
Logout (requires authentication).

### Question Routes (`/api/questions`)
All routes require authentication. Teacher-only for create/update/delete.

#### POST /api/questions/new 🔒 (Teacher Only)
Create a new question.

#### GET /api/questions/all
Get all active questions.

#### GET /api/questions/:id
Get question by ID.

#### GET /api/questions/teacher/:teacherId 🔒 (Teacher Only)
Get all questions created by a specific teacher.

#### PUT /api/questions/:id 🔒 (Teacher Only)
Update a question (only your own).

#### DELETE /api/questions/:id 🔒 (Teacher Only)
Delete a question (only your own, not used in active exams).

### Exam Routes (`/api/exams`)

#### POST /api/exams/new 🔒 (Teacher Only)
Create a new exam.

**Request:**
```json
{
  "title": "Mathematics Quiz",
  "description": "Basic math questions",
  "questions": ["670abc123", "670abc124"],
  "duration": 30,
  "totalMarks": 50,
  "passingMarks": 30
}
```

#### GET /api/exams/all ⭐ (CRITICAL - Student Dashboard)
Get all exams. Query params: `?isActive=true&createdBy=teacherId`

**Response:**
```json
{
  "success": true,
  "count": 8,
  "exams": [
    {
      "id": "670def456ghi789",
      "title": "Mathematics Quiz",
      "description": "Basic math questions",
      "duration": 30,
      "totalMarks": 50,
      "passingMarks": 30,
      "isActive": true,
      "questionsCount": 10,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### GET /api/exams/:id ⭐ (CRITICAL - Take Exam)
Get exam details. Students receive questions WITHOUT answers.

#### GET /api/exams/teacher/:teacherId 🔒 (Teacher Only)
Get all exams created by a specific teacher.

#### PUT /api/exams/:id 🔒 (Teacher Only)
Update exam (only your own, no existing attempts).

#### DELETE /api/exams/:id 🔒 (Teacher Only)
Delete exam (only your own, no existing attempts).

#### PATCH /api/exams/:id/toggle-status 🔒 (Teacher Only)
Toggle exam active/inactive status.

### Exam Attempt Routes (`/api/exam-attempts`)

#### POST /api/exam-attempts/start ⭐ (CRITICAL - Student Only)
Start a new exam attempt.

**Request:**
```json
{
  "examId": "670def456ghi789"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Exam started successfully",
  "attempt": {
    "id": "670attempt123",
    "examId": "670def456ghi789",
    "studentId": "670student456",
    "startTime": "2024-01-15T14:30:00Z",
    "status": "in_progress",
    "exam": {
      "title": "Mathematics Quiz",
      "duration": 30,
      "totalMarks": 50,
      "questions": [
        {
          "id": "670abc123",
          "question": "What is 2 + 2?",
          "options": ["3", "4", "5", "6"]
        }
      ]
    }
  }
}
```

#### POST /api/exam-attempts/submit ⭐ (CRITICAL - Student Only)
Submit exam answers and get results.

**Request:**
```json
{
  "attemptId": "670attempt123",
  "answers": {
    "670abc123": "4",
    "670abc124": "Paris"
  },
  "timeSpent": 1200
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Exam submitted successfully",
  "result": {
    "attemptId": "670attempt123",
    "score": 45,
    "totalMarks": 50,
    "percentage": 90,
    "passed": true,
    "correctAnswers": 9,
    "totalQuestions": 10,
    "timeSpent": 1200,
    "submittedAt": "2024-01-15T15:00:00Z",
    "detailed_results": [...]
  }
}
```

#### GET /api/exam-attempts/:id
Get attempt details by ID (student or teacher who created the exam).

#### GET /api/exam-attempts/student/:studentId 🔐 (Student Only)
Get all completed attempts for a student.

#### GET /api/exam-attempts/exam/:examId 🔒 (Teacher Only)
Get all attempts for an exam with statistics.

## 🔒 Authentication

All routes except `/api/auth/register` and `/api/auth/login` require authentication.

**Include JWT token in headers:**
```
Authorization: Bearer <your_jwt_token>
```

## 🛡️ Security Features

- ✅ JWT-based authentication with refresh tokens
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Role-based authorization (teacher/student)
- ✅ Rate limiting (login: 5/15min, API: 100/15min)
- ✅ MongoDB injection prevention
- ✅ Security headers with Helmet
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Exam attempt security (prevents multiple active attempts)

## 📁 Project Structure

```
Backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js          # Authentication logic
│   │   ├── examController.js          # Exam CRUD operations
│   │   ├── examAttemptController.js   # Exam attempt management
│   │   └── questionController.js      # Question CRUD operations
│   ├── middlewares/
│   │   ├── auth.middleware.js         # JWT verification & role auth
│   │   ├── rateLimit.middleware.js    # Rate limiting configs
│   │   ├── signature.middleware.js    # (existing)
│   │   └── seb.middleware.js          # (existing)
│   ├── models/
│   │   ├── User/
│   │   │   └── user.js                # Unified user model
│   │   └── exam/
│   │       ├── exam.js                # Exam schema
│   │       ├── question.js            # Question schema
│   │       └── examAttempt.js         # Exam attempt schema
│   ├── routes/
│   │   ├── auth.routes.js             # Auth endpoints
│   │   ├── exam.routes.js             # Exam endpoints
│   │   ├── examAttempt.routes.js      # Attempt endpoints
│   │   ├── question.routes.js         # Question endpoints
│   │   └── index.js                   # Route aggregator
│   ├── utils/
│   │   └── tokenUtils.js              # JWT utilities
│   ├── db.js                          # MongoDB connection
│   └── index.js                       # Express app setup
├── seed.js                            # Database seeding script
├── .env                               # Environment variables
├── .env.example                       # Environment template
├── package.json
└── README.md
```

## 🧪 Testing the API

### Using the Frontend
The frontend is already configured to work with this backend. Just:
1. Start the backend: `npm run dev`
2. Start the frontend (in separate terminal)
3. Login with test credentials
4. Create questions/exams as teacher
5. Take exams as student

### Using Postman/Thunder Client

1. **Login to get token:**
```
POST http://localhost:3000/api/auth/login
Body: { "email": "teacher@test.com", "password": "teacher123", "role": "teacher" }
```

2. **Copy the token from response**

3. **Use token in subsequent requests:**
```
Header: Authorization: Bearer <your_token>
```

## 🔧 Environment Variables

Required variables in `.env`:

```env
# Database
MONGO_URI=mongodb://localhost:27017/secureexam

# JWT (MUST CHANGE IN PRODUCTION)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
REFRESH_TOKEN_SECRET=different_secret_for_refresh_tokens

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Database Models

### User
- name, email, password (hashed), role, isActive
- Indexes: email, role

### Question
- question, options[4], answer, explanation, difficulty, category
- createdBy (ref: User), isActive
- Indexes: createdBy, category, difficulty

### Exam
- title, description, questions[], duration, totalMarks, passingMarks
- createdBy (ref: User), isActive, startDate, endDate
- Indexes: createdBy, isActive

### ExamAttempt
- examId, studentId, answers (Map), score, percentage, passed
- startTime, endTime, timeSpent, status
- Security: ipAddress, userAgent, tabSwitches, warnings
- Indexes: examId, studentId, status

## 🚀 Deployment

### Production Checklist
- [ ] Set strong JWT secrets (32+ characters)
- [ ] Use MongoDB Atlas or production database
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up proper logging
- [ ] Configure backup strategy
- [ ] Set up monitoring

### Environment Setup
```bash
# Production
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<strong-random-secret>
FRONTEND_URL=https://your-frontend-domain.com
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

## 🐛 Troubleshooting

### Common Issues

**"Authentication required" errors:**
- Ensure you're including the JWT token in Authorization header
- Check if token is expired (login again)

**"Cannot delete question used in active exams":**
- Deactivate or delete the exam first
- Or set the exam to inactive

**Rate limit errors:**
- Wait for the rate limit window to expire
- Adjust limits in .env if needed for development

**CORS errors:**
- Verify FRONTEND_URL in .env matches your frontend
- Check if server is running

## 📞 Support

For issues or questions:
- Check the API documentation above
- Review error messages in console
- Verify environment variables are set correctly

## ✅ Implementation Status

### Phase 1 (CRITICAL) ✅ COMPLETE
- [x] User model and authentication system
- [x] JWT middleware and route protection
- [x] POST /api/auth/login endpoint
- [x] GET /api/exams/all endpoint
- [x] GET /api/exams/:id endpoint
- [x] ExamAttempt model and basic CRUD

### Phase 2 (HIGH PRIORITY) ✅ COMPLETE
- [x] POST /api/exam-attempts/start
- [x] POST /api/exam-attempts/submit
- [x] GET /api/exam-attempts/:id
- [x] Score calculation system

### Phase 3 (MEDIUM PRIORITY) ✅ COMPLETE
- [x] User registration system
- [x] Question/Exam update and delete
- [x] Teacher analytics endpoints
- [x] Advanced security features

## 🎉 Ready for Integration

The backend is now fully functional and ready to integrate with the React frontend. All critical endpoints are implemented and tested!

