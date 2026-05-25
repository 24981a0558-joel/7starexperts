import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  PENDING:     'bg-yellow-400/10 text-yellow-300 border-yellow-500/30',
  ACCEPTED:    'bg-blue-400/10 text-blue-300 border-blue-500/30',
  EN_ROUTE:    'bg-purple-400/10 text-purple-300 border-purple-500/30',
  IN_PROGRESS: 'bg-indigo-400/10 text-indigo-300 border-indigo-500/30',
  COMPLETED:   'bg-emerald-400/10 text-emerald-300 border-emerald-500/30',
  CANCELLED:   'bg-red-400/10 text-red-300 border-red-500/30',
  REJECTED:    'bg-gray-400/10 text-gray-300 border-gray-500/30',
  SUCCESS:     'bg-emerald-400/10 text-emerald-300 border-emerald-500/30',
  FAILED:      'bg-red-400/10 text-red-300 border-red-500/30',
  REFUNDED:    'bg-orange-400/10 text-orange-300 border-orange-500/30',
  VERIFIED:    'bg-emerald-400/10 text-emerald-300 border-emerald-500/30',
  SUSPENDED:   'bg-red-400/10 text-red-300 border-red-500/30',
};

export const Badge = ({ status, className }: { status: string; className?: string }) => (
  <span className={cn(
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
    statusStyles[status] ?? 'bg-gray-400/10 text-gray-300 border-gray-500/30',
    className
  )}>
    {status.replace(/_/g, ' ')}
  </span>
);
