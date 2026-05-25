'use client';

import { cn, formatCurrency } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: string;
  trend?: { value: number; label: string };
}

export const StatsCard = ({ title, value, icon: Icon, gradient, trend }: StatsCardProps) => (
  <div className="rounded-2xl p-6 relative overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #1e293b 0%, #162032 100%)', border: '1px solid #2d3f5e', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
    {/* Glow blob */}
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl"
      style={{ background: gradient ?? 'radial-gradient(circle, #f0b429, transparent)' }} />
    <div className="relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1.5 font-semibold', trend.value >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: gradient ?? 'linear-gradient(135deg,#f0b429,#d49a0f)', boxShadow: '0 0 20px rgba(240,180,41,0.25)' }}>
          <Icon size={20} className="text-gray-900" />
        </div>
      </div>
    </div>
  </div>
);
