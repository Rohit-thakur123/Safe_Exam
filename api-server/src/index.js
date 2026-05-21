import 'dotenv/config';
import express from 'express';
import configureCors from './middlewares/cors.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';
import sebRoutes from './routes/seb.routes.js';
import logger from './utils/logger.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(configureCors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SEB Config Generator API Server',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/seb', sebRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SEB Configuration API Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      generateConfig: 'POST /api/seb/generate-seb-config',
      verifyExamLink: 'POST /api/seb/verify-exam-link',
      generateExamLinks: 'POST /api/seb/generate-exam-links'
    }
  });
});

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`🚀 SEB Config API Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Primary Frontend: ${process.env.PRIMARY_FRONTEND_URL || 'http://localhost:5173'}`);
  logger.info(`SEB Frontend: ${process.env.SEB_FRONTEND_URL || 'http://localhost:5174'}`);
  logger.info(`Backend API: ${process.env.BACKEND_API_URL || 'http://localhost:3000'}`);
});

