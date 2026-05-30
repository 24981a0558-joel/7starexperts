import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, providerApi, setAuthToken, User, ProviderProfile } from '@/lib/api';

const TOKEN_KEY = 'worker_auth_token';

interface AuthContextValue {
  user: User | null;
  provider: ProviderProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshProvider: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          if (profileRes) setProvider(profileRes.data);
          setToken(saved);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
    // Load provider profile
    try {
      const res = await providerApi.getMyProfile();
      setProvider(res.data);
    } catch { /* new provider — profile not created yet */ }
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setProvider(null);
  }, []);

  const refreshProvider = useCallback(async () => {
    try {
      const res = await providerApi.getMyProfile();
      setProvider(res.data);
    } catch { /* silent */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, provider, token, isLoading, login, logout, refreshProvider }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
