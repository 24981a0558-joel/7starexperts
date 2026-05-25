'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { providersApi } from '@/lib/api';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import { useState } from 'react';
import { ArrowLeft, Star, Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'VERIFIED' | 'REJECTED' | 'SUSPENDED' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['provider', id],
    queryFn: async () => {
      const res = await providersApi.getById(id);
      return res.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (status: string) => providersApi.updateStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['provider', id] }); setModal(null); },
  });

  if (isLoading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  const p = data;
  if (!p) return null;

  return (
    <DashboardLayout title="Provider Details">
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gold-400 transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Providers
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="rounded-2xl p-6" style={{ background: '#1e293b', border: '1px solid #2d3f5e' }}>
          <div className="text-center">
            {p.user?.avatar
              ? <img src={p.user.avatar} className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-gold-500" alt="" />
              : <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-gray-900"
                  style={{ background: 'linear-gradient(135deg,#f0b429,#d49a0f)' }}>
                  {getInitials(p.user?.name ?? 'U')}
                </div>
            }
            <h2 className="text-xl font-bold text-white mt-3">{p.user?.name}</h2>
            <p className="text-gray-400 text-sm">{p.user?.phone}</p>
            <div className="mt-3"><Badge status={p.status} /></div>
          </div>

          <div className="mt-6 space-y-3">
            {[
              { label: 'Rating', value: `⭐ ${p.rating.toFixed(1)} (${p.totalReviews} reviews)` },
              { label: 'Experience', value: p.experience ? `${p.experience} years` : 'Not set' },
              { label: 'Joined', value: formatDate(p.createdAt) },
              { label: 'Total Earnings', value: formatCurrency(p.totalEarnings) },
              { label: 'Wallet Balance', value: formatCurrency(p.walletBalance) },
              { label: 'Available', value: p.isAvailable ? '🟢 Online' : '🔴 Offline' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm py-2"
                style={{ borderBottom: '1px solid rgba(45,63,94,0.6)' }}>
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-6 space-y-2">
            {p.status === 'PENDING' && (
              <>
                <button onClick={() => setModal('VERIFIED')}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                  <CheckCircle size={16} /> Approve Provider
                </button>
                <button onClick={() => setModal('REJECTED')}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-400/10 transition-all">
                  Reject Provider
                </button>
              </>
            )}
            {p.status === 'VERIFIED' && (
              <button onClick={() => setModal('SUSPENDED')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-400/10 transition-all">
                Suspend Provider
              </button>
            )}
            {p.status === 'SUSPENDED' && (
              <button onClick={() => setModal('VERIFIED')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#f0b429,#d49a0f)' }}>
                Reinstate Provider
              </button>
            )}
          </div>
        </div>

        {/* Services + Bio */}
        <div className="lg:col-span-2 space-y-6">
          {p.bio && (
            <div className="rounded-2xl p-6" style={{ background: '#1e293b', border: '1px solid #2d3f5e' }}>
              <h3 className="text-sm font-bold text-gold-400 uppercase tracking-widest mb-3">About</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{p.bio}</p>
            </div>
          )}

          {p.services && p.services.length > 0 && (
            <div className="rounded-2xl p-6" style={{ background: '#1e293b', border: '1px solid #2d3f5e' }}>
              <h3 className="text-sm font-bold text-gold-400 uppercase tracking-widest mb-4">Services Offered</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {p.services.map((ps: any) => (
                  <div key={ps.id} className="p-3 rounded-xl flex items-center justify-between"
                    style={{ background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.15)' }}>
                    <div>
                      <p className="text-sm font-medium text-white">{ps.service.name}</p>
                      <p className="text-xs text-gray-400">{ps.service.category?.name}</p>
                    </div>
                    <span className="text-gold-400 font-bold text-sm">{formatCurrency(ps.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!modal}
        title={modal === 'VERIFIED' ? '✅ Approve Provider' : modal === 'REJECTED' ? '❌ Reject' : '🚫 Suspend'}
        message={`Confirm ${modal?.toLowerCase()} for ${p.user?.name}?`}
        confirmLabel={modal === 'VERIFIED' ? 'Approve' : modal === 'REJECTED' ? 'Reject' : 'Suspend'}
        confirmStyle={modal === 'VERIFIED' ? 'success' : 'danger'}
        isLoading={updateMutation.isPending}
        onConfirm={() => modal && updateMutation.mutate(modal)}
        onCancel={() => setModal(null)}
      />
    </DashboardLayout>
  );
}
