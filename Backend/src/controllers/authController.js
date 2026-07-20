import User from '../models/User/user.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils.js';
import { sessionManager } from '../config/sessionStore.js';

// Register new user
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Validate role
        if (!['teacher', 'student'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be teacher or student'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already exists'
            });
        }

        // Create new user
        const user = new User({
            name,
            email: email.toLowerCase(),
            password,
            role
        });

        await user.save();

        // Return user without password
        res.status(201).json({
            user: {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: error.message || 'Server error during registration'
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        console.log('Login attempt:', { email: req.body.email, role: req.body.role });

        const { email, password, role } = req.body;

        // Validate required fields
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        // Verify role matches
        if (user.role !== role) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check for existing active session (especially for students)
        const userId = user._id.toString();
        const existingSession = await sessionManager.getActiveSession(userId);

        if (existingSession && user.role === 'student') {
            await sessionManager.removeSession(userId);
        }

        // Generate tokens
        const token = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store session in Redis/Memory
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        const userAgent = req.headers['user-agent'];

        const sessionData = {
            userId: user._id.toString(),
            token,
            loginTime: new Date().toISOString(),
            ipAddress,
            userAgent
        };

        await sessionManager.setActiveSession(userId, sessionData);

        res.status(200).json({
            token,
            refreshToken,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: error.message || 'Server error during login'
        });
    }
};

// Refresh token
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required'
            });
        }

        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token'
            });
        }

        const token = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        res.status(200).json({
            token,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: error.message || 'Invalid refresh token'
        });
    }
};

// Logout
export const logout = async (req, res) => {
    try {
        if (req.user) {
            await sessionManager.removeSession(req.user._id.toString());
        }
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: error.message || 'Server error during logout'
        });
    }
};

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: error.message || 'Server error fetching profile'
        });
    }
};
