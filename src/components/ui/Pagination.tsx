'use client';

interface PaginationProps { page: number; totalPages: number; onPageChange: (p: number) => void; }

export const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-5 px-1">
      <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        {[{ label: '← Prev', to: page - 1, dis: page <= 1 }, { label: 'Next →', to: page + 1, dis: page >= totalPages }].map(({ label, to, dis }) => (
          <button key={label} disabled={dis} onClick={() => onPageChange(to)}
            className="px-4 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-30"
            style={{ background: '#1e293b', border: '1px solid #2d3f5e', color: dis ? '#64748b' : '#f0b429' }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
