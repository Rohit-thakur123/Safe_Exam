import { sessionManager } from '../config/redis.js';

// Middleware to check for concurrent sessions
export const validateSession = async (req, res, next) => {
    try {
        // Skip session validation for certain routes
        const skipRoutes = ['/auth/login', '/auth/register', '/auth/logout'];
        if (skipRoutes.some(route => req.path.includes(route))) {
            return next();
        }

        // Only validate sessions for authenticated users
        if (!req.user) {
            return next();
        }

        const userId = req.user._id.toString();
        const currentSessionToken = req.headers['x-session-id'] || req.headers['authorization']?.split(' ')[1];

        // Get active session from Redis
        const activeSession = await sessionManager.getActiveSession(userId);

        if (!activeSession) {
            // No active session found - user needs to login again
            return res.status(401).json({
                success: false,
                error: 'Session expired. Please login again.',
                code: 'SESSION_EXPIRED'
            });
        }

        // Verify the session token matches
        if (activeSession.token !== currentSessionToken) {
            // Different session detected - concurrent login
            return res.status(403).json({
                success: false,
                error: 'Your account is being accessed from another location. You have been logged out.',
                code: 'CONCURRENT_SESSION_DETECTED'
            });
        }

        // Update last activity time
        await sessionManager.updateSessionActivity(userId);

        next();
    } catch (error) {
        console.error('Session validation error:', error);
        // Don't block request if Redis fails
        next();
    }
};

// Middleware specifically for students to prevent concurrent access
export const preventConcurrentStudentAccess = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return next();
        }

        const userId = req.user._id.toString();
        const currentSessionToken = req.headers['x-session-id'] || req.headers['authorization']?.split(' ')[1];

        const activeSession = await sessionManager.getActiveSession(userId);

        if (activeSession && activeSession.token !== currentSessionToken) {
            // Another session is active
            return res.status(403).json({
                success: false,
                error: 'Another session is already active for your account. Only one active session is allowed.',
                code: 'CONCURRENT_SESSION_BLOCKED',
                activeSession: {
                    loginTime: activeSession.loginTime,
                    ipAddress: activeSession.ipAddress
                }
            });
        }

        next();
    } catch (error) {
        console.error('Concurrent access check error:', error);
        next();
    }
};

