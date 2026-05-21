// Application constants
export const APP_CONSTANTS = {
  // Auto-save interval (milliseconds)
  AUTO_SAVE_INTERVAL: parseInt(import.meta.env.VITE_AUTOSAVE_INTERVAL) || 30000,
  
  // Session timeout (minutes)
  SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 180,
  
  // Heartbeat interval (milliseconds)
  HEARTBEAT_INTERVAL: 60000, // 1 minute
  
  // Timer warning threshold (seconds)
  TIMER_WARNING_THRESHOLD: 300, // 5 minutes
  
  // API timeout (milliseconds)
  API_TIMEOUT: 30000,
  
  // Maximum file upload size (bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Allowed file types for upload
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  
  // Local storage keys
  STORAGE_KEYS: {
    SESSION_TOKEN: 'seb_session_token',
    EXAM_ANSWERS: 'seb_exam_answers',
    CURRENT_QUESTION: 'seb_current_question',
  },
  
  // API endpoints
  API_ENDPOINTS: {
    START_EXAM: '/api/exam-attempt/start-seb',
    SAVE_ANSWERS: '/api/exam-attempt/save-answers',
    SUBMIT_EXAM: '/api/exam-attempt/submit-seb',
    HEARTBEAT: '/api/exam-attempt/heartbeat',
  },
  
  // Error codes
  ERROR_CODES: {
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    EXAM_NOT_FOUND: 'EXAM_NOT_FOUND',
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  },
};

export const QUESTION_TYPES = {
  MCQ: 'mcq',
  TEXT: 'text',
  FILE: 'file',
} as const;

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export const EXAM_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
} as const;