import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, DashboardType } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  dashboardType: DashboardType['type'];
  setDashboardType: (type: DashboardType['type']) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardType, setDashboardType] = useState<DashboardType['type']>('super_admin');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthenticated = !!user;

  const redirectRegularUser = (userData: User) => {
    if (userData.role !== 'regular_user') {
      return false;
    }

    const envUrl = import.meta.env.VITE_USER_APP_URL;
    const targetUrl =
      envUrl ||
      (import.meta.env.DEV ? 'http://localhost:3002' : '/');

    console.log('[Auth] VITE_USER_APP_URL from env:', envUrl);
    console.log('[Auth] Final redirect URL:', targetUrl);
    console.log('[Auth] Redirecting regular user to:', targetUrl);

    if (typeof window !== 'undefined') {
      window.location.href = targetUrl;
    }
    return true;
  };

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = async () => {
      // Don't check auth if we're in the process of logging out
      if (isLoggingOut) {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (redirectRegularUser(userData)) {
              return;
            }
            setUser(userData);
            setDashboardType(userData.role === 'super_admin' ? 'super_admin' : 'broker');
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('auth_token');
            setUser(null);
          }
        } else {
          // No token, ensure user is null
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isLoggingOut]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { user: userData, token } = await response.json();
        localStorage.setItem('auth_token', token);
        if (redirectRegularUser(userData)) {
          return true;
        }
        setUser(userData);
        setDashboardType(userData.role === 'super_admin' ? 'super_admin' : 'broker');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      setIsLoggingOut(true);
      // Clear token first
      localStorage.removeItem('auth_token');
      // Clear user state
      setUser(null);
      setDashboardType('super_admin');
      // Reset logout flag after a brief delay to prevent immediate re-auth
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear even if there's an error
      setUser(null);
      setDashboardType('super_admin');
      setIsLoggingOut(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    dashboardType,
    setDashboardType,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
