'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { providersApi } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import type { Provider, ProviderStatus } from '@/types';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

export default function ProvidersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProviderStatus | ''>('PENDING');
  const [modal, setModal] = useState<{ provider: Provider; action: 'VERIFIED' | 'REJECTED' | 'SUSPENDED' } | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['providers', page, statusFilter],
    queryFn: async () => {
      const res = await providersApi.getAll({ page, limit: 15, ...(statusFilter && { status: statusFilter }) });
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      providersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      setModal(null);
    },
  });

  const providers: Provider[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns = [
    { key: 'name', header: 'Provider',
      render: (r: Provider) => (
        <div className="flex items-center gap-3">
          {r.user.avatar
            ? <img src={r.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-900"
                style={{ background: 'linear-gradient(135deg,#f0b429,#d49a0f)' }}>
                {getInitials(r.user.name)}
              </div>
          }
          <div>
            <p className="font-semibold text-white text-sm">{r.user.name}</p>
            <p className="text-gray-500 text-xs">{r.user.phone}</p>
          </div>
        </div>
      )},
    { key: 'rating', header: 'Rating',
      render: (r: Provider) => (
        <span className="text-gold-400 font-semibold">
          ⭐ {r.rating.toFixed(1)} <span className="text-gray-500 text-xs">({r.totalReviews})</span>
        </span>
      )},
    { key: 'status', header: 'Status', render: (r: Provider) => <Badge status={r.status} /> },
    { key: 'bookings', header: 'Bookings',
      render: (r: Provider) => <span className="text-gray-300">{r._count?.bookings ?? 0}</span> },
    { key: 'joined', header: 'Joined',
      render: (r: Provider) => <span className="text-gray-400 text-xs">{formatDate(r.createdAt)}</span> },
    { key: 'actions', header: 'Actions',
      render: (r: Provider) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); router.push(`/providers/${r.id}`); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="View details">
            <Eye size={15} />
          </button>
          {r.status === 'PENDING' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setModal({ provider: r, action: 'VERIFIED' }); }}
                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-400/10 transition-colors" title="Approve">
                <CheckCircle size={15} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setModal({ provider: r, action: 'REJECTED' }); }}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors" title="Reject">
                <XCircle size={15} />
              </button>
            </>
          )}
          {r.status === 'VERIFIED' && (
            <button onClick={(e) => { e.stopPropagation(); setModal({ provider: r, action: 'SUSPENDED' }); }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-400 border border-red-500/30 hover:bg-red-400/10 transition-colors">
              Suspend
            </button>
          )}
        </div>
      )},
  ];

  const statusTabs: Array<ProviderStatus | ''> = ['', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'];

  return (
    <DashboardLayout title="Providers" subtitle="Manage and verify service professionals">
      {/* Status tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statusTabs.map((s) => (
          <button key={s || 'all'} onClick={() => { setStatusFilter(s as any); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${statusFilter === s ? 'text-gray-900 border-gold-500' : 'text-gray-400 border-surface-border hover:border-gray-500'}`}
            style={statusFilter === s ? { background: 'linear-gradient(135deg,#f0b429,#d49a0f)' } : { background: 'transparent' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={providers} isLoading={isLoading}
        onRowClick={(r) => router.push(`/providers/${r.id}`)} />
      {pagination && <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />}

      <ConfirmModal
        isOpen={!!modal}
        title={modal?.action === 'VERIFIED' ? '✅ Approve Provider' : modal?.action === 'REJECTED' ? '❌ Reject Provider' : '🚫 Suspend Provider'}
        message={`Are you sure you want to ${modal?.action?.toLowerCase()} ${modal?.provider.user.name}?`}
        confirmLabel={modal?.action === 'VERIFIED' ? 'Approve' : modal?.action === 'REJECTED' ? 'Reject' : 'Suspend'}
        confirmStyle={modal?.action === 'VERIFIED' ? 'success' : 'danger'}
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => modal && updateStatusMutation.mutate({ id: modal.provider.id, status: modal.action })}
        onCancel={() => setModal(null)}
      />
    </DashboardLayout>
  );
}
