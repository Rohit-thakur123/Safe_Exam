// Axios configuration for API calls
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add session token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const sessionToken = localStorage.getItem('seb_session_token');
    if (sessionToken) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle session expiration and other errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Session expired - redirect to error page
      localStorage.removeItem('seb_session_token');
      window.location.href = '/exam/error?message=Session%20expired&code=SESSION_EXPIRED';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export const codingExecutionAPI = {
  run: async (
    codingQuestionId: string,
    data: {
      attemptId: string;
      language: string;
      sourceCode: string;
    }
  ) => {
    const response = await apiClient.post(
      `/coding-assessments/${codingQuestionId}/run`,
      data
    );

    return response.data;
  },

  submit: async (
    codingQuestionId: string,
    data: {
      attemptId: string;
      language: string;
      sourceCode: string;
    }
  ) => {
    const response = await apiClient.post(
      `/coding-assessments/${codingQuestionId}/submit`,
      data
    );

    return response.data;
  },
};