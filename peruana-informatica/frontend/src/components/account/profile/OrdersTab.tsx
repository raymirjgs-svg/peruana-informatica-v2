import { Package, ShoppingBag } from 'lucide-react';
import { CustomerOrder } from '@/app/account/profile/types';

export function OrdersTab({ orders }: { orders: CustomerOrder[] }) {
  return (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Mis Pedidos</h2>
                                <p className="text-gray-500">Historial de compras y pedidos realizados</p>
                            </div>
                        </div>

                        {orders.length === 0 ? (
                            <div className="text-center py-16">
                                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin pedidos aún</h3>
                                <p className="text-gray-500 mb-6">Tus pedidos aparecerán aquí una vez que realices tu primera compra</p>
                                <a
                                    href="/products"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    Explorar Productos
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="font-semibold text-gray-900">Pedido #{order.id}</p>
                                                <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('es-ES')}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <p><span className="font-semibold">Total:</span> S/ {order.total}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
  );
}
