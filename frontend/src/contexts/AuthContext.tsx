import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { apiClient } from '../api/client';
//import { getMaxUserData, initMaxBridge, triggerHaptic } from '../lib/maxBridge';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
  loginWithMaxId: (maxId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('access_token')
  );

  const login = async (username: string, password: string) => {
    const response = await apiClient.login(username, password);
    localStorage.setItem('access_token', response.access_token);
    setToken(response.access_token);
  };

  const loginWithMaxId = async (maxId: string) => {
    try {
      const response = await apiClient.loginWithMAX(maxId);
      console.log('[Auth] Login response received:', { hasToken: !!response.access_token });
      localStorage.setItem('access_token', response.access_token);
      console.log('[Auth] Token saved to localStorage');
      setToken(response.access_token);
      console.log('[Auth] Token state updated');
    } catch (e) {
      console.error('[Auth] MAX ID login error:', e);
      localStorage.removeItem('access_token');
      setToken(null);
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('max_user_data');
    setToken(null);
  };

  // Используем useMemo чтобы избежать ненужных ре-рендеров
  const isAuth = token !== null || !!localStorage.getItem('access_token');
  const tokenValue = token || localStorage.getItem('access_token');
  
  const value = useMemo<AuthContextType>(() => ({
    isAuthenticated: isAuth,
    login,
    logout,
    token: tokenValue,
    loginWithMaxId,
  }), [token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

