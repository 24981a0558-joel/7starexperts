// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT — Axios Instance
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Instead of importing axios and setting the base URL everywhere,
// we create ONE configured axios instance here and import it everywhere.
//
// This instance automatically:
//   - Sets base URL from .env
//   - Attaches JWT token to every request (request interceptor)
//   - Redirects to /login when token expires (response interceptor)
//
// Interceptors = functions that run on every request/response
// Like middleware but for HTTP calls.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api',
  timeout: 15000, // 15 second timeout — fail fast if server is down
  headers: { 'Content-Type': 'application/json' },
});

// ── REQUEST INTERCEPTOR ────────────────────────────────────────────────────
// Runs before EVERY request — attaches the auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('admin_token'); // read token from cookie
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ───────────────────────────────────────────────────
// Runs after EVERY response — handles auth errors globally
api.interceptors.response.use(
  (response) => response, // success → pass through
  (error) => {
    // 401 = Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      Cookies.remove('admin_token');  // clear invalid token
      // Redirect to login (only in browser, not during SSR)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Typed API helper functions ─────────────────────────────────────────────
// These are small wrappers used by React Query hooks for cleaner code

// Auth
export const authApi = {
  login: (phone: string, otp: string) =>
    api.post('/auth/verify-otp', { phone, otp, role: 'ADMIN' }),
  sendOtp: (phone: string) =>
    api.post('/auth/send-otp', { phone }),
  getMe: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/bookings/admin/stats'),
  getRevenueStats: () => api.get('/payments'),
};

// Bookings
export const bookingsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/bookings/admin/all', { params }),
};

// Users
export const usersApi = {
  // No dedicated /admin/users endpoint yet — using providers list
  getProviders: (params?: Record<string, any>) =>
    api.get('/providers', { params }),
};

// Providers
export const providersApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/providers', { params }),
  getById: (id: string) => api.get(`/providers/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/providers/${id}/status`, { status }),
};

// Services
export const servicesApi = {
  getAll: (params?: Record<string, any>) => api.get('/services', { params }),
  getCategories: (params?: Record<string, any>) => api.get('/categories', { params }),
  createService: (data: any) => api.post('/services', data),
  updateService: (id: string, data: any) => api.put(`/services/${id}`, data),
  deleteService: (id: string) => api.delete(`/services/${id}`),
  createCategory: (data: any) => api.post('/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/categories/${id}`, data),
};

// Payments
export const paymentsApi = {
  getAll: (params?: Record<string, any>) => api.get('/payments', { params }),
  refund: (bookingId: string, amount?: number) =>
    api.post('/payments/refund', { bookingId, amount }),
};

// Reviews
export const reviewsApi = {
  getAll: (params?: Record<string, any>) => api.get('/reviews', { params }),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};


// Activity Logs
export const logsApi = {
  getAll: (params?: Record<string, any>) => api.get('/logs', { params }),
};
