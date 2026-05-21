#!/bin/bash

# Quick Start Script for Linux/macOS

echo "🚀 Starting SEB Configuration API Server..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update JWT_SECRET before production use!"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if dependencies are installed
PACKAGES=("express" "jsonwebtoken" "axios" "cors" "dotenv")
MISSING=()

for package in "${PACKAGES[@]}"; do
    if [ ! -d "node_modules/$package" ]; then
        MISSING+=("$package")
    fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
    echo "📦 Installing missing dependencies: ${MISSING[*]}"
    npm install "${MISSING[@]}"
    echo ""
fi

echo "✅ All dependencies installed!"
echo ""
echo "📡 Server Information:"
echo "   - URL: http://localhost:4000"
echo "   - Health Check: http://localhost:4000/health"
echo "   - Environment: development"
echo ""
echo "🧪 Testing Tools:"
echo "   - Mock Backend: Run 'node mock-backend.js' in another terminal"
echo "   - Test UI: Open 'test-interface.html' in your browser"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Main documentation"
echo "   - API_DOCUMENTATION.md - API reference"
echo "   - TESTING_GUIDE.md - Testing instructions"
echo "   - IMPLEMENTATION_COMPLETE.md - Implementation summary"
echo ""
echo "Starting server..."
echo "Press Ctrl+C to stop"
echo ""
echo "----------------------------------------"
echo ""

# Start the server
npm run dev
