'use client';

import { useState, useEffect } from 'react';
import { Ticket, Plus, Search, Calendar, Percent, Trash2, Edit, Power, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useSession } from 'next-auth/react';
import { couponService, type Coupon } from '@/services/CouponService';
import { CouponModal } from '@/components/admin/coupons/CouponModal';
import { toast } from 'sonner';

export default function CouponsPage() {
  const { data: session } = useSession();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    if (!session?.accessToken) return;
    try {
      const data = await couponService.getAllCoupons(session.accessToken);
      setCoupons(data);
    } catch (error) {
      toast.error('Error al cargar cupones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchCoupons();
    }
  }, [session]);

  const handleOpenModal = (coupon?: Coupon) => {
    setSelectedCoupon(coupon || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;
    if (!session?.accessToken) return;

    try {
      await couponService.deleteCoupon(id, session.accessToken);
      toast.success('Cupón eliminado');
      fetchCoupons();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleToggleStatus = async (id: number) => {
    if (!session?.accessToken) return;
    try {
      const coupon = coupons.find(c => c.id === id);
      if (!coupon) return;
      const newStatus = !coupon.is_active;
      await couponService.toggleStatus(id, newStatus, session.accessToken);
      toast.success('Estado actualizado');
      fetchCoupons();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats Calculations
  const activeCoupons = coupons.filter(c => c.is_active).length;
  const totalUses = coupons.reduce((acc, curr) => acc + curr.current_uses, 0);

  return (
    <AdminLayout>
      <div className="p-6">
        <PageHeader
          title="Cupones de Descuento"
          description="Gestiona cupones y códigos promocionales"
          icon={Ticket}
          action={
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Cupón
            </button>
          }
        />

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <StatsCard
            title="Cupones Activos"
            value={activeCoupons.toString()}
            description="Disponibles para uso"
            icon={Ticket}
            color="green"
          />
          <StatsCard
            title="Total de Canjes"
            value={totalUses.toString()}
            description="Veces usados por clientes"
            icon={Ticket}
            color="blue"
          />
          <StatsCard
            title="Total Cupones"
            value={coupons.length.toString()}
            description="Registrados en sistema"
            icon={Percent}
            color="purple"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lista de Cupones</h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cupón..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">Cargando...</div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No se encontraron cupones</div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon) => (
                <div key={coupon.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-mono font-bold tracking-wide">
                          {coupon.code}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${coupon.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                          {coupon.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {coupon.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className="text-xs text-gray-500 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded">
                          {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `S/. ${coupon.value} OFF`}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {coupon.description || 'Sin descripción'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        {coupon.valid_until && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expira: {new Date(coupon.valid_until).toLocaleDateString()}
                          </span>
                        )}
                        <span title="Usos / Límite">
                          Usos: {coupon.current_uses} / {coupon.max_uses ? coupon.max_uses : '∞'}
                        </span>
                        {coupon.min_purchase && coupon.min_purchase > 0 && (
                          <span>Min. Compra: S/. {coupon.min_purchase}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-gray-100 dark:border-gray-700 pt-3 md:pt-0">
                      <button
                        onClick={() => handleToggleStatus(coupon.id)}
                        className={`p-2 rounded-lg transition-colors ${coupon.is_active
                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        title={coupon.is_active ? "Desactivar" : "Activar"}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(coupon)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <CouponModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCoupons()}
        couponToEdit={selectedCoupon}
        token={session?.accessToken || ''}
      />
    </AdminLayout>
  );
}
