import { verifyAccessToken } from '../utils/tokenUtils.js';
import User from '../models/User/user.js';
import Admin from '../models/User/admin.js';
import { sessionManager } from '../config/sessionStore.js';

export const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token is required'
            });
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Get user from database
        const user = decoded.role === 'admin'
            ? await Admin.findById(decoded.userId).select('-password')
            : await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        // NEW: Validate session for students (strict enforcement)
        if (user.role === 'student') {
            const userId = user._id.toString();
            const activeSession = await sessionManager.getActiveSession(userId);

            if (!activeSession) {
                return res.status(401).json({
                    success: false,
                    error: 'Session expired. Please login again.',
                    code: 'SESSION_EXPIRED'
                });
            }

            // Verify the current token matches the active session
            if (activeSession.token !== token) {
                return res.status(403).json({
                    success: false,
                    error: 'Your account is being accessed from another location. This session has been terminated.',
                    code: 'CONCURRENT_SESSION_DETECTED'
                });
            }

            // Update session activity
            await sessionManager.updateSessionActivity(userId);
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: error.message || 'Invalid or expired token'
        });
    }
};

export const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
};
