import React, { createContext, useContext, useState } from 'react';
import type { User, AuthContextType } from '../types';
import api from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ✅ Moved outside component — stable reference, no re-creation on render
const normalizeUser = (userData: User & { _id?: string }): User => ({
  ...userData,
  id: userData.id || userData._id || '',
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {

  // ✅ Lazy initializer — runs synchronously before first render
  // This ensures token is attached to axios BEFORE any component fires an API call
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        // Attach token immediately so all API calls are authorized from the start
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        return normalizeUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error reading auth from localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    return null;
  });

  // ✅ No async initialization needed — localStorage reads are synchronous
  const [isLoading, setIsLoading] = useState(false);

  const login = async (
    email: string,
    password: string,
    role: 'teacher' | 'student'
  ) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password, role });

      const { user: responseUser, token, refreshToken } = response.data;
      const normalizedUser = normalizeUser(responseUser);

      // Update state
      setUser(normalizedUser);

      // Persist to localStorage
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Attach token for all future axios requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    } catch (error) {
      console.error('Login failed:', error);
      let errorMessage = 'Login failed. Please try again.';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        errorMessage = axiosError.response?.data?.error || errorMessage;
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'teacher' | 'student'
  ) => {
    // ✅ No setIsLoading here — login() called below handles it
    try {
      await api.post('/auth/register', { name, email, password, role });

      // Auto-login after successful registration
      await login(email, password, role);

    } catch (error) {
      console.error('Registration failed:', error);
      let errorMessage = 'Registration failed. Please try again.';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { error?: string; message?: string } };
        };
        errorMessage =
          axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          errorMessage;
      }

      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      // Notify backend to invalidate the token
      await api.post('/auth/logout');
    } catch (error) {
      // Non-critical — proceed with local cleanup even if backend call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local state and storage
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};