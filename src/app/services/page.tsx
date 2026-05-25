'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { servicesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Service, Category } from '@/types';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ['services-admin'],
    queryFn: async () => { const res = await servicesApi.getAll({ limit: 50 }); return res.data.data; },
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const res = await servicesApi.getCategories(); return res.data.data; },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      servicesApi.updateService(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services-admin'] }),
  });

  const services: Service[] = servicesData ?? [];
  const cats: Category[] = categories ?? [];

  const serviceColumns = [
    { key: 'name', header: 'Service',
      render: (r: Service) => (
        <div className="flex items-center gap-3">
          {r.image && <img src={r.image} className="w-9 h-9 rounded-lg object-cover" alt="" />}
          <div>
            <p className="font-semibold text-white">{r.name}</p>
            <p className="text-xs text-gray-400">{r.category?.name}</p>
          </div>
        </div>
      )},
    { key: 'basePrice', header: 'Base Price',
      render: (r: Service) => <span className="font-bold text-gold-400">{formatCurrency(r.basePrice)}</span> },
    { key: 'duration', header: 'Duration',
      render: (r: Service) => <span className="text-gray-300 flex items-center gap-1"><Clock size={13} />{r.duration} min</span> },
    { key: 'providers', header: 'Providers',
      render: (r: Service) => <span className="text-gray-300">{r._count?.providers ?? 0}</span> },
    { key: 'status', header: 'Status',
      render: (r: Service) => <Badge status={r.isActive ? 'VERIFIED' : 'SUSPENDED'} /> },
    { key: 'actions', header: '',
      render: (r: Service) => (
        <div className="flex gap-2">
          <button onClick={() => toggleMutation.mutate({ id: r.id, isActive: !r.isActive })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${r.isActive ? 'text-red-400 border-red-500/30 hover:bg-red-400/10' : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-400/10'}`}>
            {r.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )},
  ];

  const categoryColumns = [
    { key: 'name', header: 'Category',
      render: (r: Category) => (
        <div className="flex items-center gap-3">
          {r.icon && <img src={r.icon} className="w-8 h-8 rounded-lg object-contain" alt="" />}
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
      {/* Tab switcher + Add button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: '#1e293b', border: '1px solid #2d3f5e' }}>
          {(['services', 'categories'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-white'}`}
              style={activeTab === tab ? { background: 'linear-gradient(135deg,#f0b429,#d49a0f)' } : {}}>
              {tab}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#f0b429,#d49a0f)' }}>
          <Plus size={16} /> Add {activeTab === 'services' ? 'Service' : 'Category'}
        </button>
      </div>

      {activeTab === 'services'
        ? <DataTable columns={serviceColumns} data={services} isLoading={loadingServices} emptyText="No services found" />
        : <DataTable columns={categoryColumns} data={cats} isLoading={loadingCategories} emptyText="No categories found" />
      }
    </DashboardLayout>
  );
}
