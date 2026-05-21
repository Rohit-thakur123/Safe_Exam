# Test the Verify Exam Link Endpoint

You can test this endpoint using curl or Postman:

## Using curl (Windows CMD):

```cmd
curl -X POST http://localhost:3000/api/seb/verify-exam-link ^
  -H "Content-Type: application/json" ^
  -d "{\"examId\":\"68e0cc6a529f8bdf20e594e0\",\"studentId\":\"68e0199aaf8e27f86bd04348\",\"token\":\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiZXhhbS1hY2Nlc3MiLCJleGFtSWQiOiI2OGUwY2M2YTUyOWY4YmRmMjBlNTk0ZTAiLCJzdHVkZW50SWQiOiI2OGUwMTk5YWFmOGUyN2Y4NmJkMDQzNDgiLCJwdXJwb3NlIjoiZXhhbS12ZXJpZmljYXRpb24iLCJpYXQiOjE3NTk1NjI4NTgsImV4cCI6MTc1OTY1Mjg1OH0.Vsad_ik2cKlMhB-OAy4LEn_WVbn7P4kjNOHOsOOHSiU\"}"
```

## Expected Response:

### If token is valid:
```json
{
  "success": true,
  "message": "Exam eligibility verified successfully",
  "data": {
    "canAttempt": true,
    "exam": { ... },
    "student": { ... }
  }
}
```

### If token mismatch (403):
```json
{
  "success": false,
  "error": "Token does not match exam or student",
  "code": "TOKEN_MISMATCH"
}
```

## Check Backend Logs

After running the test, check your backend console. You should see:

```
🔍 Verify Exam Link Request: { examId: '68e0cc6a529f8bdf20e594e0', studentId: '68e0199aaf8e27f86bd04348', tokenLength: 234 }
✅ Token decoded: { tokenExamId: '...', tokenStudentId: '...', requestExamId: '...', requestStudentId: '...' }
```

If you see:
```
❌ Token mismatch: { ... }
```

This means the IDs in the token don't match the IDs in the request. This could happen if:
1. The email was generated with different IDs
2. The frontend is sending the wrong studentId
3. There's a character encoding issue

## Debugging Steps:

1. **Check the token payload**: Decode the JWT at https://jwt.io/ and verify the examId and studentId match what's in the URL
2. **Check frontend studentId**: Make sure your frontend is getting the studentId from the logged-in user correctly
3. **Check the email link**: Verify the link in the email contains the correct examId

## Common Issues:

### Issue 1: Frontend not sending studentId
Your frontend might not be getting the studentId. It should be getting it from the currently logged-in user's context.

### Issue 2: CORS
If you're still getting 403 even with correct IDs, check CORS. Make sure `FRONTEND_URL` in your `.env` matches your frontend URL exactly (including port).

### Issue 3: Token expired
Check if the token has expired. The token in your error has:
- `iat`: 1759562858 (issued at)
- `exp`: 1759652858 (expires at)

Current timestamp needs to be between these values.

