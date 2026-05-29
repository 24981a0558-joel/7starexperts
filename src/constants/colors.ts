// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM — Colour Palette
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: '#208AEF',
  primaryDark: '#0D6EDE',
  primaryLight: '#E8F3FD',

  // Backgrounds
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  inputBackground: '#F3F4F6',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Status
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#208AEF',
  infoLight: '#E8F3FD',

  // Booking status colours
  statusPending: '#F59E0B',
  statusPendingBg: '#FEF3C7',
  statusConfirmed: '#208AEF',
  statusConfirmedBg: '#E8F3FD',
  statusInProgress: '#8B5CF6',
  statusInProgressBg: '#EDE9FE',
  statusCompleted: '#10B981',
  statusCompletedBg: '#D1FAE5',
  statusCancelled: '#EF4444',
  statusCancelledBg: '#FEE2E2',

  // UI
  border: '#E5E7EB',
  divider: '#F3F4F6',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.5)',

  // Tabs
  tabActive: '#208AEF',
  tabInactive: '#9CA3AF',
  tabBackground: '#FFFFFF',
} as const;

// ── Status badge helpers ───────────────────────────────────────────────────

export function getStatusColor(status: string): { text: string; bg: string } {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return { text: Colors.statusPending, bg: Colors.statusPendingBg };
    case 'CONFIRMED':
      return { text: Colors.statusConfirmed, bg: Colors.statusConfirmedBg };
    case 'IN_PROGRESS':
      return { text: Colors.statusInProgress, bg: Colors.statusInProgressBg };
    case 'COMPLETED':
      return { text: Colors.statusCompleted, bg: Colors.statusCompletedBg };
    case 'CANCELLED':
      return { text: Colors.statusCancelled, bg: Colors.statusCancelledBg };
    default:
      return { text: Colors.textSecondary, bg: Colors.inputBackground };
  }
}

// ── Category icon colours ──────────────────────────────────────────────────

const CATEGORY_COLOURS = [
  '#208AEF', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#06B6D4', '#F97316', '#84CC16',
];

export function getCategoryColor(index: number) {
  return CATEGORY_COLOURS[index % CATEGORY_COLOURS.length];
}
