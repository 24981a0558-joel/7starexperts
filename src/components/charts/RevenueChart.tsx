'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const mockData = [
  { month: 'Jan', revenue: 45000, bookings: 120 },
  { month: 'Feb', revenue: 52000, bookings: 145 },
  { month: 'Mar', revenue: 48000, bookings: 132 },
  { month: 'Apr', revenue: 61000, bookings: 168 },
  { month: 'May', revenue: 55000, bookings: 155 },
  { month: 'Jun', revenue: 67000, bookings: 185 },
  { month: 'Jul', revenue: 72000, bookings: 200 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-sm" style={{ background: '#1e293b', border: '1px solid #2d3f5e', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <p className="font-bold text-white mb-1">{label}</p>
      <p style={{ color: '#f0b429' }}>Revenue: {formatCurrency(payload[0]?.value)}</p>
      <p style={{ color: '#7f95e3' }}>Bookings: {payload[1]?.value}</p>
    </div>
  );
};

export const RevenueChart = () => (
  <div className="rounded-2xl p-6" style={{ background: '#1e293b', border: '1px solid #2d3f5e' }}>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-base font-bold text-white">Revenue Overview</h2>
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#f0b429' }} />
          <span className="text-xs text-gray-400">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#7f95e3' }} />
          <span className="text-xs text-gray-400">Bookings</span>
        </div>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={mockData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0b429" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#f0b429" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7f95e3" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#7f95e3" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,63,94,0.6)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="revenue" stroke="#f0b429" strokeWidth={2.5} fill="url(#rg)" />
        <Area type="monotone" dataKey="bookings" stroke="#7f95e3" strokeWidth={2} fill="url(#bg)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
