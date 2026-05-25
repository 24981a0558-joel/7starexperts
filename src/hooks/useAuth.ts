// ─────────────────────────────────────────────────────────────────────────────
// AUTH HOOK
// ─────────────────────────────────────────────────────────────────────────────
// 📘 A "custom hook" is a reusable function that uses React hooks internally.
// useAuth() gives any component access to:
//   - current user info
//   - login / logout functions
//   - isLoading state
//
// Using React Query to cache the /auth/me response — avoids re-fetching on
// every page navigation.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch current user — runs on mount if token exists
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authApi.getMe();
      return res.data.data;
    },
    enabled: !!Cookies.get('admin_token'), // only fetch if token exists
    retry: false,                           // don't retry on 401
    staleTime: 5 * 60 * 1000,              // cache for 5 minutes
  });

  // Send OTP
  const sendOtpMutation = useMutation({
    mutationFn: (phone: string) => authApi.sendOtp(phone),
  });

  // Login with OTP
  const loginMutation = useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      authApi.login(phone, otp),
    onSuccess: (res) => {
      const { tokens, user: userData } = res.data.data;

      // Check admin role — only admins can access this panel
      if (userData.role !== 'ADMIN') {
        throw new Error('Access denied. Admin account required.');
      }

      // Store token in cookie (7 days expiry)
      Cookies.set('admin_token', tokens.accessToken, { expires: 7 });

      // Cache user data in React Query
      queryClient.setQueryData(['me'], userData);

      router.push('/dashboard');
    },
  });

  // Logout
  const logout = () => {
    Cookies.remove('admin_token');
    queryClient.clear(); // clear ALL cached queries
    router.push('/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    sendOtp: sendOtpMutation,
    login: loginMutation,
    logout,
  };
};
