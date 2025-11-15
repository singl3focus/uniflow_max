import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { apiClient } from '../api/client';
import { getMaxUserData, getMaxInitData, triggerHaptic } from '../lib/maxBridge';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
  loginWithMaxId: (maxId: string) => Promise<void>;
  maxUser: ReturnType<typeof getMaxUserData>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('access_token')
  );
  const [maxUser, setMaxUser] = useState<ReturnType<typeof getMaxUserData>>(null);

  // Автоматическая аутентификация через MAX при загрузке
  useEffect(() => {
    const autoAuthWithMax = async () => {
      const userData = getMaxUserData();
      const initData = getMaxInitData();
      
      if (userData && !token) {
        console.log('[Auth] MAX user detected, attempting auto-login:', userData);
        setMaxUser(userData);
        
        try {
          // Используем user ID из MAX для аутентификации
          await loginWithMaxId(userData.id.toString());
          console.log('[Auth] Auto-login successful');
          triggerHaptic('success');
        } catch (error) {
          console.error('[Auth] Auto-login failed:', error);
          triggerHaptic('error');
        }
      } else if (userData) {
        setMaxUser(userData);
      }
    };

    autoAuthWithMax();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await apiClient.login(username, password);
    localStorage.setItem('access_token', response.access_token);
    setToken(response.access_token);
    triggerHaptic('success');
  };

  const loginWithMaxId = async (maxId: string) => {
    try {
      const response = await apiClient.loginWithMAX(maxId);
      console.log('[Auth] Login response received:', { hasToken: !!response.access_token });
      localStorage.setItem('access_token', response.access_token);
      console.log('[Auth] Token saved to localStorage');
      setToken(response.access_token);
      console.log('[Auth] Token state updated');
      triggerHaptic('success');
    } catch (e) {
      console.error('[Auth] MAX ID login error:', e);
      localStorage.removeItem('access_token');
      setToken(null);
      triggerHaptic('error');
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('max_user_data');
    setToken(null);
    triggerHaptic('selection');
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
    maxUser,
  }), [token, maxUser]);

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

