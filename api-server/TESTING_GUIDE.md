# Testing Guide

This guide provides instructions for testing the SEB Configuration API Server.

## Prerequisites

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env`
   - Update the values as needed

3. **Start the server**
   ```bash
   npm run dev
   ```

---

## Test 1: Health Check

Verify the server is running.

### Command

```bash
curl http://localhost:4000/health
```

### Expected Response

```json
{
  "status": "ok",
  "service": "SEB Config Generator API Server",
  "timestamp": "2025-10-04T10:30:00.000Z",
  "environment": "development"
}
```

---

## Test 2: Generate SEB Configuration (Mock)

Test SEB configuration generation with mock data.

### Prerequisites

For this test to work, you need:
1. A running main backend at `http://localhost:3000`
2. The backend should have the `/api/seb/verify-exam-link` endpoint implemented

### Mock Backend Response

If your backend is not ready, you can mock it using a tool like `json-server` or create a simple Express mock server.

**Mock Server (mock-backend.js):**

```javascript
import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/seb/verify-exam-link', (req, res) => {
  const { examId, studentId, token } = req.body;
  
  // Simulate validation
  res.json({
    success: true,
    message: 'Exam is available',
    data: {
      examId,
      studentId,
      exam: {
        title: 'Mathematics Final Exam',
        description: 'Final exam covering chapters 1-10',
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        startDate: '2025-10-05T09:00:00.000Z',
        endDate: '2025-10-05T11:00:00.000Z',
        questionsCount: 50
      },
      student: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      canAttempt: true,
      attemptStatus: {
        hasAttempted: false,
        previousAttempts: 0,
        allowRetakes: false
      }
    }
  });
});

app.listen(3000, () => {
  console.log('Mock backend running on port 3000');
});
```

Run the mock server:
```bash
node mock-backend.js
```

### Test Request

```bash
curl -X POST http://localhost:4000/api/seb/generate-seb-config \
  -H "Content-Type: application/json" \
  -d '{
    "examId": "507f1f77bcf86cd799439011",
    "studentId": "507f1f77bcf86cd799439012",
    "token": "mock-exam-token",
    "backendUrl": "http://localhost:3000",
    "sebFrontendUrl": "http://localhost:5174"
  }' \
  --output test-exam.seb
```

### Expected Response

- File `test-exam.seb` should be downloaded
- File should be valid XML
- File should contain the exam URL with session token

### Verify the File

```bash
# View file content (first 50 lines)
head -n 50 test-exam.seb

# Or on Windows PowerShell
Get-Content test-exam.seb -Head 50
```

---

## Test 3: Error Handling - Missing Fields

Test error handling when required fields are missing.

### Command

```bash
curl -X POST http://localhost:4000/api/seb/generate-seb-config \
  -H "Content-Type: application/json" \
  -d '{
    "examId": "507f1f77bcf86cd799439011"
  }'
```

### Expected Response

```json
{
  "success": false,
  "error": "Missing required fields: studentId, token, backendUrl, sebFrontendUrl"
}
```

---

## Test 4: Error Handling - Backend Unreachable

Test error handling when backend is unreachable.

### Command

```bash
curl -X POST http://localhost:4000/api/seb/generate-seb-config \
  -H "Content-Type: application/json" \
  -d '{
    "examId": "507f1f77bcf86cd799439011",
    "studentId": "507f1f77bcf86cd799439012",
    "token": "mock-exam-token",
    "backendUrl": "http://localhost:9999",
    "sebFrontendUrl": "http://localhost:5174"
  }'
```

### Expected Response

```json
{
  "success": false,
  "error": "Unable to connect to backend server"
}
```

---

## Test 5: Error Handling - Invalid Token

Test error handling when backend returns invalid token error.

### Mock Backend Response

Modify the mock server to return an error:

```javascript
app.post('/api/seb/verify-exam-link', (req, res) => {
  res.status(403).json({
    success: false,
    error: 'Invalid or expired exam access token'
  });
});
```

### Command

```bash
curl -X POST http://localhost:4000/api/seb/generate-seb-config \
  -H "Content-Type: application/json" \
  -d '{
    "examId": "507f1f77bcf86cd799439011",
    "studentId": "507f1f77bcf86cd799439012",
    "token": "invalid-token",
    "backendUrl": "http://localhost:3000",
    "sebFrontendUrl": "http://localhost:5174"
  }'
```

### Expected Response

```json
{
  "success": false,
  "error": "Invalid or expired exam access token"
}
```

---

## Test 6: CORS

Test CORS headers.

### Command

```bash
curl -X OPTIONS http://localhost:4000/api/seb/generate-seb-config \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Expected Headers

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Test 7: Frontend Integration Test

Test from a frontend application.

### HTML Test Page

Create `test-frontend.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>SEB Config Test</title>
</head>
<body>
    <h1>SEB Configuration Test</h1>
    <button onclick="downloadConfig()">Download SEB Config</button>
    <div id="status"></div>

    <script>
        async function downloadConfig() {
            const status = document.getElementById('status');
            status.textContent = 'Generating...';

            try {
                const response = await fetch('http://localhost:4000/api/seb/generate-seb-config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        examId: '507f1f77bcf86cd799439011',
                        studentId: '507f1f77bcf86cd799439012',
                        token: 'mock-exam-token',
                        backendUrl: 'http://localhost:3000',
                        sebFrontendUrl: 'http://localhost:5174'
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error);
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `test-exam-${Date.now()}.seb`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                status.textContent = 'Downloaded successfully!';
            } catch (error) {
                status.textContent = `Error: ${error.message}`;
                console.error('Error:', error);
            }
        }
    </script>
</body>
</html>
```

Open in browser: `file:///path/to/test-frontend.html`

---

## Test 8: Load Testing

Test server performance under load (optional).

### Using Apache Bench

```bash
ab -n 100 -c 10 -p request.json -T application/json http://localhost:4000/api/seb/generate-seb-config
```

Where `request.json`:
```json
{
  "examId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "token": "mock-exam-token",
  "backendUrl": "http://localhost:3000",
  "sebFrontendUrl": "http://localhost:5174"
}
```

---

## Automated Test Suite (Optional)

Create automated tests using Jest or Mocha.

### Install Jest

```bash
npm install --save-dev jest supertest
```

### Test File (tests/api.test.js)

```javascript
import request from 'supertest';
import app from '../src/index.js';

describe('SEB Config API', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('POST /api/seb/generate-seb-config without fields should return 400', async () => {
    const response = await request(app)
      .post('/api/seb/generate-seb-config')
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

### Run Tests

```bash
npm test
```

---

## Troubleshooting

### Issue: "Cannot find module"

**Solution:**
```bash
npm install
```

### Issue: "Port already in use"

**Solution:**
Change PORT in `.env` file or kill the process using the port:

```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

### Issue: CORS errors

**Solution:**
- Add your frontend URL to `.env`:
  ```
  PRIMARY_FRONTEND_URL=http://your-frontend-url
  ```
- Restart the server

---

## Checklist

- [ ] Server starts without errors
- [ ] Health check returns 200
- [ ] SEB config generation works with valid data
- [ ] Error handling works for missing fields
- [ ] Error handling works for backend connection issues
- [ ] Error handling works for invalid tokens
- [ ] CORS headers are correct
- [ ] Frontend integration works
- [ ] Generated `.seb` file is valid XML
- [ ] Generated `.seb` file opens in SEB (if installed)

---

## Next Steps

1. Test with actual main backend
2. Test with actual exam data
3. Test with Safe Exam Browser installed
4. Deploy to staging environment
5. Conduct security audit
6. Set up monitoring and logging
7. Create backup and recovery plan

---

## Support

For issues or questions:
1. Check logs in console
2. Verify environment variables
3. Check network connectivity
4. Review API documentation
5. Contact development team
