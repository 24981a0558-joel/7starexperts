'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { StatsCard } from '@/components/ui/StatsCard';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { paymentsApi } from '@/lib/api';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Payment } from '@/types';
import { TrendingUp, CreditCard, RefreshCw, AlertCircle, RotateCcw } from 'lucide-react';

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [refundModal, setRefundModal] = useState<Payment | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: async () => {
      const res = await paymentsApi.getAll({ page, limit: 15 });
      return res.data;
    },
  });

  const refundMutation = useMutation({
    mutationFn: (bookingId: string) => paymentsApi.refund(bookingId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); setRefundModal(null); },
  });

  const payments: Payment[] = data?.data ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;

  const columns = [
    { key: 'id', header: 'Payment ID',
      render: (r: Payment) => <span className="font-mono text-xs text-gold-500">#{r.id.slice(-8).toUpperCase()}</span> },
    { key: 'booking', header: 'Service',
      render: (r: Payment) => (
        <div>
          <p className="text-white text-sm font-medium">{r.booking.service.name}</p>
          <p className="text-gray-500 text-xs">{r.booking.customer.name} · {r.booking.customer.phone}</p>
        </div>
      )},
    { key: 'amount', header: 'Amount',
      render: (r: Payment) => (
        <div>
          <p className="font-bold text-gold-400">{formatCurrency(r.amount)}</p>
          {r.refundAmount && <p className="text-red-400 text-xs">-{formatCurrency(r.refundAmount)} refunded</p>}
        </div>
      )},
    { key: 'method', header: 'Method',
      render: (r: Payment) => <span className="text-gray-300 text-xs font-medium">{r.method}</span> },
    { key: 'status', header: 'Status', render: (r: Payment) => <Badge status={r.status} /> },
    { key: 'paidAt', header: 'Paid At',
      render: (r: Payment) => r.paidAt
        ? <span className="text-xs text-gray-400">{formatDateTime(r.paidAt)}</span>
        : <span className="text-gray-600 text-xs">—</span> },
    { key: 'actions', header: '',
      render: (r: Payment) => r.status === 'SUCCESS' ? (
        <button onClick={(e) => { e.stopPropagation(); setRefundModal(r); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/30 hover:bg-red-400/10 transition-all">
          <RotateCcw size={12} /> Refund
        </button>
      ) : null },
  ];

  return (
    <DashboardLayout title="Payments" subtitle="Revenue and transaction management">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)}
            icon={TrendingUp} gradient="linear-gradient(135deg,#f0b429,#d49a0f)" />
          <StatsCard title="Net Revenue" value={formatCurrency(stats.netRevenue)}
            icon={CreditCard} gradient="linear-gradient(135deg,#10b981,#059669)" />
          <StatsCard title="Total Refunded" value={formatCurrency(stats.totalRefunded)}
            icon={RefreshCw} gradient="linear-gradient(135deg,#ef4444,#dc2626)" />
          <StatsCard title="Successful" value={stats.successfulPayments}
            icon={AlertCircle} gradient="linear-gradient(135deg,#2a4fc5,#1e3b9b)" />
        </div>
      )}

      <DataTable columns={columns} data={payments} isLoading={isLoading} emptyText="No payments found" />
      {pagination && <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />}

      <ConfirmModal
        isOpen={!!refundModal}
        title="💰 Issue Refund"
        message={`Refund ${formatCurrency(refundModal?.amount ?? 0)} to ${refundModal?.booking.customer.name}? This cannot be undone.`}
        confirmLabel="Issue Refund"
        confirmStyle="danger"
        isLoading={refundMutation.isPending}
        onConfirm={() => refundModal && refundMutation.mutate(refundModal.bookingId)}
        onCancel={() => setRefundModal(null)}
      />
    </DashboardLayout>
  );
}
