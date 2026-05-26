'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { servicesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Service, Category } from '@/types';
import { Plus, Pencil, Clock, X } from 'lucide-react';

// ─── Shared field styles ─────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400/40';
const inputStyle = { background: '#0f172a', border: '1px solid #2d3f5e' };
const labelCls = 'block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider';

type ServiceForm = {
  name: string;
  categoryId: string;
  basePrice: number;
  duration: number;
  description?: string;
  image?: string;
};

type CategoryForm = {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
};

// ─── Service Form Fields (shared between Add and Edit) ───────────────────────
function ServiceFields({ register, errors, categories }: {
  register: any; errors: any; categories: Category[];
}) {
  return (
    <>
      <div>
        <label className={labelCls}>Service Name *</label>
        <input {...register('name', { required: 'Name is required', minLength: { value: 3, message: 'Min 3 characters' } })}
          className={inputCls} style={inputStyle} placeholder="e.g. Deep Cleaning" />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Category *</label>
        <select {...register('categoryId', { required: 'Category is required' })}
          className={inputCls} style={inputStyle}>
          <option value="">Select a category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Base Price (₹) *</label>
          <input type="number" {...register('basePrice', { required: 'Price is required', min: { value: 1, message: 'Must be > 0' } })}
            className={inputCls} style={inputStyle} placeholder="e.g. 499" />
          {errors.basePrice && <p className="text-red-400 text-xs mt-1">{errors.basePrice.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Duration (mins) *</label>
          <input type="number" {...register('duration', { required: 'Duration is required', min: { value: 15, message: 'Min 15 mins' } })}
            className={inputCls} style={inputStyle} placeholder="e.g. 120" />
          {errors.duration && <p className="text-red-400 text-xs mt-1">{errors.duration.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea {...register('description')} rows={2}
          className={`${inputCls} resize-none`} style={inputStyle}
          placeholder="Short description of the service…" />
      </div>

      <div>
        <label className={labelCls}>Image URL</label>
        <input {...register('image')} className={inputCls} style={inputStyle}
          placeholder="https://example.com/image.jpg" />
        <p className="text-gray-500 text-xs mt-1">Must be a direct image link (.jpg / .png / .webp) — not a webpage URL</p>
      </div>
    </>
  );
}

// ─── Add Service Modal ───────────────────────────────────────────────────────
function AddServiceModal({ categories, onClose, onSuccess }: {
  categories: Category[]; onClose: () => void; onSuccess: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ServiceForm>();
  const [serverError, setServerError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: ServiceForm) => servicesApi.createService({
      ...data, basePrice: Number(data.basePrice), duration: Number(data.duration),
    }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setServerError(e.response?.data?.message ?? 'Failed to create service'),
  });

  return (
    <Modal title="Add New Service" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <ServiceFields register={register} errors={errors} categories={categories} />
        {serverError && <p className="text-red-400 text-sm">{serverError}</p>}
        <ModalButtons onClose={onClose} loading={mutation.isPending} label="Create Service" />
      </form>
    </Modal>
  );
}

// ─── Edit Service Modal ──────────────────────────────────────────────────────
function EditServiceModal({ service, categories, onClose, onSuccess }: {
  service: Service; categories: Category[]; onClose: () => void; onSuccess: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ServiceForm>({
    defaultValues: {
      name:        service.name,
      categoryId:  service.category?.id ?? '',
      basePrice:   service.basePrice,
      duration:    service.duration,
      description: service.description ?? '',
      image:       service.image ?? '',
    },
  });
  const [serverError, setServerError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: ServiceForm) => servicesApi.updateService(service.id, {
      ...data, basePrice: Number(data.basePrice), duration: Number(data.duration),
    }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setServerError(e.response?.data?.message ?? 'Failed to update service'),
  });

  return (
    <Modal title="Edit Service" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <ServiceFields register={register} errors={errors} categories={categories} />
        {serverError && <p className="text-red-400 text-sm">{serverError}</p>}
        <ModalButtons onClose={onClose} loading={mutation.isPending} label="Save Changes" />
      </form>
    </Modal>
  );
}

// ─── Add Category Modal ──────────────────────────────────────────────────────
function AddCategoryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CategoryForm>();
  const [serverError, setServerError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: CategoryForm) => servicesApi.createCategory({
      ...data, sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
    }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setServerError(e.response?.data?.message ?? 'Failed to create category'),
  });

  return (
    <Modal title="Add New Category" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className={labelCls}>Category Name *</label>
          <input {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
            className={inputCls} style={inputStyle} placeholder="e.g. Cleaning" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Icon URL</label>
          <input {...register('icon')} className={inputCls} style={inputStyle} placeholder="https://…" />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <input {...register('description')} className={inputCls} style={inputStyle} placeholder="Optional…" />
        </div>
        <div>
          <label className={labelCls}>Sort Order</label>
          <input type="number" {...register('sortOrder')} className={inputCls} style={inputStyle} placeholder="0" />
        </div>
        {serverError && <p className="text-red-400 text-sm">{serverError}</p>}
        <ModalButtons onClose={onClose} loading={mutation.isPending} label="Create Category" />
      </form>
    </Modal>
  );
}

// ─── Shared Modal Shell ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6 my-4" style={{ background: '#1e293b', border: '1px solid #2d3f5e' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalButtons({ onClose, loading, label }: { onClose: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose}
        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 border border-gray-700 hover:border-gray-500 transition-all">
        Cancel
      </button>
      <button type="submit" disabled={loading}
        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#f0b429,#d49a0f)' }}>
        {loading ? 'Saving…' : label}
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [activeTab, setActiveTab]       = useState<'services' | 'categories'>('services');
  const [showAddForm, setShowAddForm]   = useState(false);
  const [editService, setEditService]   = useState<Service | null>(null);
  const queryClient = useQueryClient();

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ['services-admin'],
    queryFn: async () => { const res = await servicesApi.getAll({ limit: 100, showAll: true }); return res.data.data; },
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const res = await servicesApi.getCategories({ showAll: true }); return res.data.data; },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      servicesApi.updateService(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services-admin'] }),
  });

  const services: Service[] = servicesData?.services ?? servicesData ?? [];
  const cats: Category[]    = categories?.categories ?? categories ?? [];

  const onRefreshServices = () => queryClient.invalidateQueries({ queryKey: ['services-admin'] });
  const onRefreshCats     = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const serviceColumns = [
    { key: 'name', header: 'Service',
      render: (r: Service) => (
        <div className="flex items-center gap-3">
          {r.image
            ? <img src={r.image} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" alt=""
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: '#0f172a', border: '1px solid #2d3f5e' }} />
          }
          <div>
            <p className="font-semibold text-white">{r.name}</p>
            <p className="text-xs text-gray-400">{r.category?.name}</p>
          </div>
        </div>
      )},
    { key: 'basePrice', header: 'Base Price',
      render: (r: Service) => <span className="font-bold text-yellow-400">{formatCurrency(r.basePrice)}</span> },
    { key: 'duration', header: 'Duration',
      render: (r: Service) => (
        <span className="text-gray-300 flex items-center gap-1"><Clock size={13} />{r.duration} min</span>
      )},
    { key: 'providers', header: 'Providers',
      render: (r: Service) => <span className="text-gray-300">{r._count?.providers ?? 0}</span> },
    { key: 'status', header: 'Status',
      render: (r: Service) => <Badge status={r.isActive ? 'VERIFIED' : 'SUSPENDED'} /> },
    { key: 'actions', header: '',
      render: (r: Service) => (
        <div className="flex items-center gap-2">
          {/* Edit */}
          <button onClick={() => setEditService(r)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Edit service">
            <Pencil size={14} />
          </button>
          {/* Suspend / Activate */}
          <button onClick={() => toggleMutation.mutate({ id: r.id, isActive: !r.isActive })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              r.isActive
                ? 'text-red-400 border-red-500/30 hover:bg-red-400/10'
                : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-400/10'
            }`}>
            {r.isActive ? 'Suspend' : 'Activate'}
          </button>
        </div>
      )},
  ];

  const categoryColumns = [
    { key: 'name', header: 'Category',
      render: (r: Category) => (
        <div className="flex items-center gap-3">
          {r.icon && <img src={r.icon} className="w-8 h-8 rounded-lg object-contain" alt=""
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          <span className="font-semibold text-white">{r.name}</span>
        </div>
      )},
    { key: 'services', header: 'Services',
      render: (r: Category) => <span className="text-gray-300">{r._count?.services ?? 0} services</span> },
    { key: 'status', header: 'Status',
      render: (r: Category) => <Badge status={r.isActive ? 'VERIFIED' : 'SUSPENDED'} /> },
    { key: 'sortOrder', header: 'Sort Order',
      render: (r: Category) => <span className="text-gray-400">{r.sortOrder}</span> },
  ];

  return (
    <DashboardLayout title="Services" subtitle="Manage categories and service listings">

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: '#1e293b', border: '1px solid #2d3f5e' }}>
          {(['services', 'categories'] as const).map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setShowAddForm(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-white'
              }`}
              style={activeTab === tab ? { background: 'linear-gradient(135deg,#f0b429,#d49a0f)' } : {}}>
              {tab}
            </button>
          ))}
        </div>

        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#f0b429,#d49a0f)' }}>
          <Plus size={16} /> Add {activeTab === 'services' ? 'Service' : 'Category'}
        </button>
      </div>

      {/* Tables */}
      {activeTab === 'services'
        ? <DataTable columns={serviceColumns} data={services} isLoading={loadingServices} emptyText="No services found" />
        : <DataTable columns={categoryColumns} data={cats} isLoading={loadingCategories} emptyText="No categories found" />
      }

      {/* Modals */}
      {showAddForm && activeTab === 'services' && (
        <AddServiceModal categories={cats} onClose={() => setShowAddForm(false)} onSuccess={onRefreshServices} />
      )}
      {showAddForm && activeTab === 'categories' && (
        <AddCategoryModal onClose={() => setShowAddForm(false)} onSuccess={onRefreshCats} />
      )}
      {editService && (
        <EditServiceModal
          service={editService}
          categories={cats}
          onClose={() => setEditService(null)}
          onSuccess={() => { onRefreshServices(); setEditService(null); }}
        />
      )}

    </DashboardLayout>
  );
}
