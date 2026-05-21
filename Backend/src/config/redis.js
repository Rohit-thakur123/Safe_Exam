import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Redis connection failed after 10 retries');
                return new Error('Redis connection failed');
            }
            return retries * 100; // Exponential backoff
        }
    }
});

// Error handling
redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redisClient.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
});

// Connect to Redis
const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
    }
};

connectRedis();

// Session management functions
export const sessionManager = {
    // Store active session for a user
    async setActiveSession(userId, sessionData) {
        try {
            const sessionKey = `session:${userId}`;
            await redisClient.set(sessionKey, JSON.stringify(sessionData), {
                EX: 24 * 60 * 60 // Expire in 24 hours
            });
            return true;
        } catch (error) {
            console.error('Error setting session:', error);
            return false;
        }
    },

    // Get active session for a user
    async getActiveSession(userId) {
        try {
            const sessionKey = `session:${userId}`;
            const session = await redisClient.get(sessionKey);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    },

    // Remove session for a user (logout)
    async removeSession(userId) {
        try {
            const sessionKey = `session:${userId}`;
            await redisClient.del(sessionKey);
            return true;
        } catch (error) {
            console.error('Error removing session:', error);
            return false;
        }
    },

    // Check if user has active session
    async hasActiveSession(userId) {
        try {
            const sessionKey = `session:${userId}`;
            const exists = await redisClient.exists(sessionKey);
            return exists === 1;
        } catch (error) {
            console.error('Error checking session:', error);
            return false;
        }
    },

    // Update session last activity
    async updateSessionActivity(userId) {
        try {
            const session = await this.getActiveSession(userId);
            if (session) {
                session.lastActivity = new Date().toISOString();
                await this.setActiveSession(userId, session);
            }
            return true;
        } catch (error) {
            console.error('Error updating session activity:', error);
            return false;
        }
    },

    // Get all active sessions (for admin/debugging)
    async getAllActiveSessions() {
        try {
            const keys = await redisClient.keys('session:*');
            const sessions = [];
            for (const key of keys) {
                const session = await redisClient.get(key);
                if (session) {
                    sessions.push({
                        userId: key.replace('session:', ''),
                        ...JSON.parse(session)
                    });
                }
            }
            return sessions;
        } catch (error) {
            console.error('Error getting all sessions:', error);
            return [];
        }
    },

    // Force logout (terminate session)
    async forceLogout(userId) {
        return await this.removeSession(userId);
    }
};

export default redisClient;

