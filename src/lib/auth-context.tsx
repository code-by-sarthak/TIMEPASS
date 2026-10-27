'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from './types';
import { signInWithGooglePopup, signOutFirebase } from './firebase';

export interface FirebaseSyncData {
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  photoUrl?: string | null;
  providerId?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (login: string, pass: string) => Promise<boolean>;
  register: (data: { email: string; password: string; displayName: string; username?: string; interests?: string[]; languages?: string[]; country?: string }) => Promise<boolean>;
  continueAsGuest: (data?: { displayName?: string; interests?: string[]; languages?: string[]; country?: string }) => Promise<boolean>;
  sendOtp: (phone: string) => Promise<{ success: boolean; devCode?: string; error?: string }>;
  verifyOtp: (phone: string, code: string, displayName?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  syncFirebaseUser: (data: FirebaseSyncData) => Promise<boolean>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => false,
  register: async () => false,
  continueAsGuest: async () => false,
  sendOtp: async () => ({ success: false }),
  verifyOtp: async () => false,
  loginWithGoogle: async () => false,
  syncFirebaseUser: async () => false,
  logout: () => {},
  updateUser: () => {},
  deleteAccount: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load session from localStorage on start
  useEffect(() => {
    async function loadSession() {
      const savedToken = localStorage.getItem('timepass_token');
      if (savedToken) {
        setToken(savedToken);
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            localStorage.removeItem('timepass_token');
            setToken(null);
          }
        } catch {
          // Offline / dev fallback
        }
      }
      setLoading(false);
    }

    loadSession();
  }, []);

  const saveAuth = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('timepass_token', newToken);
  };

  // Sync real Firebase user with backend & local state
  const syncFirebaseUser = async (data: FirebaseSyncData): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        saveAuth(resData.token, resData.user);
        return true;
      }
      throw new Error(resData.error || 'Failed to synchronize Firebase session');
    } catch (err: unknown) {
      alert((err as Error).message);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const fbUser = await signInWithGooglePopup();
      return await syncFirebaseUser({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoUrl: fbUser.photoURL,
        providerId: 'google.com'
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (!error.message?.includes('popup-closed-by-user')) {
        alert(error.message || 'Google Sign-In failed');
      }
      return false;
    }
  };

  const login = async (loginId: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginId, password: pass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        saveAuth(data.token, data.user);
        return true;
      }
      throw new Error(data.error || 'Login failed');
    } catch (err: unknown) {
      alert((err as Error).message);
      return false;
    }
  };

  const register = async (data: { email: string; password: string; displayName: string; username?: string; interests?: string[]; languages?: string[]; country?: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        saveAuth(resData.token, resData.user);
        return true;
      }
      throw new Error(resData.error || 'Registration failed');
    } catch (err: unknown) {
      alert((err as Error).message);
      return false;
    }
  };

  const continueAsGuest = async (data?: { displayName?: string; interests?: string[]; languages?: string[]; country?: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        saveAuth(resData.token, resData.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const sendOtp = async (phone: string) => {
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, devCode: data.devCode };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Network error sending OTP' };
    }
  };

  const verifyOtp = async (phone: string, code: string, displayName?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, displayName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        saveAuth(data.token, data.user);
        return true;
      }
      alert(data.error || 'Invalid OTP code');
      return false;
    } catch {
      alert('Verification failed');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('timepass_token');
    signOutFirebase().catch(() => {});
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser } as User);
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/delete', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        logout();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      continueAsGuest,
      sendOtp,
      verifyOtp,
      loginWithGoogle,
      syncFirebaseUser,
      logout,
      updateUser,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
