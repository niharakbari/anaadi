import { apiClient } from '../lib/apiClient';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, '');

  const checkAuth = useCallback(async () => {
    try {
      const res = await apiClient(`${apiBaseUrl}/api/auth/me`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setUser(data.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await apiClient(`${apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [apiBaseUrl]);

  // Precise Session Timeout Management
  useEffect(() => {
    if (!isAuthenticated || !user || !user.exp) return;

    const currentTime = Date.now();
    const expiryTime = user.exp * 1000;
    const timeRemaining = expiryTime - currentTime;

    if (timeRemaining <= 0) {
      // Already expired
      window.dispatchEvent(new CustomEvent('session_expired'));
      return;
    }

    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('session_expired'));
    }, timeRemaining);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  // Listen for global session events
  useEffect(() => {
    let isLoggingOut = false;

    const handleSessionExpired = () => {
      if (isLoggingOut) return;
      isLoggingOut = true;

      // Clean local state first to immediately stop UI
      setIsAuthenticated(false);
      setUser(null);

      // Attempt to clear cookie on backend
      apiClient(`${apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(() => {});

      // Redirect to login with expired flag (triggers toast)
      window.location.href = '/login?expired=true';
    };

    const handleUnauthorized = () => {
      if (isLoggingOut) return;
      setIsAuthenticated(false);
      setUser(null);
    };

    window.addEventListener('session_expired', handleSessionExpired);
    window.addEventListener('unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('session_expired', handleSessionExpired);
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [apiBaseUrl]);

  const value = {
    isAuthenticated,
    user,
    loading,
    checkAuth,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
