'use client';

import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
}

const SkeletonRow = ({ cols }: { cols: number }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-5 py-4">
        <div className="h-4 rounded-lg animate-pulse" style={{ background: '#2d3f5e' }} />
      </td>
    ))}
  </tr>
);

export function DataTable<T extends Record<string, any>>({
  columns, data, isLoading, emptyText = 'No data found', onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid #2d3f5e' }}>
      <table className="w-full text-sm">
        <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid #2d3f5e' }}>
          <tr>
            {columns.map((col) => (
              <th key={col.key}
                className={cn('px-5 py-3.5 text-left text-xs font-bold uppercase tracking-widest whitespace-nowrap', col.className)}
                style={{ color: '#f0b429' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ background: '#1e293b' }}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-16 text-center text-gray-500 text-sm">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={row.id ?? idx}
                onClick={() => onRowClick?.(row)}
                className={cn('transition-all', onRowClick && 'cursor-pointer')}
                style={{ borderTop: '1px solid rgba(45,63,94,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(240,180,41,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-5 py-3.5 text-gray-300', col.className)}>
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
