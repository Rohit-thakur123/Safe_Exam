# 🔐 SEB Configuration API Server

A standalone API server for generating Safe Exam Browser (SEB) configuration files for the Secure Exam System.

## 📋 Overview

This API server acts as a bridge between the primary frontend and the SEB frontend, generating secure `.seb` configuration files that launch Safe Exam Browser with proper security settings.

## 🎯 Key Features

- ✅ Generate `.seb` configuration files dynamically
- ✅ Validate exam eligibility with main backend
- ✅ Generate secure SEB session tokens (JWT)
- ✅ Configurable security settings
- ✅ CORS protection
- ✅ Comprehensive logging
- ✅ Error handling

## 🏗️ Architecture

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────┐
│  Primary         │         │  API Server      │         │  Main        │
│  Frontend        │────────>│  (SEB Config)    │<───────>│  Backend     │
│                  │         │                  │         │              │
└──────────────────┘         └──────────────────┘         └──────────────┘
                                      │
                                      │ Returns .seb file
                                      ▼
                             ┌──────────────────┐
                             │  Safe Exam       │
                             │  Browser (SEB)   │
                             └──────────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │  SEB Frontend    │
                             │  (Exam Interface)│
                             └──────────────────┘
```

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd api-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   PORT=4000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-here
   PRIMARY_FRONTEND_URL=http://localhost:5173
   SEB_FRONTEND_URL=http://localhost:5174
   BACKEND_API_URL=http://localhost:3000
   SEB_QUIT_PASSWORD=exam2024
   SEB_ALLOW_QUIT=false
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 📡 API Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "service": "SEB Config Generator API Server",
  "timestamp": "2025-10-04T10:30:00.000Z",
  "environment": "development"
}
```

---

### 2. Generate SEB Configuration

**Endpoint:** `POST /api/seb/generate-seb-config`

**Description:** Generates a `.seb` configuration file for a student to launch Safe Exam Browser.

**Request Body:**
```json
{
  "examId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "backendUrl": "https://api.yourexam.com",
  "sebFrontendUrl": "https://seb.yourexam.com"
}
```

**Request Fields:**
- `examId` (required): The exam ID (MongoDB ObjectId format)
- `studentId` (required): The student ID (MongoDB ObjectId format)
- `token` (required): Exam access token from email link
- `backendUrl` (required): Main backend API URL for validation
- `sebFrontendUrl` (required): SEB frontend URL where exam will load

**Success Response:**
- **Content-Type:** `application/seb`
- **Content-Disposition:** `attachment; filename="secure-exam-{examId}-{timestamp}.seb"`
- **Body:** XML configuration file

**Error Responses:**

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

// Cannot attempt exam
{
  "success": false,
  "error": "You cannot attempt this exam at this time"
}

// Backend connection error
{
  "success": false,
  "error": "Unable to connect to backend server"
}
```

---

### 3. Verify Exam Link

**Endpoint:** `POST /api/seb/verify-exam-link`

**Description:** Placeholder endpoint - should be implemented in main backend.

---

### 4. Generate Exam Links

**Endpoint:** `POST /api/seb/generate-exam-links`

**Description:** Placeholder endpoint - should be implemented in main backend.

---

## 🔐 Security Features

### 1. **JWT Token Security**
- Generates SEB session tokens with expiration
- Tokens include exam ID, student ID, and purpose
- Uses same JWT_SECRET as main backend

### 2. **URL Filtering**
- Restricts SEB to only access the exam frontend domain
- Blocks all other websites

### 3. **Browser Restrictions**
- Disables keyboard shortcuts (F1-F12, Alt+Tab, etc.)
- Blocks pop-ups and new windows
- Disables downloads and uploads
- Prevents screen capture

### 4. **CORS Protection**
- Only allows requests from configured frontend domains
- Validates origin on every request

### 5. **Input Validation**
- Validates all required fields
- Checks data formats
- Sanitizes XML output

---

## 🧪 Testing

### Using cURL

```bash
curl -X POST http://localhost:4000/api/seb/generate-seb-config \
  -H "Content-Type: application/json" \
  -d '{
    "examId": "507f1f77bcf86cd799439011",
    "studentId": "507f1f77bcf86cd799439012",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "backendUrl": "http://localhost:3000",
    "sebFrontendUrl": "http://localhost:5174"
  }' \
  --output test-exam.seb
```

### Using Postman

1. **Method:** POST
2. **URL:** `http://localhost:4000/api/seb/generate-seb-config`
3. **Headers:** 
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "examId": "507f1f77bcf86cd799439011",
     "studentId": "507f1f77bcf86cd799439012",
     "token": "your-exam-token",
     "backendUrl": "http://localhost:3000",
     "sebFrontendUrl": "http://localhost:5174"
   }
   ```
5. **Send & Save Response:** Choose "Save to file" option

### Using JavaScript (Frontend Integration)

```javascript
async function downloadSEBConfig(examId, studentId, token) {
  try {
    const response = await fetch('http://localhost:4000/api/seb/generate-seb-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        examId,
        studentId,
        token,
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
    a.download = `secure-exam-${examId}-${Date.now()}.seb`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading SEB config:', error);
    throw error;
  }
}
```

---

## 📂 Project Structure

```
api-server/
├── src/
│   ├── controllers/
│   │   └── sebController.js       # SEB configuration logic
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT authentication
│   │   ├── cors.middleware.js     # CORS configuration
│   │   └── errorHandler.middleware.js
│   ├── routes/
│   │   └── seb.routes.js          # API routes
│   ├── utils/
│   │   ├── logger.js              # Logging utility
│   │   ├── sebConfigGenerator.js  # XML config generator
│   │   ├── tokenUtils.js          # JWT token utilities
│   │   └── validators.js          # Input validation
│   ├── config.js                  # Legacy config (deprecated)
│   └── index.js                   # Main application
├── .env.example                   # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `4000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `JWT_SECRET` | JWT signing secret | - | **Yes** |
| `PRIMARY_FRONTEND_URL` | Primary frontend URL | `http://localhost:5173` | No |
| `SEB_FRONTEND_URL` | SEB frontend URL | `http://localhost:5174` | No |
| `BACKEND_API_URL` | Main backend URL | `http://localhost:3000` | No |
| `SEB_QUIT_PASSWORD` | SEB quit password | `exam2024` | No |
| `SEB_ALLOW_QUIT` | Allow quit with password | `false` | No |

### SEB Configuration Options

The generated `.seb` file includes:

- **Full-screen mode** (no windowed mode)
- **No browser toolbar** or reload button
- **Disabled keyboard shortcuts** (F1-F12, Alt+Tab, etc.)
- **URL filtering** (only exam domain allowed)
- **No downloads/uploads**
- **No audio/video capture**
- **No screen sharing**
- **Cookie clearing** on start and end
- **Browser exam key** for additional security

---

## 📊 Logging

The server logs the following information:

```
[2025-10-04T10:30:15.000Z] INFO: SEB config request received for Exam: 507f..., Student: 507f...
[2025-10-04T10:30:16.000Z] INFO: Generated SEB session token with 150 minutes validity
[2025-10-04T10:30:16.000Z] INFO: SEB config generated successfully - File: secure-exam-507f...-1728086416000.seb
```

Logs include:
- Timestamp
- Log level (INFO, WARN, ERROR, DEBUG)
- Message
- Context data

---

## 🚀 Deployment

### Option 1: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 4000

CMD ["node", "src/index.js"]
```

**Build and run:**
```bash
docker build -t seb-config-api .
docker run -p 4000:4000 --env-file .env seb-config-api
```

---

### Option 2: PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start the server
pm2 start src/index.js --name seb-config-api

# View logs
pm2 logs seb-config-api

# Monitor
pm2 monit
```

---

### Option 3: systemd Service

Create `/etc/systemd/system/seb-config-api.service`:

```ini
[Unit]
Description=SEB Configuration API Server
After=network.target

[Service]
Type=simple
User=nodeuser
WorkingDirectory=/opt/seb-config-api
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Start the service:**
```bash
sudo systemctl start seb-config-api
sudo systemctl enable seb-config-api
```

---

## 🔄 Integration with Main Backend

The API server validates exam eligibility by calling the main backend:

**Request to Main Backend:**
```http
POST {backendUrl}/api/seb/verify-exam-link
Content-Type: application/json

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

## 🐛 Troubleshooting

### Issue: "Unable to connect to backend server"

**Solution:**
- Check if main backend is running
- Verify `BACKEND_API_URL` in `.env`
- Check network connectivity

---

### Issue: "Invalid or expired exam access token"

**Solution:**
- Verify token is correct
- Check token expiration
- Ensure `JWT_SECRET` matches main backend

---

### Issue: "Not allowed by CORS"

**Solution:**
- Add frontend URL to `PRIMARY_FRONTEND_URL` or `SEB_FRONTEND_URL`
- Check CORS middleware configuration
- Verify request origin

---

### Issue: ".seb file doesn't launch SEB"

**Solution:**
- Ensure Safe Exam Browser is installed
- Check `.seb` file is not corrupted
- Verify start URL is correct
- Check SEB logs for errors

---

## 📝 Development

### Adding New Features

1. **Create new route** in `src/routes/`
2. **Add controller logic** in `src/controllers/`
3. **Add middleware** if needed in `src/middlewares/`
4. **Update tests** and documentation

### Code Style

- Use ES6+ features
- Follow async/await pattern
- Add JSDoc comments
- Use descriptive variable names
- Keep functions small and focused

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

---

## 📄 License

ISC

---

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Contact the backend team
- Check the documentation

---

## ✅ Implementation Checklist

- [x] Set up Node.js/Express server
- [x] Install required dependencies
- [x] Implement JWT token generation
- [x] Implement SEB XML configuration generation
- [x] Add backend validation integration
- [x] Implement error handling
- [x] Add logging
- [x] Configure CORS
- [x] Create environment variables template
- [x] Write documentation
- [ ] Test with sample data
- [ ] Deploy to production server
- [ ] Configure SSL/TLS
- [ ] Set up monitoring

---

**Happy Coding! 🚀**
