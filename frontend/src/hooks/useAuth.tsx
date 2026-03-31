import React, { createContext, useState, useContext, useEffect } from 'react';
import type { User, AuthError } from '@/types/auth';
import { clearTokens } from '@/api/client';

const db = globalThis.__B44_DB__;

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
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'No token' });
      return;
    }
    try {
      const currentUser = await db.auth.me() as User;
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch {
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Auth check failed' });
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
