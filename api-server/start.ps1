# Quick Start Script for Windows PowerShell

Write-Host "🚀 Starting SEB Configuration API Server..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file. Please update JWT_SECRET before production use!" -ForegroundColor Green
    Write-Host ""
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check if dependencies are installed
$packagesToCheck = @("express", "jsonwebtoken", "axios", "cors", "dotenv")
$missingPackages = @()

foreach ($package in $packagesToCheck) {
    if (-not (Test-Path "node_modules\$package")) {
        $missingPackages += $package
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Host "📦 Installing missing dependencies: $($missingPackages -join ', ')" -ForegroundColor Yellow
    npm install $missingPackages
    Write-Host ""
}

Write-Host "✅ All dependencies installed!" -ForegroundColor Green
Write-Host ""
Write-Host "📡 Server Information:" -ForegroundColor Cyan
Write-Host "   - URL: http://localhost:4000" -ForegroundColor White
Write-Host "   - Health Check: http://localhost:4000/health" -ForegroundColor White
Write-Host "   - Environment: development" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Testing Tools:" -ForegroundColor Cyan
Write-Host "   - Mock Backend: Run 'node mock-backend.js' in another terminal" -ForegroundColor White
Write-Host "   - Test UI: Open 'test-interface.html' in your browser" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - README.md - Main documentation" -ForegroundColor White
Write-Host "   - API_DOCUMENTATION.md - API reference" -ForegroundColor White
Write-Host "   - TESTING_GUIDE.md - Testing instructions" -ForegroundColor White
Write-Host "   - IMPLEMENTATION_COMPLETE.md - Implementation summary" -ForegroundColor White
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Start the server
npm run dev
