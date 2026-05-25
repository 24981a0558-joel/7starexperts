'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { providersApi } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import type { Provider } from '@/types';

// 📘 Users page shows all customers + providers.
// We'll use the providers listing for now and expand with a dedicated endpoint.

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users-all', page],
    queryFn: async () => {
      const res = await providersApi.getAll({ page, limit: 20 });
      return res.data;
    },
  });

  const users: Provider[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns = [
    { key: 'user', header: 'User',
      render: (r: Provider) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#f0b429,#d49a0f)' }}>
            {getInitials(r.user?.name ?? 'U')}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{r.user?.name}</p>
            <p className="text-xs text-gray-400">{r.user?.email ?? '—'}</p>
          </div>
        </div>
      )},
    { key: 'phone', header: 'Phone',
      render: (r: Provider) => <span className="text-gray-300 font-mono text-sm">{r.user?.phone}</span> },
    { key: 'role', header: 'Role',
      render: (r: Provider) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: 'rgba(42,79,197,0.15)', color: '#7f95e3', border: '1px solid rgba(42,79,197,0.3)' }}>
          PROVIDER
        </span>
      )},
    { key: 'rating', header: 'Rating',
      render: (r: Provider) => (
        <span className="text-gold-400 text-sm">⭐ {r.rating.toFixed(1)}</span>
      )},
    { key: 'joined', header: 'Joined',
      render: (r: Provider) => <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span> },
  ];

  return (
    <DashboardLayout title="Users" subtitle="Platform users and customers">
      {/* Search */}
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full max-w-sm px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
          style={{ background: '#1e293b', border: '1px solid #2d3f5e' }}
        />
      </div>

      <DataTable columns={columns} data={users} isLoading={isLoading} emptyText="No users found" />
      {pagination && <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />}
    </DashboardLayout>
  );
}
