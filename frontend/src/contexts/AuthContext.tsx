import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'caregiver' | 'admin';
  verified: boolean;
  senior_mode: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  profile: any | null;
  isLoading: boolean;
  unreadNotifications: number;
  seniorMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  toggleSeniorMode: (enabled: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [seniorMode, setSeniorMode] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setSeniorMode(parsedUser.senior_mode || false);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.user);
          setProfile(response.data.profile);
          setUnreadNotifications(response.data.unread_notifications || 0);
          setSeniorMode(response.data.user.senior_mode || false);
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (error) {
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token, user: newUser } = response.data;
    
    await AsyncStorage.setItem('access_token', access_token);
    await AsyncStorage.setItem('refresh_token', refresh_token);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(newUser);
    setSeniorMode(newUser.senior_mode || false);
    
    const meResponse = await api.get('/auth/me');
    setProfile(meResponse.data.profile);
    setUnreadNotifications(meResponse.data.unread_notifications || 0);
  };

  const register = async (name: string, email: string, phone: string, password: string, role: string) => {
    const response = await api.post('/auth/register', { name, email, phone, password, role });
    const { access_token, refresh_token, user: newUser } = response.data;
    
    await AsyncStorage.setItem('access_token', access_token);
    await AsyncStorage.setItem('refresh_token', refresh_token);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setProfile(null);
    setSeniorMode(false);
  };

  const refreshUser = async () => {
    if (token) {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setProfile(response.data.profile);
      setUnreadNotifications(response.data.unread_notifications || 0);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
  };

  const toggleSeniorMode = async (enabled: boolean) => {
    await api.put(`/auth/senior-mode?enabled=${enabled}`);
    setSeniorMode(enabled);
    if (user) {
      const updatedUser = { ...user, senior_mode: enabled };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, profile, isLoading, unreadNotifications, seniorMode,
      login, register, logout, refreshUser, toggleSeniorMode 
    }}>
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
