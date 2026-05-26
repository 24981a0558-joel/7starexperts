'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { logsApi } from '@/lib/api';
import type { ActivityLog } from '@/types';
import { Search, ChevronLeft, ChevronRight, Clock, User, Tag } from 'lucide-react';

// ─── Action badge colours ────────────────────────────────────────────────────
const ACTION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  CREATE:   { bg: 'rgba(52,211,153,0.15)',  text: '#34d399', label: 'Created'   },
  UPDATE:   { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa', label: 'Updated'   },
  DELETE:   { bg: 'rgba(248,113,113,0.15)', text: '#f87171', label: 'Deleted'   },
  SUSPEND:  { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24', label: 'Suspended' },
  ACTIVATE: { bg: 'rgba(52,211,153,0.15)',  text: '#34d399', label: 'Activated' },
  APPROVE:  { bg: 'rgba(52,211,153,0.15)',  text: '#34d399', label: 'Approved'  },
  REJECT:   { bg: 'rgba(248,113,113,0.15)', text: '#f87171', label: 'Rejected'  },
  LOGIN:    { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', label: 'Login'     },
};

const ENTITY_COLOURS: Record<string, string> = {
  Service:  '#f0b429',
  Category: '#60a5fa',
  Provider: '#34d399',
  User:     '#a78bfa',
  Booking:  '#fb923c',
  Payment:  '#f87171',
  Review:   '#e879f9',
};

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_STYLES[action] ?? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', label: action };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: style.bg, color: style.text }}>
      {style.label}
    </span>
  );
}

function EntityBadge({ entity }: { entity: string }) {
  const color = ENTITY_COLOURS[entity] ?? '#94a3b8';
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
      <Tag size={11} />{entity}
    </span>
  );
}

function ChangesPreview({ changes }: { changes: Record<string, any> | null }) {
  if (!changes || Object.keys(changes).length === 0) return <span className="text-gray-600">—</span>;

  const entries = Object.entries(changes).slice(0, 3);
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span key={k} className="px-1.5 py-0.5 rounded text-xs"
          style={{ background: '#0f172a', color: '#94a3b8', border: '1px solid #2d3f5e' }}>
          {k}: <span className="text-white">{String(v)}</span>
        </span>
      ))}
      {Object.keys(changes).length > 3 && (
        <span className="text-xs text-gray-500">+{Object.keys(changes).length - 3} more</span>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const ACTIONS  = ['', 'CREATE', 'UPDATE', 'DELETE', 'SUSPEND', 'ACTIVATE', 'APPROVE', 'REJECT'];
const ENTITIES = ['', 'Service', 'Category', 'Provider', 'User', 'Booking', 'Payment', 'Review'];

export default function LogsPage() {
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, search, action, entity],
    queryFn: async () => {
      const res = await logsApi.getAll({
        page, limit: 25,
        ...(search && { search }),
        ...(action && { action }),
        ...(entity && { entity }),
      });
      return res.data;
    },
  });

  const logs: ActivityLog[] = data?.data ?? [];
  const total: number       = data?.pagination?.total ?? 0;
  const totalPages          = Math.ceil(total / 25);

  const selectCls = 'px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-yellow-400/40';
  const selectStyle = { background: '#1e293b', border: '1px solid #2d3f5e' };

  return (
    <DashboardLayout title="Audit Logs" subtitle="Track every admin action — who changed what and when">

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by admin, name, ID…"
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400/40"
            style={{ background: '#1e293b', border: '1px solid #2d3f5e' }} />
        </div>

        {/* Action filter */}
        <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
          className={selectCls} style={selectStyle}>
          <option value="">All Actions</option>
          {ACTIONS.filter(Boolean).map(a => (
            <option key={a} value={a}>{ACTION_STYLES[a]?.label ?? a}</option>
          ))}
        </select>

        {/* Entity filter */}
        <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }}
          className={selectCls} style={selectStyle}>
          <option value="">All Entities</option>
          {ENTITIES.filter(Boolean).map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1e293b' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-gray-400 text-sm">No logs found</p>
            {(search || action || entity) && (
              <button onClick={() => { setSearch(''); setAction(''); setEntity(''); }}
                className="text-yellow-400 text-xs hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid #1e293b' }}>
                {['Time', 'Admin', 'Action', 'Entity', 'Name / ID', 'Changes'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id}
                  className="border-b border-surface-border hover:bg-white/[0.02] transition-colors"
                  style={{ borderColor: '#1e293b' }}>

                  {/* Time */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock size={12} />
                      <span className="text-xs">{timeAgo(log.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </td>

                  {/* Admin */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#f0b429,#d49a0f)' }}>
                        {(log.adminName ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white text-xs font-medium">{log.adminName ?? 'System'}</span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <ActionBadge action={log.action} />
                  </td>

                  {/* Entity */}
                  <td className="px-4 py-3">
                    <EntityBadge entity={log.entity} />
                  </td>

                  {/* Name / ID */}
                  <td className="px-4 py-3">
                    {log.entityName
                      ? <p className="text-white text-xs font-medium">{log.entityName}</p>
                      : null
                    }
                    {log.entityId && (
                      <p className="text-gray-600 text-xs font-mono truncate max-w-32">{log.entityId}</p>
                    )}
                  </td>

                  {/* Changes */}
                  <td className="px-4 py-3 max-w-xs">
                    <ChangesPreview changes={log.changes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total} logs
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1.5 rounded-lg text-sm text-white"
              style={{ background: '#1e293b', border: '1px solid #2d3f5e' }}>
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
