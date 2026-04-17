import React, { createContext, useState, useContext, useEffect } from 'react';
import type { User, AuthError } from '@/types/auth';
import { httpFetch, clearTokens, getToken } from '@/services/httpClient';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  authError: AuthError | null;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    setIsLoadingAuth(true);

    
    if (!getToken()) {
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'No token' });
      setIsLoadingAuth(false);
      return;
    }

    try {
      
      
      
      const currentUser = await httpFetch<User>('/api/auth/me');
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      setAuthError({ type: 'auth_required', message: 'Session expired' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, authError, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
