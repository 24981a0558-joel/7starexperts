// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT — Native Fetch wrapper
// ─────────────────────────────────────────────────────────────────────────────
// Uses native fetch (recommended for Expo SDK 55 New Architecture)
// Token is injected by calling setAuthToken() after login
// ─────────────────────────────────────────────────────────────────────────────

import { API_URL } from './config';

let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

// ── Core request helper ────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  let url = `${API_URL}${path}`;

  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data as any)?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

const get = <T>(path: string, params?: Record<string, any>) =>
  request<T>('GET', path, undefined, params);
const post = <T>(path: string, body?: unknown) =>
  request<T>('POST', path, body);
const put = <T>(path: string, body?: unknown) =>
  request<T>('PUT', path, body);
const patch = <T>(path: string, body?: unknown) =>
  request<T>('PATCH', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

// ─────────────────────────────────────────────────────────────────────────────
// TYPED API HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ──────────────────────────────────────────────────────────────────

export interface MeResponse {
  success: boolean;
  data: User;
}

export const authApi = {
  sendOtp: (phone: string) =>
    post<{ success: boolean; message: string }>('/auth/send-otp', { phone }),

  verifyOtp: (phone: string, otp: string) =>
    post<{
      success: boolean;
      data: {
        isNewUser: boolean;
        tokens: { accessToken: string; refreshToken: string };
        user: User;
      };
    }>('/auth/verify-otp', { phone, otp, role: 'CUSTOMER' }),

  getMe: () => get<MeResponse>('/auth/me'),
};

// ── Categories ────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { services: number };
}

export const categoriesApi = {
  getAll: () =>
    get<{ success: boolean; data: Category[] }>('/categories'),
};

// ── Services ──────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  basePrice: number;
  duration: number;
  isActive: boolean;
  category: { id: string; name: string };
}

export const servicesApi = {
  getAll: (params?: { categoryId?: string; search?: string; page?: number; limit?: number }) =>
    get<{ success: boolean; data: Service[]; pagination?: any }>('/services', params),

  getById: (id: string) =>
    get<{ success: boolean; data: Service }>(`/services/${id}`),
};

// ── Bookings ──────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  status: string;
  scheduledAt: string;
  address: { fullAddress: string; lat?: number; lng?: number } | null;
  totalAmount: number;
  notes: string | null;
  service: { id: string; name: string; image: string | null; duration: number };
  provider: { id: string; user: { name: string } } | null;
  payment: { status: string; amount: number } | null;
  createdAt: string;
}

export const bookingsApi = {
  create: (data: {
    serviceId: string;
    scheduledAt: string;
    address: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
  }) => post<{ success: boolean; data: Booking }>('/bookings', data),

  // GET /bookings — returns paginated response
  getMyBookings: (params?: { status?: string; page?: number; limit?: number }) =>
    get<{ success: boolean; data: Booking[]; total?: number; page?: number }>('/bookings', params),

  getById: (id: string) =>
    get<{ success: boolean; data: Booking }>(`/bookings/${id}`),

  // PATCH /bookings/:id/status — status: 'CANCELLED', cancellationReason required
  cancel: (id: string, reason = 'Customer cancelled') =>
    patch<{ success: boolean; data: Booking }>(`/bookings/${id}/status`, {
      status: 'CANCELLED',
      cancellationReason: reason,
    }),
};

// ── Users / Profile ───────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: string;
  isActive: boolean;
}

export const usersApi = {
  getProfile: () =>
    get<{ success: boolean; data: User }>('/users/profile'),

  updateProfile: (data: { name?: string; email?: string }) =>
    put<{ success: boolean; data: User }>('/users/profile', data),
};

// ── Reviews ───────────────────────────────────────────────────────────────

export const reviewsApi = {
  create: (data: { bookingId: string; rating: number; comment?: string }) =>
    post<{ success: boolean; data: any }>('/reviews', data),
};
