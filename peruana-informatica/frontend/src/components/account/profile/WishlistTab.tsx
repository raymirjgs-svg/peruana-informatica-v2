import { Heart } from 'lucide-react';
import { WishlistItem } from '@/app/account/profile/types';

export function WishlistTab({ wishlist }: { wishlist: WishlistItem[] }) {
  return (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                                <Heart className="w-6 h-6 text-pink-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Mis Favoritos</h2>
                                <p className="text-gray-500">Productos que te gustan</p>
                            </div>
                        </div>

                        {wishlist.length === 0 ? (
                            <div className="text-center py-16">
                                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin favoritos aún</h3>
                                <p className="text-gray-500 mb-6">Guarda tus productos favoritos aquí para encontrarlos fácilmente más tarde</p>
                                <a
                                    href="/products"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-red-700 transition-all shadow-lg"
                                >
                                    <Heart className="w-5 h-5" />
                                    Explorar Productos
                                </a>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {wishlist.map((item) => (
                                    <div key={item.id} className="border-2 border-gray-100 rounded-xl p-4 hover:border-pink-200 transition-all">
                                        {item.product?.images?.[0] && (
                                            <img
                                                src={item.product.images[0].imagen}
                                                alt={item.product.name}
                                                className="w-full h-48 object-cover rounded-lg mb-3"
                                            />
                                        )}
                                        <h3 className="font-semibold text-gray-900 mb-2">{item.product?.name}</h3>
                                        <p className="text-lg font-bold text-blue-600">S/ {item.product?.price}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
  );
}
