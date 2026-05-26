'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Users, UserCheck,
  CreditCard, Star, LogOut, Wrench, Crown, ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/bookings',  label: 'Bookings',   icon: ShoppingBag },
  { href: '/users',     label: 'Users',      icon: Users },
  { href: '/providers', label: 'Providers',  icon: UserCheck },
  { href: '/services',  label: 'Services',   icon: Wrench },
  { href: '/payments',  label: 'Payments',   icon: CreditCard },
  { href: '/reviews',   label: 'Reviews',    icon: Star },
  { href: '/logs',      label: 'Audit Logs', icon: ScrollText },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 flex flex-col h-screen fixed left-0 top-0 z-30"
      style={{ background: 'linear-gradient(180deg, #070d1a 0%, #0f172a 100%)', borderRight: '1px solid #1e293b' }}>

      {/* Logo — royal crown with gold */}
      <div className="px-6 py-6 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f0b429 0%, #d49a0f 100%)', boxShadow: '0 0 20px rgba(240,180,41,0.3)' }}>
            <Crown size={20} className="text-surface-darker" />
          </div>
          <div>
            <p className="font-bold text-white text-sm tracking-wide">7StarExperts</p>
            <p className="text-xs" style={{ color: '#f0b429' }}>Admin Console</p>
          </div>
        </div>
      </div>

      {/* Nav section label */}
      <div className="px-6 pt-5 pb-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-surface-muted">Main Menu</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group',
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
              style={isActive ? {
                background: 'linear-gradient(90deg, rgba(240,180,41,0.15) 0%, rgba(42,79,197,0.15) 100%)',
                borderLeft: '2px solid #f0b429',
              } : {}}
            >
              <Icon size={17} className={isActive ? 'text-gold-500' : ''} />
              {label}
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-500" />}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-surface-border">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-surface-darker"
              style={{ background: 'linear-gradient(135deg, #f0b429, #d49a0f)' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-gold-500">Administrator</p>
            </div>
          </div>
        )}
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all">
          <LogOut size={17} /> Logout
        </button>
      </div>
    </aside>
  );
};
