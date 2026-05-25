'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';
import Cookies from 'js-cookie';
import { Crown } from 'lucide-react';

interface DashboardLayoutProps { children: React.ReactNode; title?: string; subtitle?: string; }

export const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !Cookies.get('admin_token')) router.replace('/login');
  }, [isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070d1a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f0b429, #d49a0f)', boxShadow: '0 0 30px rgba(240,180,41,0.4)' }}>
            <Crown size={24} className="text-gray-900 animate-pulse" />
          </div>
          <p className="text-sm text-gray-400">Loading Admin Console…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen" style={{ background: '#0f172a' }}>
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        {/* Page header */}
        {title && (
          <div className="px-8 py-6 border-b border-surface-border"
            style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(8px)' }}>
            <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        )}
        <div className="p-8 page-enter">{children}</div>
      </main>
    </div>
  );
};
