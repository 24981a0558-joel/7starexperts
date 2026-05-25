// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

// ── cn() — merge Tailwind classes safely ─────────────────────────────────────
// 📘 Problem: Tailwind class conflicts like "p-2 p-4" — which wins?
// cn() resolves conflicts intelligently using tailwind-merge.
// Usage: cn("p-2 bg-red", isActive && "bg-blue") → "p-2 bg-blue"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date formatters ───────────────────────────────────────────────────────────
export const formatDate = (date: string | Date) =>
  format(new Date(date), 'dd MMM yyyy');        // "25 May 2026"

export const formatDateTime = (date: string | Date) =>
  format(new Date(date), 'dd MMM yyyy, hh:mm a'); // "25 May 2026, 02:30 PM"

export const formatTimeAgo = (date: string | Date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true }); // "2 hours ago"

// ── Currency formatter ────────────────────────────────────────────────────────
export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount); // ₹1,500

// ── Booking status → badge color mapping ─────────────────────────────────────
export const statusColors: Record<string, string> = {
  PENDING:     'bg-yellow-100 text-yellow-700',
  ACCEPTED:    'bg-blue-100 text-blue-700',
  EN_ROUTE:    'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED:   'bg-green-100 text-green-700',
  CANCELLED:   'bg-red-100 text-red-700',
  REJECTED:    'bg-gray-100 text-gray-700',
  // Payment statuses
  SUCCESS:     'bg-green-100 text-green-700',
  FAILED:      'bg-red-100 text-red-700',
  REFUNDED:    'bg-orange-100 text-orange-700',
  // Provider statuses
  VERIFIED:    'bg-green-100 text-green-700',
  SUSPENDED:   'bg-red-100 text-red-700',
};

// ── Get initials from name ────────────────────────────────────────────────────
export const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

// ── Truncate long strings ─────────────────────────────────────────────────────
export const truncate = (str: string, max = 40) =>
  str.length > max ? str.slice(0, max) + '…' : str;
