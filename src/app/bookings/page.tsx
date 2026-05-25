'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { bookingsApi } from '@/lib/api';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';

const STATUSES: BookingStatus[] = ['PENDING','ACCEPTED','EN_ROUTE','IN_PROGRESS','COMPLETED','CANCELLED','REJECTED'];

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, status],
    queryFn: async () => {
      const res = await bookingsApi.getAll({ page, limit: 15, ...(status && { status }) });
      return res.data;
    },
  });

  const bookings: Booking[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns = [
    { key: 'id', header: 'Booking ID',
      render: (r: Booking) => <span className="font-mono text-xs text-gold-500">#{r.id.slice(-8).toUpperCase()}</span> },
    { key: 'service', header: 'Service',
      render: (r: Booking) => <span className="font-medium text-white">{r.service.name}</span> },
    { key: 'customer', header: 'Customer',
      render: (r: Booking) => (
        <div>
          <p className="text-white text-sm">{r.customer.name}</p>
          <p className="text-gray-500 text-xs">{r.customer.phone}</p>
        </div>
      )},
    { key: 'provider', header: 'Provider',
      render: (r: Booking) => r.provider
        ? <span className="text-sm">{r.provider.user.name}</span>
        : <span className="text-gray-500 text-xs italic">Unassigned</span> },
    { key: 'amount', header: 'Amount',
      render: (r: Booking) => <span className="font-semibold text-gold-400">{formatCurrency(r.totalAmount)}</span> },
    { key: 'status', header: 'Status',
      render: (r: Booking) => <Badge status={r.status} /> },
    { key: 'scheduledAt', header: 'Scheduled',
      render: (r: Booking) => <span className="text-xs text-gray-400">{formatDateTime(r.scheduledAt)}</span> },
  ];

  return (
    <DashboardLayout title="Bookings" subtitle="All platform bookings">
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button onClick={() => { setStatus(''); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${!status ? 'text-gray-900 border-gold-500' : 'text-gray-400 border-surface-border hover:border-gray-500'}`}
          style={!status ? { background: 'linear-gradient(135deg,#f0b429,#d49a0f)' } : { background: 'transparent' }}>
          All
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${status === s ? 'text-gray-900 border-gold-500' : 'text-gray-400 border-surface-border hover:border-gray-500'}`}
            style={status === s ? { background: 'linear-gradient(135deg,#f0b429,#d49a0f)' } : { background: 'transparent' }}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={bookings} isLoading={isLoading} emptyText="No bookings found" />
      {pagination && (
        <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
      )}
    </DashboardLayout>
  );
}
