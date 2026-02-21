// ============================================
// 4. src/app/products/[slug]/page.tsx (DETALLE)
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { Navigation } from '@/components/common/Navigation';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { SettingsService, CompanySettings } from '@/services/SettingsService';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { ProductReviews } from '@/components/product/ProductReviews';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addItem } = useCart();

  // Usar las imágenes reales del producto si están disponibles
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const productImages = product?.images && product.images.length > 0
    ? product.images.map(img => img.imagen.startsWith('http') ? img.imagen : `${apiUrl}/images/products/${img.imagen}`)
    : product?.image
      ? [product.image.startsWith('http') ? product.image : `${apiUrl}/images/products/${product.image}`]
      : ['/images/no-image.svg'];

  useEffect(() => {
    const loadData = async () => {
      // Cargar configuración
      try {
        const settingsData = await SettingsService.getPublicSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading settings:', error);
      }

      if (!slug) return;
      const productService = new ProductService();
      // Decodificar el slug para manejar caracteres especiales
      const decodedSlug = decodeURIComponent(slug);
      const prod = await productService.getProductBySlug(decodedSlug);
      setProduct(prod);

      // Cargar productos relacionados (misma categoría)
      if (prod && prod.category) {
        // Buscar productos de la misma categoría
        const queryParams = new URLSearchParams({
          page: '1',
          limit: '4',
          category: prod.category
        });

        try {
          const result = await productService.getProductsWithFilters(queryParams.toString());
          // Filtrar el producto actual y tomar solo 3
          setRelatedProducts(result.products.filter((p: Product) => p.id !== prod.id).slice(0, 3));
        } catch (error) {
          console.error('Error loading related products:', error);
          // Fallback a productos generales si falla el filtro
          const { products } = await productService.getProducts(1, 4);
          setRelatedProducts(products.filter((p: Product) => p.id !== prod.id).slice(0, 3));
        }
      } else if (prod) {
        // Fallback si no tiene categoría
        const { products } = await productService.getProducts(1, 4);
        setRelatedProducts(products.filter((p: Product) => p.id !== prod.id).slice(0, 3));
      }

      setLoading(false);
    };
    loadData();
  }, [slug]);

  const handleAddToCart = () => {
    if (product && product.isAvailable()) {
      for (let i = 0; i < quantity; i++) {
        addItem(product);
      }
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = '/cart';
  };

  const handleToggleWishlist = () => {
    if (!product) return;

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Producto no encontrado</h2>
          <p className="text-gray-600 mb-4">El producto que buscas no existe o ha sido removido.</p>
          <Link href="/products" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Ver todos los productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        items={[
          { name: 'Inicio', href: '/' },
          { name: 'Productos', href: '/products' },
          { name: product.name, href: `/products/${product.slug}` },
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Sección principal del producto */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Galería de imágenes */}
            <div>
              {/* Imagen principal */}
              <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center mb-4 border-2 border-gray-200 overflow-hidden">
                {productImages[selectedImage] ? (
                  <img
                    src={productImages[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/no-image.svg";
                    }}
                  />
                ) : (
                  <div className="text-9xl">🖥️</div>
                )}
              </div>

              {/* Miniaturas */}
              <div className="flex gap-2 justify-center">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-2xl transition ${selectedImage === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-100 hover:border-gray-300'
                      }`}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/no-image.svg";
                        }}
                      />
                    ) : (
                      <div className="text-xl">🖥️</div>
                    )}
                  </button>
                ))}
              </div>

              {/* Badges */}
              <div className="flex gap-2 mt-4">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  ✅ En Stock
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  🚚 Envío Gratis
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  🛡️ Garantía
                </span>
              </div>
            </div>

            {/* Información del producto */}
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {'★★★★★'.split('').map((star, i) => (
                    <span key={i} className={i < 4 ? 'text-yellow-400' : 'text-gray-300'}>{star}</span>
                  ))}
                </div>
                <span className="text-gray-600">(4.2)</span>
                <span className="text-blue-600 hover:underline cursor-pointer">Ver 156 reseñas</span>
              </div>

              {/* Precio */}
              {/* Precio */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl mb-6 border border-yellow-200">
                <div className="flex flex-col gap-1">
                  {(() => {
                    const pWeb = Number(product.priceWeb || 0);
                    const pCot = Number(product.priceCot || 0);
                    const pList = Number(product.price || 0);

                    if (pList > 0) {
                      return (
                        <div className="flex items-baseline gap-4">
                          <span className="text-4xl font-bold text-blue-600">S/. {pList.toFixed(2)}</span>
                        </div>
                      );
                    }

                    return <span className="text-3xl font-bold text-gray-600">Consultar Precio</span>;
                  })()}
                </div>
                <p className="text-sm text-gray-600 mt-2">💳 Precio especial con cualquier medio de pago</p>

                {/* Precio Distribuidor (Condicional) */}
                {settings?.show_distributor_price_in_detail && (product.priceDis || 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-yellow-200">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-gray-500">Precio Distribuidor:</span>
                      <span className="text-lg font-bold text-gray-700">S/. {Math.ceil(product.priceDis || 0).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Consultar precios y distribuciones con su vendedor o por el ws{' '}
                      <a
                        href={`https://wa.me/51${(settings.company_whatsapp || '988552455').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline font-bold"
                      >
                        {settings.company_whatsapp || '988552455'}
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* Descripción corta */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Descripción:</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.shortDescription ||
                    product.description
                      .replace(/<[^>]*>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim()
                      .substring(0, 150) + '...'}
                </p>
              </div>

              {/* Información clave */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Stock disponible</p>
                  <p className="text-xl font-bold text-green-600">{product.stock} unidades</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Categoría</p>
                  <p className="text-xl font-bold text-gray-800">{product.category}</p>
                </div>
              </div>

              {/* Selector de cantidad */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad:</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
                  >
                    -
                  </button>
                  <span className="w-16 h-10 border border-gray-300 rounded-lg flex items-center justify-center font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600 ml-2">({product.stock} disponibles)</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition transform hover:scale-105 shadow-lg"
                >
                  🚀 Comprar Ahora
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition transform hover:scale-105 shadow-lg"
                >
                  🛒 Agregar al Carrito
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleToggleWishlist}
                    className={`py-3 rounded-xl font-medium transition transform hover:scale-105 ${isInWishlist(product.id)
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                  >
                    {isInWishlist(product.id) ? '❤️ En Favoritos' : '🤍 Agregar a Favoritos'}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Enlace copiado al portapapeles');
                    }}
                    className="bg-gray-100 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
                  >
                    📤 Compartir
                  </button>
                </div>
              </div>

              {/* Información de envío */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🚚 Información de Envío</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Envío gratis a todo Lima</li>
                  <li>• Entrega en 24-48 horas</li>
                  <li>• Provincias: 2-5 días hábiles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de información detallada */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          {/* Tab headers */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { id: 'description', label: '📝 Descripción', icon: '📝' },
                { id: 'specifications', label: '⚙️ Especificaciones', icon: '⚙️' },
                { id: 'reviews', label: '⭐ Reseñas', icon: '⭐' },
                { id: 'shipping', label: '🚚 Envío', icon: '🚚' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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

          {/* Tab content */}
          <div className="p-8">
            {activeTab === 'description' && (
              <div>
                <h3 className="text-2xl font-bold mb-4">Descripción del Producto</h3>
                <div
                  className="prose max-w-none [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-gray-300 [&_th]:p-3 [&_th]:bg-gray-100 [&_th]:text-left [&_td]:border [&_td]:border-gray-300 [&_td]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  dangerouslySetInnerHTML={{ __html: product.description || 'No hay descripción disponible para este producto.' }}
                />
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="text-2xl font-bold mb-4">Especificaciones Técnicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Extract specifications from product description */}
                    {product.description && (() => {
                      // Parse specifications from HTML table in description
                      const specs: { label: string; value: string }[] = [];
                      const cleanDescription = product.description.replace(/<[^>]*>/g, ' ');

                      // Common specification patterns
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

                      // If we found specifications, display them
                      if (specs.length > 0) {
                        return specs.map((spec, index) => (
                          <div key={index} className="border-b border-gray-200 pb-2">
                            <dt className="font-semibold text-gray-800">{spec.label}</dt>
                            <dd className="text-gray-600">{spec.value}</dd>
                          </div>
                        ));
                      }

                      // Fallback to default specifications if none found
                      return (
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
                      );
                    })()}
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

        {/* Productos relacionados (Amazon Style) */}
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
}
