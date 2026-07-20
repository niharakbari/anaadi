import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, '');

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/me`, {
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
      await fetch(`${apiBaseUrl}/api/auth/logout`, {
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

  // Listen for global unauthorized events to automatically log out
  useEffect(() => {
    const handleUnauthorized = () => {
      // Don't call backend logout if we're already unauthorized by backend
      setIsAuthenticated(false);
      setUser(null);
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

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
