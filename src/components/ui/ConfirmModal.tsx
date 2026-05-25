'use client';

interface ConfirmModalProps {
  isOpen: boolean; title: string; message: string;
  confirmLabel?: string; confirmStyle?: 'danger' | 'success' | 'primary';
  isLoading?: boolean; onConfirm: () => void; onCancel: () => void;
}

const btnGradients = {
  danger:  'linear-gradient(135deg,#ef4444,#dc2626)',
  success: 'linear-gradient(135deg,#10b981,#059669)',
  primary: 'linear-gradient(135deg,#f0b429,#d49a0f)',
};

export const ConfirmModal = ({ isOpen, title, message, confirmLabel = 'Confirm', confirmStyle = 'primary', isLoading, onConfirm, onCancel }: ConfirmModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#1e293b', border: '1px solid rgba(240,180,41,0.2)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-gray-400 rounded-xl transition-all hover:text-white"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #2d3f5e' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: btnGradients[confirmStyle] }}>
            {isLoading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
