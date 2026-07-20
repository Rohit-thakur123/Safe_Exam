import express from 'express';
import connectDb from "./db.js";
import dotenv from 'dotenv';
import routes from './routes/index.js';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';

import descriptiveRoutes from "./routes/descriptive.routes.js";


dotenv.config();

const app = express();
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
];

// Phase 7: Removed credential logging (MONGO_URI, SMTP_USER exposed in plain text)


connectDb();

// CORS configuration - MUST come before other middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
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

// Request logger — method and path only; body is intentionally omitted to
// prevent JWT tokens and student answers appearing in plain-text server logs.
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    }
    next();
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// Import and use routes.
// The primary teacher frontend calls without a prefix, the SEB student
// frontend calls with an `/api` prefix — mount both to the same router so
// neither side has to change its request paths.
app.use('/', routes);
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

//for descriptive part
app.use("/api/descriptive", descriptiveRoutes);

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
