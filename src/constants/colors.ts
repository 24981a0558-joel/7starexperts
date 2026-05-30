// Worker app uses a green-tinted palette to differentiate from the blue customer app

export const Colors = {
  primary: '#059669',        // emerald green — provider brand colour
  primaryDark: '#047857',
  primaryLight: '#D1FAE5',

  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  inputBackground: '#F3F4F6',

  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Booking status
  statusPending: '#F59E0B',   statusPendingBg: '#FEF3C7',
  statusAccepted: '#3B82F6',  statusAcceptedBg: '#EFF6FF',
  statusEnRoute: '#8B5CF6',   statusEnRouteBg: '#EDE9FE',
  statusInProgress: '#059669', statusInProgressBg: '#D1FAE5',
  statusCompleted: '#10B981', statusCompletedBg: '#D1FAE5',
  statusCancelled: '#EF4444', statusCancelledBg: '#FEE2E2',
  statusRejected: '#6B7280',  statusRejectedBg: '#F3F4F6',

  border: '#E5E7EB',
  divider: '#F3F4F6',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.5)',

  tabActive: '#059669',
  tabInactive: '#9CA3AF',
  tabBackground: '#FFFFFF',
} as const;

export function getStatusColor(status: string): { text: string; bg: string } {
  switch (status.toUpperCase()) {
    case 'PENDING':     return { text: Colors.statusPending,    bg: Colors.statusPendingBg };
    case 'ACCEPTED':    return { text: Colors.statusAccepted,   bg: Colors.statusAcceptedBg };
    case 'EN_ROUTE':    return { text: Colors.statusEnRoute,    bg: Colors.statusEnRouteBg };
    case 'IN_PROGRESS': return { text: Colors.statusInProgress, bg: Colors.statusInProgressBg };
    case 'COMPLETED':   return { text: Colors.statusCompleted,  bg: Colors.statusCompletedBg };
    case 'CANCELLED':   return { text: Colors.statusCancelled,  bg: Colors.statusCancelledBg };
    case 'REJECTED':    return { text: Colors.statusRejected,   bg: Colors.statusRejectedBg };
    default:            return { text: Colors.textSecondary,    bg: Colors.inputBackground };
  }
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'New Request', ACCEPTED: 'Accepted', EN_ROUTE: 'En Route',
    IN_PROGRESS: 'In Progress', COMPLETED: 'Completed',
    CANCELLED: 'Cancelled', REJECTED: 'Rejected',
  };
  return map[status.toUpperCase()] ?? status;
}
