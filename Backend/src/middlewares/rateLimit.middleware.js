import rateLimit from 'express-rate-limit';

// General API rate limiter - 100 requests per 15 minutes for standard routes,
// with background exam sync routes (heartbeat, save-answers, report-violation) excluded
// to prevent HTTP 429 rate-limiting during active exam sessions.
export const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // Increased cap for active sessions
    skip: (req) => {
        const path = req.path || req.url || '';
        return (
            path.includes('/heartbeat') ||
            path.includes('/save-answers') ||
            path.includes('/report-violation') ||
            path.includes('/start-seb') ||
            path.includes('/submit-seb')
        );
    },
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});


// Login rate limiter - 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        error: 'Too many login attempts, please try again after 15 minutes.'
    },
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
});

// Registration rate limiter - 3 attempts per hour
export const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        error: 'Too many registration attempts, please try again after an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

