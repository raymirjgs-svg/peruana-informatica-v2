'use client';

import { useState, useEffect } from 'react';
import { Percent, Plus, Search, Tag, TrendingDown, Edit, Trash2, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { discountService, type Discount } from '@/services/DiscountService';
import { DiscountModal } from '@/components/admin/discounts/DiscountModal';
import { toast } from 'sonner';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

  const fetchDiscounts = async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
    if (!token) return;
    try {
      const data = await discountService.getAllDiscounts(token);
      setDiscounts(data);
    } catch (error) {
      toast.error('Error al cargar descuentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    const token = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
    if (!token) return;

    try {
      await discountService.deleteDiscount(id, token);
      toast.success('Descuento eliminado');
      fetchDiscounts();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleOpenModal = (discount?: Discount) => {
    setSelectedDiscount(discount || null);
    setIsModalOpen(true);
  };

  const filteredDiscounts = discounts.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = discounts.filter(d => d.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="Descuentos y Promociones"
          description="Gestiona descuentos por categoría, producto o porcentaje"
          icon={Percent}
          action={
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Descuento
            </button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Descuentos Activos"
            value={activeCount.toString()}
            description="Promociones vigentes"
            icon={Percent}
            color="green"
          />
          <StatsCard
            title="Total Promociones"
            value={discounts.length.toString()}
            description="Histórico"
            icon={Tag}
            color="blue"
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lista de Descuentos</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar descuento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Cargando...</div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No hay descuentos registrados</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredDiscounts.map(discount => (
                <div key={discount.id} className={`rounded-2xl p-4 border transition-all relative ${discount.is_active
                    ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50'
                  }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 text-white rounded-full text-sm font-bold ${discount.is_active ? 'bg-green-600' : 'bg-gray-500'
                          }`}>
                          {discount.discount_type === 'percentage' ? `-${discount.discount_value}%` : `-S/. ${discount.discount_value}`}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium bg-white/50 px-2 py-1 rounded">
                          Aplica a: {discount.applies_to === 'all' ? 'Todo' : discount.applies_to}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{discount.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{discount.description}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(discount)}
                        className="p-1.5 bg-white dark:bg-gray-700 text-blue-600 rounded hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(discount.id)}
                        className="p-1.5 bg-white dark:bg-gray-700 text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(discount.valid_from).toLocaleDateString()} - {new Date(discount.valid_until).toLocaleDateString()}
                    </span>
                    <span className={`font-semibold flex items-center gap-1 ${discount.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                      {discount.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {discount.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DiscountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchDiscounts()}
        discountToEdit={selectedDiscount}
        token={typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : ''}
      />
    </AdminLayout>
  );
}
