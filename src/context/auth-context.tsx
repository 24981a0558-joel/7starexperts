import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, providerApi, setAuthToken, User, ProviderProfile } from '@/lib/api';

const TOKEN_KEY = 'worker_auth_token';

interface AuthContextValue {
  user: User | null;
  providerProfile: ProviderProfile | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (saved) {
          setAuthToken(saved);
          const [meRes, profileRes] = await Promise.all([
            authApi.getMe(),
            providerApi.getMyProfile().catch(() => null),
          ]);
          setUser(meRes.data);
          if (profileRes) setProviderProfile(profileRes.data);
          setToken(saved);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
    try {
      const res = await providerApi.getMyProfile();
      setProviderProfile(res.data);
    } catch { /* new provider — profile not yet created */ }
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setProviderProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await providerApi.getMyProfile();
      setProviderProfile(res.data);
    } catch { /* silent */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, providerProfile, token, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
