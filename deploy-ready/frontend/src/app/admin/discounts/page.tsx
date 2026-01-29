'use client';

import { useState, useEffect } from 'react';
import { Percent, Plus, Search, Tag, TrendingDown, Edit, Trash2, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useSession } from 'next-auth/react';
import { discountService, type Discount } from '@/services/DiscountService';
import { DiscountModal } from '@/components/admin/discounts/DiscountModal';
import { toast } from 'sonner';

export default function DiscountsPage() {
  const { data: session } = useSession();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

  const fetchDiscounts = async () => {
    if (!session?.accessToken) return;
    try {
      const data = await discountService.getAllDiscounts(session.accessToken);
      setDiscounts(data);
    } catch (error) {
      toast.error('Error al cargar descuentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) fetchDiscounts();
  }, [session]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    if (!session?.accessToken) return;

    try {
      await discountService.deleteDiscount(id, session.accessToken);
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
      <div className="p-6">
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

        <div className="grid gap-6 md:grid-cols-3 mb-8">
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lista de Descuentos</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar descuento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                <div key={discount.id} className={`border-2 rounded-lg p-4 hover:shadow-md transition-shadow relative ${discount.is_active
                    ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800'
                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
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
        token={session?.accessToken || ''}
      />
    </AdminLayout>
  );
}
