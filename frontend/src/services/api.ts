import axios from 'axios';
import type { Question, Exam } from '../types';

// Get API base URL from environment variable, fallback to localhost:4000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to true if using cookies for auth
});

// Response interceptor for handling token refresh and session errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check for session-related errors
    const errorCode = error.response?.data?.code;
    const errorMessage = error.response?.data?.error;
    
    // Handle session expired or concurrent session detected
    if (errorCode === 'SESSION_EXPIRED' || errorCode === 'CONCURRENT_SESSION_DETECTED') {
      // Clear all stored data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      
      // Store the error message and code for the login page to display
      localStorage.setItem('sessionError', JSON.stringify({
        code: errorCode,
        message: errorMessage
      }));
      
      // Redirect to login
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle token refresh for other 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;
          
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          return api(originalRequest);
        } catch {
          // Refresh failed, redirect to login
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          delete api.defaults.headers.common['Authorization'];
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  login: async (email: string, password: string, role: 'teacher' | 'student') => {
    const response = await api.post('/auth/login', { email, password, role });
    return response.data;
  },
  
  register: async (name: string, email: string, password: string, role: 'teacher' | 'student') => {
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Get user profile with exam attempts
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

// Question API calls
export const questionAPI = {
  // Create a new question
  create: async (questionData: Omit<Question, '_id'>): Promise<Question> => {
    const response = await api.post('/questions/new', questionData);
    return response.data.question;
  },

  // Get all questions
  getAll: async (): Promise<Question[]> => {
    const response = await api.get('/questions/all');
    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data.questions)) {
      return response.data.questions;
    }
    if (Array.isArray(response.data.data)) {
      return response.data.data;
    }
    console.error('Unexpected questions response format:', response.data);
    return [];
  },

  // Get a single question by ID
  getById: async (id: string): Promise<Question> => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  // Update a question
  update: async (id: string, questionData: Partial<Question>): Promise<Question> => {
    const response = await api.put(`/questions/${id}`, questionData);
    return response.data.question;
  },

  // Delete a question
  delete: async (id: string): Promise<void> => {
    await api.delete(`/questions/${id}`);
  },

  // Get questions by teacher
  getByTeacher: async (teacherId: string): Promise<Question[]> => {
    const response = await api.get(`/questions/teacher/${teacherId}`);
    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data.questions)) {
      return response.data.questions;
    }
    if (Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }
};

// Exam API calls
export const examAPI = {
  // Create a new exam
  create: async (examData: Omit<Exam, '_id' | 'createdAt'>): Promise<Exam> => {
    const response = await api.post('/exams/new', examData);
    return response.data.exam;
  },

  // Get all exams
  getAll: async (): Promise<Exam[]> => {
    const response = await api.get('/exams/all');
    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data.exams)) {
      return response.data.exams;
    }
    if (Array.isArray(response.data.data)) {
      return response.data.data;
    }
    console.error('Unexpected exams response format:', response.data);
    return [];
  },

  // Get a single exam by ID
  getById: async (id: string): Promise<Exam> => {
    const response = await api.get(`/exams/${id}`);
    return response.data.exam;
  },

  // Update an exam
  update: async (id: string, examData: Partial<Exam>): Promise<Exam> => {
    const response = await api.put(`/exams/${id}`, examData);
    return response.data.exam;
  },

  // Delete an exam
  delete: async (id: string): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },

  // Get exams by teacher
  getByTeacher: async (teacherId: string): Promise<Exam[]> => {
    const response = await api.get(`/exams/teacher/${teacherId}`);
    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data.exams)) {
      return response.data.exams;
    }
    if (Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  },

  // Toggle exam status
  toggleStatus: async (id: string): Promise<{ isActive: boolean }> => {
    const response = await api.patch(`/exams/${id}/toggle-status`);
    return response.data;
  },

  // Get all students (for assignment)
  getStudents: async () => {
    const response = await api.get('/exams/students/all');
    return response.data;
  },

  // Assign students to exam
  assignStudents: async (examId: string, studentIds: string[], sendEmailNotification = true) => {
    const response = await api.post(`/exams/${examId}/assign-students`, { 
      studentIds,
      sendEmailNotification 
    });
    return response.data;
  },

  // Get assigned students for an exam
  getAssignedStudents: async (examId: string) => {
    const response = await api.get(`/exams/${examId}/assigned-students`);
    return response.data;
  }
};

// Exam Attempt API calls
export const examAttemptAPI = {
  // Start an exam attempt
  start: async (examId: string) => {
    const response = await api.post('/exam-attempts/start', { examId });
    return response.data;
  },

  // Submit an exam attempt
  submit: async (attemptId: string, answers: Record<string, string>, timeSpent: number) => {
    const response = await api.post('/exam-attempts/submit', {
      attemptId,
      answers,
      timeSpent
    });
    return response.data;
  },

  // Get exam attempt result
  getById: async (id: string) => {
    const response = await api.get(`/exam-attempts/${id}`);
    return response.data.attempt;
  },

  // Get detailed exam result
  getResult: async (attemptId: string) => {
    const response = await api.get(`/exam-attempts/${attemptId}/result`);
    return response.data;
  },

  // Get student's exam attempts
  getByStudent: async (studentId: string) => {
    const response = await api.get(`/exam-attempts/student/${studentId}`);
    return response.data;
  },

  // Get exam attempts for a specific exam (teacher only)
  getByExam: async (examId: string) => {
    const response = await api.get(`/exam-attempts/exam/${examId}`);
    return response.data;
  }
};

// Session Management API calls
export const sessionAPI = {
  // Check current session status
  getStatus: async () => {
    const response = await api.get('/sessions/status');
    return response.data;
  },

  // Force logout current session
  forceLogout: async () => {
    const response = await api.post('/sessions/force-logout');
    return response.data;
  },

  // Get all active sessions (teachers only)
  getAllSessions: async () => {
    const response = await api.get('/sessions/all');
    return response.data;
  }
};

// Safe Exam Browser (SEB) API calls
export const sebAPI = {
  // Verify exam link sent via email
  verifyExamLink: async (examId: string, studentId: string, token: string) => {
    const response = await api.post('/seb/verify-exam-link', {
      examId,
      studentId,
      token
    });
    return response.data;
  },

  // Generate SEB configuration file
  generateSEBConfig: async (examId: string, studentId: string, token: string): Promise<Blob> => {
    const response = await api.post('/seb/generate-config', {
      examId,
      studentId,
      token
    }, {
      responseType: 'blob' // Important: Tell axios to expect a binary response
    });
    return response.data;
  },

  // Generate exam links for students (Teacher only)
  generateExamLinks: async (examId: string, studentIds: string[]) => {
    const response = await api.post('/seb/generate-exam-links', {
      examId,
      studentIds
    });
    return response.data;
  }
};

export default api;
