'use client';

import { useRef } from 'react';
import type { Product } from '@/models/Product';
import type { CompanySettings } from '@/services/SettingsService';
import { ProductReviews } from '@/components/product/ProductReviews';
import { sanitizeHtml } from '@/lib/sanitize';
import { FileText, List, RotateCcw, Star, Truck } from 'lucide-react';

interface ProductTabsProps {
  product: Product;
  activeTab: string;
  onTabChange: (tab: string) => void;
  settings: CompanySettings | null;
}

const TABS = [
  { id: 'description', label: 'Descripción', icon: FileText },
  { id: 'specifications', label: 'Especificaciones', icon: List },
  { id: 'reviews', label: 'Reseñas', icon: Star },
  { id: 'shipping', label: 'Envío', icon: Truck },
];

export function ProductTabs({ product, activeTab, onTabChange, settings }: ProductTabsProps) {
  const specs = Array.isArray(product.specifications) ? product.specifications : [];
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Patrón ARIA de pestañas: flechas ←/→,Inicio y Fin mueven el foco y activan.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = TABS.length - 1;
    let next = index;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;

    event.preventDefault();
    const target = TABS[next];
    if (!target) return;
    onTabChange(target.id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-8">
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav
          role="tablist"
          aria-label="Información del producto"
          className="flex gap-1 px-4 md:px-8 min-w-max"
        >
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                ref={(el) => { tabRefs.current[index] = el; }}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`py-4 px-3 md:px-4 border-b-2 font-medium text-sm transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-brand-red-600 text-brand-red-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Todos los paneles existen en el DOM (los inactivos, ocultos) para que
          aria-controls apunte siempre a un id real. */}
      {TABS.map((tab) => (
        <div
          key={tab.id}
          className="p-6 md:p-8"
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
        >
        {activeTab === 'description' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción del producto</h2>
            <div
              className="prose max-w-[70ch] [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-gray-300 [&_th]:p-3 [&_th]:bg-gray-100 [&_th]:text-left [&_td]:border [&_td]:border-gray-300 [&_td]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              dangerouslySetInnerHTML={{
                __html:
                  sanitizeHtml(product.description) ||
                  'No hay descripción disponible para este producto.',
              }}
            />
          </div>
        )}

        {activeTab === 'specifications' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Especificaciones técnicas
            </h2>
            {specs.length > 0 ? (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                {specs.map((spec, index) => (
                  <div
                    key={`${spec.key}-${index}`}
                    className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-2.5"
                  >
                    <dt className="text-sm text-gray-500">{spec.key}</dt>
                    <dd className="text-sm font-medium text-gray-900 text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-gray-500">
                Este producto no tiene especificaciones técnicas registradas.
              </p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="py-4">
            <ProductReviews productId={product.id} />
          </div>
        )}

        {activeTab === 'shipping' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Información de envío y devoluciones
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-brand-red-600" />
                  Opciones de envío
                </h3>
                <div className="space-y-3">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-900">
                      Entrega inmediata en Arequipa y Lima
                    </div>
                    <div className="text-sm text-gray-600">Tiendas en ambas ciudades</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-900">Envíos a todo el Perú</div>
                    <div className="text-sm text-gray-600">2-5 días hábiles en provincias</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-brand-red-600" />
                  Política de devoluciones
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 30 días para devoluciones, reembolso completo</li>
                  <li>• Producto en condiciones originales, con embalaje y accesorios</li>
                  <li>• Envío de devolución gratuito</li>
                </ul>

                <div className="mt-6 rounded-lg border border-gray-200 p-4 text-sm">
                  <p className="font-semibold text-gray-900 mb-1">¿Necesitas ayuda?</p>
                  {settings?.company_phone && (
                    <p className="text-gray-600">
                      Teléfono:{' '}
                      <a
                        href={`tel:${settings.company_phone.replace(/\s/g, '')}`}
                        className="text-brand-red-600 hover:underline"
                      >
                        {settings.company_phone}
                      </a>
                    </p>
                  )}
                  {settings?.company_email && (
                    <p className="text-gray-600">
                      Email:{' '}
                      <a
                        href={`mailto:${settings.company_email}`}
                        className="text-brand-red-600 hover:underline"
                      >
                        {settings.company_email}
                      </a>
                    </p>
                  )}
                  {settings?.company_address && (
                    <p className="mt-2 text-gray-600 whitespace-pre-line">
                      {settings.company_address}
                    </p>
                  )}
                  {settings?.store_hours && (
                    <p className="mt-2 text-gray-600">Horario: {settings.store_hours}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      ))}
    </div>
  );
}
