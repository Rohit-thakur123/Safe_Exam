# PowerShell Script to Test Login Endpoint

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Login Endpoint Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend is running
Write-Host "Test 1: Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   SOLUTION: Start your backend server!" -ForegroundColor Yellow
    Write-Host "   Command: cd <backend-folder> && npm start" -ForegroundColor Cyan
    exit
}

Write-Host ""

# Test 2: Check /auth/login endpoint
Write-Host "Test 2: Testing POST /auth/login endpoint..." -ForegroundColor Yellow

$loginBody = @{
    email = "test@example.com"
    password = "password123"
    role = "student"
} | ConvertTo-Json

Write-Host "Request:" -ForegroundColor Cyan
Write-Host "URL: http://localhost:3000/auth/login" -ForegroundColor Gray
Write-Host "Method: POST" -ForegroundColor Gray
Write-Host "Body: $loginBody" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "✅ Login endpoint is working!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""
    Write-Host "✅ Login route is properly configured!" -ForegroundColor Green
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Login endpoint failed!" -ForegroundColor Red
    Write-Host "   Status Code: $statusCode" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get error response body
    try {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Backend Response:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Gray
    } catch {
        # Could not read response body
    }
    
    Write-Host ""
    Write-Host "Diagnosis:" -ForegroundColor Yellow
    
    if ($statusCode -eq 404) {
        Write-Host "   404 Not Found" -ForegroundColor Red
        Write-Host ""
        Write-Host "   This means the route /auth/login does NOT exist in backend!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   Backend team must:" -ForegroundColor Yellow
        Write-Host "   1. Create routes/auth.routes.js file" -ForegroundColor White
        Write-Host "   2. Add: router.post('/login', controller)" -ForegroundColor White
        Write-Host "   3. Register in server.js with app.use" -ForegroundColor White
        Write-Host ""
        Write-Host "   See LOGIN_ERROR_404_DIAGNOSIS.md for complete implementation" -ForegroundColor Cyan
        
    } elseif ($statusCode -eq 401) {
        Write-Host "   401 Unauthorized" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Route exists but credentials are invalid" -ForegroundColor Cyan
        Write-Host "   Try registering a user first or check the credentials" -ForegroundColor White
        
    } elseif ($statusCode -eq 500) {
        Write-Host "   500 Server Error" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Route exists but backend logic has an error" -ForegroundColor Cyan
        Write-Host "   Check backend console logs for error details" -ForegroundColor White
        
    } elseif ($statusCode -eq 400) {
        Write-Host "   400 Bad Request" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Route exists but request format is incorrect" -ForegroundColor Cyan
        Write-Host "   Backend expects: email, password, role" -ForegroundColor White
        
    } else {
        Write-Host "   Unknown error with status code: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Check /auth/register endpoint
Write-Host "Test 3: Testing POST /auth/register endpoint..." -ForegroundColor Yellow

$registerBody = @{
    name = "Test User"
    email = "newuser@example.com"
    password = "password123"
    role = "student"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json" `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "✅ Register endpoint is working!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 404) {
        Write-Host "Register endpoint NOT found (404)" -ForegroundColor Red
    } elseif ($statusCode -eq 400) {
        Write-Host "Register endpoint exists but validation failed" -ForegroundColor Yellow
    } else {
        Write-Host "Register endpoint returned: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Green
Write-Host "   - If you see 404 errors: Auth routes are NOT implemented" -ForegroundColor White
Write-Host "   - If you see 401 errors: Routes exist, but credentials invalid" -ForegroundColor White
Write-Host "   - If you see 500 errors: Routes exist, but backend has bugs" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed fix, see:" -ForegroundColor Cyan
Write-Host "   - LOGIN_ERROR_404_DIAGNOSIS.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Share this output with your backend team!" -ForegroundColor Green
