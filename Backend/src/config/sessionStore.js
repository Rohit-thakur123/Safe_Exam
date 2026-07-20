// In-memory session store (fallback when Redis is not available)
// This stores active sessions in a Map structure

class InMemorySessionStore {
    constructor() {
        this.sessions = new Map();
        this.sessionTimers = new Map();
        console.log('📝 Using in-memory session store (no Redis required)');
    }

    // Store active session
    async setActiveSession(userId, sessionData) {
        try {
            this.sessions.set(userId, {
                ...sessionData,
                timestamp: Date.now()
            });

            // Clear existing timer if any
            if (this.sessionTimers.has(userId)) {
                clearTimeout(this.sessionTimers.get(userId));
            }

            // Set auto-expiration (24 hours)
            const timer = setTimeout(() => {
                this.sessions.delete(userId);
                this.sessionTimers.delete(userId);
                console.log(`Session expired for user: ${userId}`);
            }, 24 * 60 * 60 * 1000); // 24 hours

            this.sessionTimers.set(userId, timer);
            return true;
        } catch (error) {
            console.error('Error setting session:', error);
            return false;
        }
    }

    // Get active session
    async getActiveSession(userId) {
        try {
            return this.sessions.get(userId) || null;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }

    // Remove session (logout)
    async removeSession(userId) {
        try {
            // Clear the timer
            if (this.sessionTimers.has(userId)) {
                clearTimeout(this.sessionTimers.get(userId));
                this.sessionTimers.delete(userId);
            }
            
            this.sessions.delete(userId);
            return true;
        } catch (error) {
            console.error('Error removing session:', error);
            return false;
        }
    }

    // Check if user has active session
    async hasActiveSession(userId) {
        try {
            return this.sessions.has(userId);
        } catch (error) {
            console.error('Error checking session:', error);
            return false;
        }
    }

    // Update session last activity
    async updateSessionActivity(userId) {
        try {
            const session = this.sessions.get(userId);
            if (session) {
                session.lastActivity = new Date().toISOString();
                session.timestamp = Date.now();
                this.sessions.set(userId, session);
            }
            return true;
        } catch (error) {
            console.error('Error updating session activity:', error);
            return false;
        }
    }

    // Get all active sessions
    async getAllActiveSessions() {
        try {
            const sessions = [];
            for (const [userId, sessionData] of this.sessions.entries()) {
                sessions.push({
                    userId,
                    ...sessionData
                });
            }
            return sessions;
        } catch (error) {
            console.error('Error getting all sessions:', error);
            return [];
        }
    }

    // Force logout
    async forceLogout(userId) {
        return await this.removeSession(userId);
    }

    // Get session count
    getSessionCount() {
        return this.sessions.size;
    }

    // Clear all sessions (for testing/admin)
    clearAllSessions() {
        for (const timer of this.sessionTimers.values()) {
            clearTimeout(timer);
        }
        this.sessions.clear();
        this.sessionTimers.clear();
        console.log('All sessions cleared');
    }
}

// Create singleton instance
const inMemoryStore = new InMemorySessionStore();

// Export session manager interface
export const sessionManager = {
    setActiveSession: (userId, sessionData) => inMemoryStore.setActiveSession(userId, sessionData),
    createSession: (userId, sessionData) => inMemoryStore.setActiveSession(userId, sessionData),
    getActiveSession: (userId) => inMemoryStore.getActiveSession(userId),
    removeSession: (userId) => inMemoryStore.removeSession(userId),
    hasActiveSession: (userId) => inMemoryStore.hasActiveSession(userId),
    updateSessionActivity: (userId) => inMemoryStore.updateSessionActivity(userId),
    getAllActiveSessions: () => inMemoryStore.getAllActiveSessions(),
    forceLogout: (userId) => inMemoryStore.forceLogout(userId),
    getSessionCount: () => inMemoryStore.getSessionCount(),
    clearAllSessions: () => inMemoryStore.clearAllSessions()
};

export default inMemoryStore;

