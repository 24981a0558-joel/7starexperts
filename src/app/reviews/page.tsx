'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { reviewsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Review } from '@/types';
import { Trash2, Star } from 'lucide-react';

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={13}
        className={s <= rating ? 'text-gold-400 fill-gold-400' : 'text-gray-600'} />
    ))}
    <span className="text-xs text-gray-400 ml-1">{rating}/5</span>
  </div>
);

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page],
    queryFn: async () => {
      const res = await reviewsApi.getAll({ page, limit: 15 });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); setDeleteTarget(null); },
  });

  const reviews: Review[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns = [
    { key: 'reviewer', header: 'Reviewer',
      render: (r: Review) => <span className="font-medium text-white">{r.fromUser.name}</span> },
    { key: 'provider', header: 'Provider Reviewed',
      render: (r: Review) => <span className="text-gray-300">{r.toUser.name}</span> },
    { key: 'service', header: 'Service',
      render: (r: Review) => <span className="text-gray-400 text-sm">{r.booking.service.name}</span> },
    { key: 'rating', header: 'Rating', render: (r: Review) => <StarRating rating={r.rating} /> },
    { key: 'comment', header: 'Comment',
      render: (r: Review) => r.comment
        ? <span className="text-gray-300 text-sm max-w-xs block truncate">{r.comment}</span>
        : <span className="text-gray-600 text-xs italic">No comment</span> },
    { key: 'date', header: 'Date',
      render: (r: Review) => <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span> },
    { key: 'actions', header: '',
      render: (r: Review) => (
        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors" title="Delete">
          <Trash2 size={14} />
        </button>
      )},
  ];

  return (
    <DashboardLayout title="Reviews" subtitle="Moderate platform reviews">
      <DataTable columns={columns} data={reviews} isLoading={isLoading} emptyText="No reviews found" />
      {pagination && <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="🗑️ Delete Review"
        message={`Delete ${deleteTarget?.fromUser.name}'s review? The provider's rating will be recalculated.`}
        confirmLabel="Delete Review"
        confirmStyle="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
