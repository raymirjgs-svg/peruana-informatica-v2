import { Product } from '../types';

interface LaptopCardProps {
  laptop: Product;
  isSelected: boolean;
  onAdd: (laptop: Product) => void;
}

export function LaptopCard({ laptop, isSelected, onAdd }: LaptopCardProps) {
  return (
                    <div
                      key={laptop.id || laptop.cod_producto}
                      className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition"
                    >
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{laptop.name}</h3>

                        {/* Mostrar código interno */}
                        <p className="text-sm text-gray-500 mb-1">Código: {laptop.codigo_interno}</p>

                        {/* Mostrar subcategorías */}
                        {laptop.subCategories && laptop.subCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {laptop.subCategories.slice(0, 2).map((subcategory) => (
                              <span
                                key={subcategory.id}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {subcategory.name}
                              </span>
                            ))}
                            {laptop.subCategories.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{laptop.subCategories.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {laptop.component_specs && (
                          <div className="text-sm text-gray-600 mb-3 space-y-1">
                            {laptop.component_specs.processor && (
                              <div><strong>Procesador:</strong> {laptop.component_specs.processor}</div>
                            )}
                            {laptop.component_specs.ram && (
                              <div><strong>RAM:</strong> {laptop.component_specs.ram}</div>
                            )}
                            {laptop.component_specs.storage && (
                              <div><strong>Almacenamiento:</strong> {laptop.component_specs.storage}</div>
                            )}
                          </div>
                        )}

                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                          {laptop.short_description ? (
                            laptop.short_description
                          ) : laptop.description ? (
                            // Remove HTML tags from description and show only text
                            laptop.description.replace(/<[^>]*>/g, '').substring(0, 100) +
                            (laptop.description.replace(/<[^>]*>/g, '').length > 100 ? '...' : '')
                          ) : 'Sin descripción'}
                        </p>

                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xl font-bold text-blue-600">S/. {
                            typeof laptop.price === 'number'
                              ? laptop.price.toFixed(2)
                              : typeof laptop.price === 'string'
                                ? parseFloat(laptop.price).toFixed(2)
                                : '0.00'
                          }</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${laptop.stock > 5 ? 'bg-green-100 text-green-800' :
                            laptop.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {laptop.stock > 5 ? 'En stock' :
                              laptop.stock > 0 ? `Solo ${laptop.stock} unidad(es)` : 'Agotado'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAdd(laptop);
                            }}
                            className={`flex-1 py-2 rounded-lg transition ${isSelected
                              ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            disabled={laptop.stock === 0}
                          >
                            {isSelected ? 'Agregado ✓' : 'Agregar a Cotización'}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (laptop.slug) {
                                window.open(`/products/${laptop.slug}`, '_blank');
                              } else {
                                window.open(`/products/${laptop.cod_producto || laptop.id}`, '_blank');
                              }
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            title="Ver detalles del producto"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
  );
}
