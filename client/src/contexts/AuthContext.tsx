import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserDTO, UserRole } from '@smart-farmer/shared';
import { api } from '../api';

interface AuthContextType {
  user: UserDTO | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<UserDTO>;
  register: (data: any) => Promise<UserDTO>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smart_farmer_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await api.auth.getMe();
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user session:', err);
      localStorage.removeItem('smart_farmer_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (credentials: { identifier: string; password: string }) => {
    const res = await api.auth.login(credentials);
    const { token: newToken, user: loggedUser } = res.data;
    localStorage.setItem('smart_farmer_token', newToken);
    setToken(newToken);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (data: any) => {
    const res = await api.auth.register(data);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('smart_farmer_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {}
    localStorage.removeItem('smart_farmer_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
