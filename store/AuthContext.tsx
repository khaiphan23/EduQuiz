import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../services/firebase';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  updateUserProfile: (updates: { 
    name?: string; 
    photoURL?: string; 
    bio?: string; 
    notifications?: { email: boolean; push: boolean; activitySummary: boolean };
    preferences?: { theme: 'light' | 'dark' | 'system'; language: 'vi' | 'en' };
  }) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch full profile
        const fullProfile = await authService.getCurrentUser();
        setUser(fullProfile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const theme = user?.preferences?.theme || 'light';
    const root = window.document.documentElement;

    console.log('AuthContext: Applying theme:', theme);

    const applyTheme = (targetTheme: string) => {
      root.classList.remove('light', 'dark');
      
      if (targetTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        console.log('AuthContext: System theme detected:', systemTheme);
        root.classList.add(systemTheme);
      } else {
        root.classList.add(targetTheme);
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        console.log('AuthContext: System theme changed');
        applyTheme('system');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [user?.preferences?.theme]);

  const login = async (email: string, password: string) => {
    // authService.login now returns a Promise<User> but we rely on onAuthStateChanged to update state
    // However, we still call it to trigger the login process
    await authService.login(email, password);
  };

  const register = async (name: string, email: string, password: string) => {
    await authService.register(name, email, password);
  };

  const logout = () => {
    authService.logout();
  };

  const deleteAccount = async () => {
    await authService.deleteAccount();
  };

  const updateUserProfile = async (updates: { 
    name?: string; 
    photoURL?: string; 
    bio?: string; 
    notifications?: { email: boolean; push: boolean; activitySummary: boolean };
    preferences?: { theme: 'light' | 'dark' | 'system'; language: 'vi' | 'en' };
  }) => {
    if (!user) return;
    await authService.updateUserProfile(user.id, updates);
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return;
    await authService.updateUserPassword(currentPassword, newPassword);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error("User not logged in");
    return await authService.uploadAvatar(user.id, file);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, deleteAccount, updateUserProfile, updateUserPassword, uploadAvatar, isLoading }}>
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