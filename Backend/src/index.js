import express from 'express';
import connectDb from "./db.js";
import dotenv from 'dotenv';
import routes from './routes/index.js';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';

dotenv.config();

const app = express();


console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("SMTP_USER:", process.env.SMTP_USER);


connectDb();

// CORS configuration - MUST come before other middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Security middleware - Configure Helmet to work with CORS
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

app.use(compression()); // Compress responses
app.use(express.json());

// Request logger - logs all incoming requests
app.use((req, res, next) => {
    console.log(`\n📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Body:', JSON.stringify(req.body));
    next();
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// Import and use routes - NO /api prefix to match frontend requirements
app.use('/', routes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
