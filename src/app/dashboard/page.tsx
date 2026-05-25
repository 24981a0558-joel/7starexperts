'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/ui/StatsCard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { BookingStatusChart } from '@/components/charts/BookingStatusChart';
import { dashboardApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, TrendingUp, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await dashboardApi.getStats();
      return res.data.data;
    },
  });

  const cards = [
    {
      title: 'Total Bookings',
      value: isLoading ? '…' : (stats?.total ?? 0).toLocaleString(),
      icon: ShoppingBag,
      gradient: 'linear-gradient(135deg,#2a4fc5,#1e3b9b)',
      trend: { value: 12, label: 'vs last month' },
    },
    {
      title: 'Total Revenue',
      value: isLoading ? '…' : formatCurrency(stats?.totalRevenue ?? 0),
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg,#f0b429,#d49a0f)',
      trend: { value: 8, label: 'vs last month' },
    },
    {
      title: 'Completed',
      value: isLoading ? '…' : (stats?.completed ?? 0).toLocaleString(),
      icon: CheckCircle,
      gradient: 'linear-gradient(135deg,#10b981,#059669)',
      trend: { value: 15, label: 'vs last month' },
    },
    {
      title: 'Pending',
      value: isLoading ? '…' : (stats?.pending ?? 0).toLocaleString(),
      icon: Clock,
      gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    },
    {
      title: 'Cancelled',
      value: isLoading ? '…' : (stats?.cancelled ?? 0).toLocaleString(),
      icon: XCircle,
      gradient: 'linear-gradient(135deg,#ef4444,#dc2626)',
      trend: { value: -3, label: 'vs last month' },
    },
    {
      title: 'Platform Fee',
      value: isLoading ? '…' : formatCurrency((stats?.totalRevenue ?? 0) * 0.15),
      icon: DollarSign,
      gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)',
    },
  ];

  return (
    <DashboardLayout title="Dashboard" subtitle="Welcome back! Here's what's happening today.">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        {cards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <BookingStatusChart stats={stats} />
        </div>
      </div>
    </DashboardLayout>
  );
}
