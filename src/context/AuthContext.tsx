import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

interface AuthContextType {
  token: string | null;
  user: { id: number; name: string; email: string } | null;
  setUser: React.Dispatch<React.SetStateAction<{ id: number; name: string; email: string } | null>>;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('@urbansafe_token').then(async (storedToken) => {
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await api.get('/auth/me');
          // Normaliza siempre el objeto del usuario
          const userData = response.data.user || response.data;
          setUser(userData);
        } catch (e) {
          // Si el token falló o expiró, resetea la sesión limpia
          await AsyncStorage.removeItem('@urbansafe_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const accessToken = response.data.access_token;
    await AsyncStorage.setItem('@urbansafe_token', accessToken);
    setToken(accessToken);
    setUser(response.data.user || response.data);
  };

  const register = async (name: string, email: string, password: string) => {
    await api.post('/auth/register', { name, email, password });
    await login(email, password);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@urbansafe_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};