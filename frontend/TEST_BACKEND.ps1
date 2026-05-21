# PowerShell Script to Test Backend Connectivity
# Run this to diagnose the backend issue

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Backend Connectivity Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend is running
Write-Host "Test 1: Checking if backend is running on port 3000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend is NOT running or not accessible!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   SOLUTION: Start your backend server first!" -ForegroundColor Yellow
    Write-Host "   Command: cd <backend-folder> && npm start" -ForegroundColor Cyan
    exit
}

Write-Host ""

# Test 2: Check verify-exam-link endpoint
Write-Host "Test 2: Testing /seb/verify-exam-link endpoint..." -ForegroundColor Yellow

$body = @{
    examId = "68e0cc6a529f8bdf20e594e0"
    studentId = "68e019aaaf8e27f86bd04348"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiZXhhbS1hY2Nlc3MiLCJleGFtSWQiOiI2OGUwY2M2YTUyOWY4YmRmMjBlNTk0ZTAiLCJzdHVkZW50SWQiOiI2OGUwMTk5YWFmOGUyN2Y4NmJkMDQzNDgiLCJwdXJwb3NlIjoiZXhhbS12ZXJpZmljYXRpb24iLCJpYXQiOjE3NTk1NjI4NTgsImV4cCI6MTc1OTY1Mjg1OH0.Vsad_ik2cKlMhB-OAy4LEn_WVbn7P4kjNOHOsOOHSiU"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/seb/verify-exam-link" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "✅ Endpoint is working!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Endpoint failed!" -ForegroundColor Red
    Write-Host "   Status Code: $statusCode" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get error response body
    try {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Backend Error Response:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Gray
    } catch {
        # Could not read response body
    }
    
    Write-Host ""
    Write-Host "Common Issues:" -ForegroundColor Yellow
    
    if ($statusCode -eq 404) {
        Write-Host "   404 Not Found: Route /seb/verify-exam-link does not exist" -ForegroundColor Cyan
        Write-Host "   SOLUTION: Backend needs to implement this route" -ForegroundColor Yellow
    } elseif ($statusCode -eq 500) {
        Write-Host "   500 Server Error: Backend logic error" -ForegroundColor Cyan
        Write-Host "   SOLUTION: Check backend logs for error details" -ForegroundColor Yellow
    } elseif ($statusCode -eq 401) {
        Write-Host "   401 Unauthorized: Token validation failed" -ForegroundColor Cyan
        Write-Host "   SOLUTION: Check JWT secret or token format" -ForegroundColor Yellow
    } elseif ($statusCode -eq 0) {
        Write-Host "   CORS Error: Backend not allowing frontend origin" -ForegroundColor Cyan
        Write-Host "   SOLUTION: Add CORS middleware allowing http://localhost:5173" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Share the above results with your backend team!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 For detailed documentation, see:" -ForegroundColor Cyan
Write-Host "   - EXAM_LINK_VERIFICATION_FLOW.md" -ForegroundColor Gray
Write-Host "   - EXAM_VERIFICATION_TROUBLESHOOTING.md" -ForegroundColor Gray
