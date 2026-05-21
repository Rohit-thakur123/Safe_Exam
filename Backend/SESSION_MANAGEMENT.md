# Session Management with Redis - Documentation

## 🎯 Overview

Implemented Redis-based session management to prevent concurrent logins for students. This ensures that only **ONE active session** exists per student at any given time, preventing multiple students from using the same login credentials simultaneously.

## ✅ What's Implemented

### 1. Redis Session Store
- **Session Storage**: Active sessions stored in Redis with 24-hour expiration
- **User Tracking**: Each user can have only one active session
- **Auto-Cleanup**: Sessions automatically expire after 24 hours of inactivity
- **Session Data**: Stores token, user info, IP address, user agent, and timestamps

### 2. Concurrent Login Prevention
- **For Students**: Strict enforcement - new login terminates old session
- **For Teachers**: Flexible - can have multiple sessions (for convenience)
- **Real-time Validation**: Every API call validates the session is still active

### 3. Session Lifecycle

```
Login → Create Session in Redis → Store Token
  ↓
API Calls → Validate Session → Update Activity
  ↓
Logout → Remove Session from Redis
```

## 🔒 How It Works

### Scenario 1: Student Login (Normal)
```
1. Student logs in from Device A
2. Session created in Redis with Token A
3. Student accesses dashboard → ✅ Success
4. Student takes exam → ✅ Success
```

### Scenario 2: Concurrent Login Attempt
```
1. Student already logged in on Device A (Token A active)
2. Student tries to login on Device B
3. System terminates session from Device A
4. New session created with Token B
5. Device A tries to access dashboard → ❌ "Your account is being accessed from another location"
6. Device B works normally → ✅ Success
```

### Scenario 3: Session Expiration
```
1. Student logs in and gets Token A
2. 24 hours pass without activity
3. Redis auto-expires the session
4. Student tries to access dashboard → ❌ "Session expired. Please login again"
```

## 📡 New API Endpoints

### Check Session Status
**GET** `/api/sessions/status`
```json
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "session": {
    "loginTime": "2024-01-15T10:30:00Z",
    "lastActivity": "2024-01-15T14:25:00Z",
    "ipAddress": "192.168.1.100",
    "role": "student"
  }
}
```

### Force Logout Current Session
**POST** `/api/sessions/force-logout`
```json
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Session terminated successfully"
}
```

### View All Active Sessions (Teachers Only)
**GET** `/api/sessions/all`
```json
Headers: Authorization: Bearer <teacher_token>

Response:
{
  "success": true,
  "count": 15,
  "sessions": [
    {
      "userId": "670abc123",
      "email": "student@example.com",
      "role": "student",
      "loginTime": "2024-01-15T10:30:00Z",
      "lastActivity": "2024-01-15T14:25:00Z",
      "ipAddress": "192.168.1.100"
    }
  ]
}
```

## 🔑 Session Data Structure

Each session in Redis contains:
```javascript
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  userId: "670abc123def456",
  email: "student@example.com",
  role: "student",
  loginTime: "2024-01-15T10:30:00Z",
  lastActivity: "2024-01-15T14:25:00Z",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
}
```

**Redis Key Format**: `session:<userId>`
**Expiration**: 24 hours from last activity

## 🚨 Error Codes & Messages

### SESSION_EXPIRED
```json
{
  "success": false,
  "error": "Session expired. Please login again.",
  "code": "SESSION_EXPIRED"
}
```
**When**: Session not found in Redis (expired or logged out)
**Action**: User must login again

### CONCURRENT_SESSION_DETECTED
```json
{
  "success": false,
  "error": "Your account is being accessed from another location. This session has been terminated.",
  "code": "CONCURRENT_SESSION_DETECTED"
}
```
**When**: Token doesn't match active session (someone else logged in)
**Action**: User must login again

## 🔧 Configuration

### Environment Variables
```env
# Redis URL
REDIS_URL=redis://localhost:6379

# Session settings (handled in code)
SESSION_EXPIRY=24h (24 hours)
```

### Redis Connection
- **Host**: localhost (default)
- **Port**: 6379 (default)
- **Auto-Reconnect**: Yes (exponential backoff)
- **Max Retries**: 10

## 📝 Implementation Details

### 1. Login Flow
```javascript
// authController.js - login()
1. Validate credentials
2. Check for existing session (students only)
3. If exists, terminate old session
4. Generate new JWT token
5. Store session in Redis with token
6. Return token to client
```

### 2. Authentication Middleware
```javascript
// auth.middleware.js - authenticateToken()
1. Extract JWT token from header
2. Verify JWT is valid
3. For students: Check session exists in Redis
4. For students: Verify token matches active session
5. Update last activity timestamp
6. Allow request to proceed
```

### 3. Logout Flow
```javascript
// authController.js - logout()
1. Get userId from authenticated request
2. Remove session from Redis
3. Return success
```

## 🎯 Usage Examples

### Example 1: Normal Student Workflow
```javascript
// 1. Student logs in
POST /api/auth/login
{
  "email": "student@test.com",
  "password": "student123",
  "role": "student"
}
→ Returns: { token, sessionId, user }

// 2. Frontend stores token and uses it
Authorization: Bearer <token>

// 3. All API calls validated
GET /api/exams/all
→ ✅ Session valid, request proceeds

// 4. Student logs out
POST /api/auth/logout
→ Session removed from Redis
```

### Example 2: Concurrent Login Prevention
```javascript
// Device A: Student already logged in
GET /api/exams/all (Token A)
→ ✅ Works fine

// Device B: Student logs in again
POST /api/auth/login (same student)
→ Old session (Token A) terminated
→ New session (Token B) created

// Device A: Tries to access dashboard
GET /api/exams/all (Token A)
→ ❌ Error: "Your account is being accessed from another location"

// Device B: Works normally
GET /api/exams/all (Token B)
→ ✅ Works fine
```

### Example 3: Session Expiration
```javascript
// Login and get token
POST /api/auth/login
→ Session stored in Redis (24hr expiry)

// ... 25 hours pass ...

// Try to access protected route
GET /api/exams/all
→ ❌ Error: "Session expired. Please login again."
```

## 🔐 Security Features

1. **Token Matching**: Every request validates token matches active session
2. **IP Tracking**: Stores IP address of login for audit trail
3. **User Agent Tracking**: Stores device/browser info
4. **Activity Monitoring**: Updates last activity on every API call
5. **Auto-Expiration**: Sessions auto-expire after 24 hours
6. **Force Logout**: Users can manually terminate their session

## 🚀 Setup Instructions

### 1. Install Redis (Windows)
```bash
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

### 2. Start Redis Server
```bash
# Windows
redis-server

# Or as Windows Service
net start Redis
```

### 3. Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

### 4. Start Backend Server
```bash
npm start
```

You should see:
```
✅ Redis connected successfully
✅ MongoDB connected
Server is running on http://localhost:3000
```

## 🧪 Testing

### Test 1: Single Session
```bash
# 1. Login as student
POST /api/auth/login
{ "email": "student@test.com", "password": "student123", "role": "student" }

# 2. Check session status
GET /api/sessions/status
→ Should show active session

# 3. Access protected route
GET /api/exams/all
→ Should work ✅
```

### Test 2: Concurrent Login Prevention
```bash
# 1. Login from "Device A" (save Token A)
POST /api/auth/login
→ Token A

# 2. Login again from "Device B" (same student)
POST /api/auth/login
→ Token B (Token A session terminated)

# 3. Try using Token A
GET /api/exams/all (Authorization: Bearer Token_A)
→ Error: CONCURRENT_SESSION_DETECTED ❌

# 4. Use Token B
GET /api/exams/all (Authorization: Bearer Token_B)
→ Works ✅
```

### Test 3: Session Expiration
```bash
# 1. Login and get token
POST /api/auth/login

# 2. Wait for Redis TTL to expire (or manually delete)
redis-cli DEL session:<userId>

# 3. Try to access protected route
GET /api/exams/all
→ Error: SESSION_EXPIRED ❌
```

## 📊 Redis Commands (For Debugging)

```bash
# View all sessions
redis-cli KEYS "session:*"

# View specific session
redis-cli GET "session:<userId>"

# Delete specific session (force logout)
redis-cli DEL "session:<userId>"

# Check TTL (time to live)
redis-cli TTL "session:<userId>"

# View all sessions with details
redis-cli --scan --pattern "session:*" | xargs -L1 redis-cli GET
```

## ⚠️ Important Notes

1. **Student-Only Enforcement**: Only students are strictly limited to one session. Teachers can have multiple sessions for convenience.

2. **Session Hijacking Prevention**: Each API call validates the token matches the stored session, preventing token theft/reuse.

3. **Graceful Degradation**: If Redis fails, the system logs errors but doesn't block requests (fallback to JWT-only validation).

4. **Frontend Integration**: Frontend should handle `SESSION_EXPIRED` and `CONCURRENT_SESSION_DETECTED` errors by redirecting to login.

5. **Redis Persistence**: Consider enabling Redis persistence (RDB/AOF) in production to survive server restarts.

## 🎉 Benefits

✅ **Prevents Account Sharing**: Students can't share login credentials
✅ **Real-time Enforcement**: Concurrent logins detected immediately
✅ **Audit Trail**: Track login times, IP addresses, and activity
✅ **Scalable**: Redis handles thousands of concurrent sessions
✅ **Secure**: Token validation on every request
✅ **User-Friendly**: Clear error messages for users

## 🔄 Migration from Old System

No migration needed! The session system is:
- **Backward Compatible**: Existing JWT tokens still work
- **Additive**: New session layer on top of JWT
- **Transparent**: Frontend doesn't need changes (except error handling)

Simply restart the backend with Redis running, and session management is active!

