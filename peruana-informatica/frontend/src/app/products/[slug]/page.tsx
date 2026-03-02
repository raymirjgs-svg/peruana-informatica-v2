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
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
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
                  <div className="w-24 h-24 text-gray-300"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
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
                      <div className="w-8 h-8 text-gray-300"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Badges */}
              <div className="flex gap-2 mt-4">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">En Stock</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Envío Gratis</span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">Garantía</span>
              </div>
            </div>

            {/* Información del producto */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-snug mb-4">{product.name}</h1>

              {/* Precio */}
              {/* Precio */}
              <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl mb-5 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-1">
                  {(() => {
                    const pWeb = Number(product.priceWeb || 0);
                    const pCot = Number(product.priceCot || 0);
                    const pList = Number(product.price || 0);

                    if (pList > 0) {
                      return (
                        <div className="flex items-baseline gap-4">
                          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">S/. {pList.toFixed(2)}</span>
                        </div>
                      );
                    }

                    return <span className="text-3xl font-bold text-gray-600">Consultar Precio</span>;
                  })()}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Precio especial con cualquier medio de pago</p>

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
                  className="w-full bg-brand-red-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-brand-red-700 transition active:scale-95 shadow-md"
                >
                  Comprar Ahora
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-gray-900 dark:bg-gray-700 text-white py-3.5 rounded-xl font-bold text-base hover:bg-gray-800 dark:hover:bg-gray-600 transition active:scale-95 shadow-md"
                >
                  Agregar al Carrito
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleToggleWishlist}
                    className={`py-3 rounded-xl font-medium transition active:scale-95 flex items-center justify-center gap-2 ${isInWishlist(product.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    <svg className="w-4 h-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isInWishlist(product.id) ? 'En Favoritos' : 'Favoritos'}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Enlace copiado al portapapeles');
                    }}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition active:scale-95"
                  >
                    Compartir
                  </button>
                </div>
              </div>

              {/* Información de envío */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Información de Envío</h4>
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
                { id: 'description', label: 'Descripción' },
                { id: 'specifications', label: 'Especificaciones' },
                { id: 'reviews', label: 'Reseñas' },
                { id: 'shipping', label: 'Envío y Devoluciones' },
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
                    <h4 className="text-lg font-semibold mb-3 text-green-600">Opciones de Envío</h4>
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
                    <h4 className="text-lg font-semibold mb-3 text-blue-600">Política de Devoluciones</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 flex-none"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>
                        <div>
                          <div className="font-medium">30 días para devoluciones</div>
                          <div className="text-sm text-gray-600">Sin preguntas, reembolso completo</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 flex-none"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>
                        <div>
                          <div className="font-medium">Producto en condiciones originales</div>
                          <div className="text-sm text-gray-600">Con embalaje y accesorios</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 flex-none"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>
                        <div>
                          <div className="font-medium">Envío de devolución gratuito</div>
                          <div className="text-sm text-gray-600">Recogemos en tu domicilio</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h5 className="font-semibold text-yellow-800 mb-2">¿Necesitas ayuda?</h5>
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
