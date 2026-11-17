'use client';

import type { Product } from '@/models/Product';
import { ProductReviews } from '@/components/product/ProductReviews';
import { sanitizeHtml } from '@/lib/sanitize';

interface ProductTabsProps {
  product: Product;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'description', label: '📝 Descripción' },
  { id: 'specifications', label: '⚙️ Especificaciones' },
  { id: 'reviews', label: '⭐ Reseñas' },
  { id: 'shipping', label: '🚚 Envío' },
];

function parseSpecifications(description: string): { label: string; value: string }[] {
  const specs: { label: string; value: string }[] = [];
  const cleanDescription = description.replace(/<[^>]*>/g, ' ');

  const patterns = [
    { label: 'Marca', regex: /Marca\s*[:\-]?\s*([^\s].*?)(?=\s*[A-Z]|$)/i },
    { label: 'Modelo', regex: /Modelo\s*[:\-]?\s*([^\s].*?)(?=\s*[A-Z]|$)/i },
    { label: 'Procesador', regex: /(Intel|AMD|Apple).*?(i[3579]|Ryzen|Core|M\d+|Celeron|Pentium)[^\s]*/i },
    { label: 'RAM', regex: /(\d+)\s*(GB|GB DDR4|GB DDR5|GB RAM)/i },
    { label: 'Almacenamiento', regex: /(\d+)\s*(GB|TB)\s*(SSD|HDD|NVMe)/i },
    { label: 'Pantalla', regex: /(\d+\.?\d*)["”]/ },
    { label: 'Gráficos', regex: /(NVIDIA|AMD|Intel).*?(GTX|RTX|HD|UHD|Iris|Arc|Radeon|GeForce)[^\s]*/i }
  ];

  patterns.forEach(pattern => {
    const match = cleanDescription.match(pattern.regex);
    if (match) {
      specs.push({ label: pattern.label, value: match[0].trim() });
    }
  });

  return specs;
}

export function ProductTabs({ product, activeTab, onTabChange }: ProductTabsProps) {
  const specs = product.description ? parseSpecifications(product.description) : [];

  return (
    <div className="bg-white rounded-xl shadow-lg mb-8">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-8">
        {activeTab === 'description' && (
          <div>
            <h3 className="text-2xl font-bold mb-4">Descripción del Producto</h3>
            <div
              className="prose max-w-none [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-gray-300 [&_th]:p-3 [&_th]:bg-gray-100 [&_th]:text-left [&_td]:border [&_td]:border-gray-300 [&_td]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) || 'No hay descripción disponible para este producto.' }}
            />
          </div>
        )}

        {activeTab === 'specifications' && (
          <div>
            <h3 className="text-2xl font-bold mb-4">Especificaciones Técnicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {specs.length > 0 ? (
                  specs.map((spec, index) => (
                    <div key={index} className="border-b border-gray-200 pb-2">
                      <dt className="font-semibold text-gray-800">{spec.label}</dt>
                      <dd className="text-gray-600">{spec.value}</dd>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="border-b border-gray-200 pb-2">
                      <dt className="font-semibold text-gray-800">Marca</dt>
                      <dd className="text-gray-600">Marca Premium</dd>
                    </div>
                    <div className="border-b border-gray-200 pb-2">
                      <dt className="font-semibold text-gray-800">Modelo</dt>
                      <dd className="text-gray-600">MP-2024-PRO</dd>
                    </div>
                    <div className="border-b border-gray-200 pb-2">
                      <dt className="font-semibold text-gray-800">Dimensiones</dt>
                      <dd className="text-gray-600">30 x 20 x 15 cm</dd>
                    </div>
                    <div className="border-b border-gray-200 pb-2">
                      <dt className="font-semibold text-gray-800">Peso</dt>
                      <dd className="text-gray-600">2.5 kg</dd>
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-2">
                  <dt className="font-semibold text-gray-800">Color</dt>
                  <dd className="text-gray-600">Negro</dd>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <dt className="font-semibold text-gray-800">Material</dt>
                  <dd className="text-gray-600">Aluminio y plástico ABS</dd>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <dt className="font-semibold text-gray-800">Garantía</dt>
                  <dd className="text-gray-600">2 años</dd>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <dt className="font-semibold text-gray-800">Certificaciones</dt>
                  <dd className="text-gray-600">CE, FCC, RoHS</dd>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="py-4">
            <ProductReviews productId={product.id} />
          </div>
        )}

        {activeTab === 'shipping' && (
          <div>
            <h3 className="text-2xl font-bold mb-4">Información de Envío y Devoluciones</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-3 text-green-600">🚚 Opciones de Envío</h4>
                <div className="space-y-4">
                  <div className="border border-green-200 rounded-lg p-4">
                    <div className="font-semibold">Envío Estándar - GRATIS</div>
                    <div className="text-sm text-gray-600">2-5 días hábiles</div>
                    <div className="text-sm text-gray-600">Para pedidos mayores a S/. 100</div>
                  </div>
                  <div className="border border-blue-200 rounded-lg p-4">
                    <div className="font-semibold">Envío Express - S/. 15</div>
                    <div className="text-sm text-gray-600">24-48 horas</div>
                    <div className="text-sm text-gray-600">Solo Lima Metropolitana</div>
                  </div>
                  <div className="border border-purple-200 rounded-lg p-4">
                    <div className="font-semibold">Recojo en Tienda - GRATIS</div>
                    <div className="text-sm text-gray-600">Disponible en 2 horas</div>
                    <div className="text-sm text-gray-600">Av. Tecnología 123, Lima</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3 text-blue-600">🔄 Política de Devoluciones</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="text-green-500 mt-1">✅</div>
                    <div>
                      <div className="font-medium">30 días para devoluciones</div>
                      <div className="text-sm text-gray-600">Sin preguntas, reembolso completo</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-green-500 mt-1">✅</div>
                    <div>
                      <div className="font-medium">Producto en condiciones originales</div>
                      <div className="text-sm text-gray-600">Con embalaje y accesorios</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-green-500 mt-1">✅</div>
                    <div>
                      <div className="font-medium">Envío de devolución gratuito</div>
                      <div className="text-sm text-gray-600">Recogemos en tu domicilio</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h5 className="font-semibold text-yellow-800 mb-2">📞 ¿Necesitas ayuda?</h5>
                  <p className="text-sm text-yellow-700">
                    Contáctanos al +51 1 234-5678 o envía un email a soporte@peruanainformatica.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
