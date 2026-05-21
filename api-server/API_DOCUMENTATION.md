# API Documentation

## Base URL

```
http://localhost:4000
```

---

## Authentication

Some endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Health Check

Check if the API server is running.

**Endpoint:** `GET /health`

**Authentication:** None

**Response:**

```json
{
  "status": "ok",
  "service": "SEB Config Generator API Server",
  "timestamp": "2025-10-04T10:30:00.000Z",
  "environment": "development"
}
```

**Status Codes:**
- `200 OK`: Server is running

---

### 2. Generate SEB Configuration

Generate a Safe Exam Browser configuration file.

**Endpoint:** `POST /api/seb/generate-seb-config`

**Authentication:** None (token validation through backend)

**Request Body:**

```json
{
  "examId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "backendUrl": "http://localhost:3000",
  "sebFrontendUrl": "http://localhost:5174"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `examId` | String | Yes | MongoDB ObjectId of the exam |
| `studentId` | String | Yes | MongoDB ObjectId of the student |
| `token` | String | Yes | Exam access token from email |
| `backendUrl` | String | Yes | Main backend API URL |
| `sebFrontendUrl` | String | Yes | SEB frontend URL |

**Success Response:**

**Content-Type:** `application/seb`

**Content-Disposition:** `attachment; filename="secure-exam-{examId}-{timestamp}.seb"`

**Body:** XML configuration file (binary)

**Status Codes:**
- `200 OK`: Configuration generated successfully
- `400 Bad Request`: Missing required fields
- `403 Forbidden`: Cannot attempt exam or invalid token
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Backend connection failed

**Error Response:**

```json
{
  "success": false,
  "error": "Error message describing the issue"
}
```

**Example Errors:**

```json
// Missing fields
{
  "success": false,
  "error": "Missing required fields: examId, token"
}

// Invalid token
{
  "success": false,
  "error": "Invalid or expired exam access token"
}

// Cannot attempt
{
  "success": false,
  "error": "You cannot attempt this exam at this time"
}

// Backend unreachable
{
  "success": false,
  "error": "Unable to connect to backend server"
}
```

---

### 3. Verify Exam Link

Verify an exam link (placeholder - implement in main backend).

**Endpoint:** `POST /api/seb/verify-exam-link`

**Authentication:** None

**Status:** `501 Not Implemented`

---

### 4. Generate Exam Links

Generate exam links for students (placeholder - implement in main backend).

**Endpoint:** `POST /api/seb/generate-exam-links`

**Authentication:** Required (Bearer token)

**Authorization:** Teacher role only

**Status:** `501 Not Implemented`

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Missing or invalid authentication |
| `403` | Forbidden - Insufficient permissions or cannot attempt |
| `404` | Not Found - Endpoint doesn't exist |
| `500` | Internal Server Error |
| `501` | Not Implemented |
| `503` | Service Unavailable - Backend unreachable |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting in production.

---

## CORS

Allowed origins:
- Primary Frontend: `http://localhost:5173`
- SEB Frontend: `http://localhost:5174`
- Main Backend: `http://localhost:3000`

Configure in `.env` file.

---

## Examples

### cURL Example

```bash
curl -X POST http://localhost:4000/api/seb/generate-seb-config \
  -H "Content-Type: application/json" \
  -d '{
    "examId": "507f1f77bcf86cd799439011",
    "studentId": "507f1f77bcf86cd799439012",
    "token": "your-exam-token",
    "backendUrl": "http://localhost:3000",
    "sebFrontendUrl": "http://localhost:5174"
  }' \
  --output exam-config.seb
```

### JavaScript Fetch Example

```javascript
const response = await fetch('http://localhost:4000/api/seb/generate-seb-config', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    examId: '507f1f77bcf86cd799439011',
    studentId: '507f1f77bcf86cd799439012',
    token: 'your-exam-token',
    backendUrl: 'http://localhost:3000',
    sebFrontendUrl: 'http://localhost:5174'
  })
});

if (response.ok) {
  const blob = await response.blob();
  // Download the file
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exam-config.seb';
  a.click();
}
```

### Axios Example

```javascript
import axios from 'axios';

const response = await axios.post(
  'http://localhost:4000/api/seb/generate-seb-config',
  {
    examId: '507f1f77bcf86cd799439011',
    studentId: '507f1f77bcf86cd799439012',
    token: 'your-exam-token',
    backendUrl: 'http://localhost:3000',
    sebFrontendUrl: 'http://localhost:5174'
  },
  {
    responseType: 'blob'
  }
);

// Download the file
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', 'exam-config.seb');
document.body.appendChild(link);
link.click();
link.remove();
```

---

## Backend Integration

The API server communicates with the main backend to validate exam eligibility.

### Backend Endpoint Required

**Endpoint:** `POST {backendUrl}/api/seb/verify-exam-link`

**Request:**
```json
{
  "examId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Exam is available",
  "data": {
    "examId": "507f1f77bcf86cd799439011",
    "studentId": "507f1f77bcf86cd799439012",
    "exam": {
      "title": "Mathematics Final Exam",
      "description": "Final exam covering chapters 1-10",
      "duration": 120,
      "totalMarks": 100,
      "passingMarks": 40,
      "startDate": "2025-10-05T09:00:00.000Z",
      "endDate": "2025-10-05T11:00:00.000Z",
      "questionsCount": 50
    },
    "student": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "canAttempt": true,
    "attemptStatus": {
      "hasAttempted": false,
      "previousAttempts": 0,
      "allowRetakes": false
    }
  }
}
```

---

## Changelog

### Version 1.0.0 (2025-10-04)

- Initial release
- SEB configuration generation
- Backend validation integration
- JWT token generation
- CORS support
- Error handling and logging
