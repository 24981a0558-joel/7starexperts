import { API_URL } from './config';

let _token: string | null = null;
export function setAuthToken(t: string | null) { _token = t; }

async function request<T>(method: string, path: string, body?: unknown, params?: Record<string, any>): Promise<T> {
  let url = `${API_URL}${path}`;
  if (params) {
    const qs = Object.entries(params).filter(([,v]) => v !== undefined)
      .map(([k,v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
    if (qs) url += `?${qs}`;
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.message ?? `HTTP ${res.status}`);
  return data as T;
}

const get  = <T>(path: string, p?: Record<string, any>) => request<T>('GET', path, undefined, p);
const post  = <T>(path: string, b?: unknown) => request<T>('POST', path, b);
const put   = <T>(path: string, b?: unknown) => request<T>('PUT', path, b);
const patch = <T>(path: string, b?: unknown) => request<T>('PATCH', path, b);

// ── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string; name: string | null; phone: string; email: string | null; role: string;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  bio: string | null;
  experience: number | null;
  status: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';
  rating: number;
  totalReviews: number;
  totalEarnings: number;
  walletBalance: number;
  isAvailable: boolean;
  user: User;
  services?: Array<{ id: string; service: { id: string; name: string }; price: number }>;
}

export interface Booking {
  id: string;
  status: string;
  scheduledAt: string;
  notes: string | null;
  totalAmount: number;
  providerEarning: number;
  cancellationReason: string | null;
  service: { id: string; name: string; duration: number; image: string | null };
  customer: { id: string; name: string | null; phone: string };
  address: { fullAddress: string; lat: number; lng: number } | null;
  createdAt: string;
}

export interface WalletData {
  balance: number;
  totalEarnings: number;
  transactions: Array<{
    id: string; type: string; amount: number; description: string; createdAt: string;
  }>;
}

export interface EarningsStats {
  today: number; thisWeek: number; thisMonth: number; total: number;
  completedBookings: number;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  sendOtp: (phone: string) =>
    post<{ success: boolean; message: string }>('/auth/send-otp', { phone }),

  verifyOtp: (phone: string, otp: string) =>
    post<{ success: boolean; data: { isNewUser: boolean; tokens: { accessToken: string; refreshToken: string }; user: User } }>(
      '/auth/verify-otp', { phone, otp, role: 'PROVIDER' }
    ),

  getMe: () => get<{ success: boolean; data: User }>('/auth/me'),
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const providerApi = {
  getMyProfile: () =>
    get<{ success: boolean; data: ProviderProfile }>('/providers/me/profile'),

  updateProfile: (data: { bio?: string; experience?: number }) =>
    put<{ success: boolean; data: ProviderProfile }>('/providers/me/profile', data),

  toggleAvailability: (isAvailable: boolean) =>
    patch<{ success: boolean; data: { isAvailable: boolean } }>('/providers/me/toggle', { isAvailable }),

  getWallet: () =>
    get<{ success: boolean; data: WalletData }>('/providers/me/wallet'),

  getEarnings: () =>
    get<{ success: boolean; data: EarningsStats }>('/providers/me/earnings'),

  requestPayout: (amount: number) =>
    post<{ success: boolean; data: { message: string } }>('/providers/me/payout', { amount }),
};

// ── Bookings ──────────────────────────────────────────────────────────────────

export const bookingsApi = {
  getMyBookings: (params?: { status?: string; page?: number; limit?: number }) =>
    get<{ success: boolean; data: Booking[] }>('/bookings', params),

  getById: (id: string) =>
    get<{ success: boolean; data: Booking }>(`/bookings/${id}`),

  updateStatus: (id: string, status: string, cancellationReason?: string) =>
    patch<{ success: boolean; data: Booking }>(`/bookings/${id}/status`, {
      status,
      ...(cancellationReason ? { cancellationReason } : {}),
    }),
};
