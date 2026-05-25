'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardStats } from '@/types';

const COLORS = ['#10b981', '#f0b429', '#ef4444', '#7f95e3'];

export const BookingStatusChart = ({ stats }: { stats?: DashboardStats }) => {
  const data = stats ? [
    { name: 'Completed', value: stats.completed },
    { name: 'Pending',   value: stats.pending },
    { name: 'Cancelled', value: stats.cancelled },
    { name: 'Others',    value: Math.max(0, stats.total - stats.completed - stats.pending - stats.cancelled) },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="rounded-2xl p-6 h-full" style={{ background: '#1e293b', border: '1px solid #2d3f5e' }}>
      <h2 className="text-base font-bold text-white mb-6">Booking Status</h2>
      {!data.length ? (
        <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #2d3f5e', borderRadius: 12, color: '#fff' }}
              formatter={(v: number) => [v, 'bookings']}
            />
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
