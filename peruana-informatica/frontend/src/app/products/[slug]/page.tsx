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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const toAbsolute = (url: string) => url.startsWith('http') ? url : `${apiUrl}/images/products/${url}`;
  const mainImg = product?.image ? toAbsolute(product.image) : null;
  const galleryImgs = product?.images && product.images.length > 0
    ? product.images.map(img => toAbsolute(img.imagen))
    : [];
  const allImgs = mainImg ? [mainImg, ...galleryImgs.filter(u => u !== mainImg)] : galleryImgs;
  const productImages = allImgs.length > 0 ? allImgs : ['/no-image.svg'];

  useEffect(() => {
    const loadData = async () => {
      try {
        const settingsData = await SettingsService.getPublicSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading settings:', error);
      }

      if (!slug) return;
      const productService = new ProductService();
      const decodedSlug = decodeURIComponent(slug);
      const prod = await productService.getProductBySlug(decodedSlug);
      setProduct(prod);

      if (prod && prod.category) {
        const queryParams = new URLSearchParams({ page: '1', limit: '4', category: prod.category });
        try {
          const result = await productService.getProductsWithFilters(queryParams.toString());
          setRelatedProducts(result.products.filter((p: Product) => p.id !== prod.id).slice(0, 3));
        } catch {
          const { products } = await productService.getProducts(1, 4);
          setRelatedProducts(products.filter((p: Product) => p.id !== prod.id).slice(0, 3));
        }
      } else if (prod) {
        const { products } = await productService.getProducts(1, 4);
        setRelatedProducts(products.filter((p: Product) => p.id !== prod.id).slice(0, 3));
      }

      setLoading(false);
    };
    loadData();
  }, [slug]);

  const handleAddToCart = () => {
    if (product && product.isAvailable()) {
      for (let i = 0; i < quantity; i++) addItem(product);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = '/cart';
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    if (isInWishlist(product.id)) removeFromWishlist(product.id);
    else addToWishlist(product);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Producto no encontrado</h2>
          <p className="text-sm text-gray-500 mb-6">El producto que buscas no existe o ha sido removido.</p>
          <Link href="/products" className="bg-brand-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-red-700 transition">
            Ver todos los productos
          </Link>
        </div>
      </div>
    );
  }

  const priceList = Number(product.price || 0);
  const priceDis = Number(product.priceDis || 0);

  const getEmbedUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      // YouTube: youtube.com/watch?v=ID, youtube.com/shorts/ID, or youtu.be/ID
      if (u.hostname.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
        // Shorts: /shorts/ID
        const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
        if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      }
      if (u.hostname === 'youtu.be') {
        const id = u.pathname.slice(1);
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      // Vimeo: vimeo.com/ID
      if (u.hostname.includes('vimeo.com')) {
        const id = u.pathname.replace(/\//g, '');
        if (id) return `https://player.vimeo.com/video/${id}`;
      }
      // Anything else: return as-is (assume it's already embeddable)
      return url;
    } catch {
      return null;
    }
  };

  const tabs = [
    { id: 'description', label: 'Descripción' },
    { id: 'specifications', label: 'Especificaciones' },
    { id: 'reviews', label: 'Reseñas' },
    { id: 'shipping', label: 'Envío' },
    ...(product.video_url ? [{ id: 'video', label: 'Video' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation
        items={[
          { name: 'Inicio', href: '/' },
          { name: 'Productos', href: '/products' },
          { name: product.name, href: `/products/${product.slug}` },
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start mb-12">

          {/* ── LEFT: Gallery + Tabs ── */}
          <div className="space-y-5">
            {/* Main image */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="h-[380px] flex items-center justify-center p-6">
                <img
                  src={productImages[selectedImage] || '/no-image.svg'}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/no-image.svg'; }}
                />
              </div>

              {/* Thumbnails */}
              {productImages.length > 1 && (
                <div className="flex gap-2 px-6 pb-5">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-14 h-14 rounded-lg border-2 overflow-hidden flex-none transition-all duration-200 ${
                        selectedImage === idx
                          ? 'border-brand-red-600 ring-1 ring-brand-red-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Vista ${idx + 1}`}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/no-image.svg'; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <nav className="flex border-b border-gray-200 dark:border-gray-800 px-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === tab.id
                        ? 'border-brand-red-600 text-brand-red-600'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="p-6">
                {activeTab === 'description' && (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-gray-300 [&_th]:p-3 [&_th]:bg-gray-100 [&_th]:text-left [&_td]:border [&_td]:border-gray-300 [&_td]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: product.description || 'Sin descripción disponible.' }}
                  />
                )}

                {activeTab === 'specifications' && (
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Especificaciones Técnicas</h3>
                    <div className="space-y-2">
                      {product.description && (() => {
                        const specs: { label: string; value: string }[] = [];
                        const cleanDescription = product.description.replace(/<[^>]*>/g, ' ');
                        const patterns = [
                          { label: 'Marca', regex: /Marca\s*[:\-]?\s*([^\s].*?)(?=\s*[A-Z]|$)/i },
                          { label: 'Modelo', regex: /Modelo\s*[:\-]?\s*([^\s].*?)(?=\s*[A-Z]|$)/i },
                          { label: 'Procesador', regex: /(Intel|AMD|Apple).*?(i[3579]|Ryzen|Core|M\d+|Celeron|Pentium)[^\s]*/i },
                          { label: 'RAM', regex: /(\d+)\s*(GB|GB DDR4|GB DDR5|GB RAM)/i },
                          { label: 'Almacenamiento', regex: /(\d+)\s*(GB|TB)\s*(SSD|HDD|NVMe)/i },
                          { label: 'Pantalla', regex: /(\d+\.?\d*)[""]/ },
                          { label: 'Gráficos', regex: /(NVIDIA|AMD|Intel).*?(GTX|RTX|HD|UHD|Iris|Arc|Radeon|GeForce)[^\s]*/i },
                        ];
                        patterns.forEach(pattern => {
                          const match = cleanDescription.match(pattern.regex);
                          if (match) specs.push({ label: pattern.label, value: match[0].trim() });
                        });
                        if (specs.length > 0) {
                          return specs.map((spec, i) => (
                            <div key={i} className="flex gap-4 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32 flex-none">{spec.label}</dt>
                              <dd className="text-sm text-gray-900 dark:text-gray-100">{spec.value}</dd>
                            </div>
                          ));
                        }
                        return <p className="text-sm text-gray-500">Sin especificaciones detalladas disponibles.</p>;
                      })()}
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="py-2">
                    <ProductReviews productId={product.id} />
                  </div>
                )}

                {activeTab === 'video' && product.video_url && (() => {
                  const embedUrl = getEmbedUrl(product.video_url);
                  return embedUrl ? (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                      <iframe
                        src={embedUrl}
                        title={`Video: ${product.name}`}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No se pudo cargar el video.</p>
                  );
                })()}

                {activeTab === 'shipping' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Opciones de Envío</h4>
                      <div className="space-y-2">
                        {[
                          { title: 'Envío Estándar', subtitle: '2–5 días hábiles · Lima y provincias', badge: 'GRATIS' },
                          { title: 'Envío Express', subtitle: '24–48 h · Solo Lima Metropolitana', badge: 'S/. 15' },
                          { title: 'Recojo en Tienda', subtitle: 'Disponible en 2 horas · Av. Tecnología 123', badge: 'GRATIS' },
                        ].map((opt) => (
                          <div key={opt.title} className="flex items-center justify-between p-3.5 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{opt.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.subtitle}</p>
                            </div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex-none ml-4">{opt.badge}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Política de Devoluciones</h4>
                      <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
                        {[
                          '30 días para devoluciones, sin preguntas',
                          'Producto en condiciones originales con embalaje y accesorios',
                          'Recogemos en tu domicilio sin costo adicional',
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-none" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sticky info panel ── */}
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {product.category && (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                  {product.category}
                </span>
              )}
              {product.isAvailable() ? (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                  En Stock
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                  Agotado
                </span>
              )}
              {product.is_new && (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">Nuevo</span>
              )}
              {product.is_clearance && (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">Oferta</span>
              )}
            </div>

            {/* Product name */}
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {product.name}
            </h1>

            {/* SKU */}
            {product.codigo_interno && (
              <p className="text-xs text-gray-400 font-mono">SKU: {product.codigo_interno}</p>
            )}

            {/* Price card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              {priceList > 0 ? (
                <>
                  <div className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight tabular-nums">
                    S/. {priceList.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">Precio especial con cualquier medio de pago</p>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-500">Consultar precio</span>
              )}

              {settings?.show_distributor_price_in_detail && priceDis > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs text-gray-500">Precio distribuidor:</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                    S/. {priceDis.toFixed(2)}
                  </span>
                  <a
                    href={`https://wa.me/51${(settings.company_whatsapp || '988552455').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:underline font-medium ml-auto"
                  >
                    Consultar por WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Short description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.shortDescription ||
                product.description
                  .replace(/<[^>]*>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .substring(0, 150) + '...'}
            </p>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Stock</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{product.stock} uds.</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Categoría</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{product.category || '—'}</p>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Cantidad</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg font-medium text-gray-700 dark:text-gray-200 hover:border-gray-500 transition"
                >
                  −
                </button>
                <span className="w-12 h-9 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg font-medium text-gray-700 dark:text-gray-200 hover:border-gray-500 transition"
                >
                  +
                </button>
                <span className="text-xs text-gray-400 ml-1">({product.stock} disp.)</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5">
              <button
                onClick={handleBuyNow}
                disabled={!product.isAvailable()}
                className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 shadow-sm"
              >
                Comprar Ahora
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!product.isAvailable()}
                className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed text-white dark:text-gray-900 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95"
              >
                Agregar al Carrito
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleToggleWishlist}
                  className={`py-3 rounded-xl font-medium text-sm transition active:scale-95 flex items-center justify-center gap-2 border ${
                    isInWishlist(product.id)
                      ? 'bg-brand-red-600 border-brand-red-600 text-white'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <svg className="w-4 h-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isInWishlist(product.id) ? 'En Favoritos' : 'Favoritos'}
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                  className="border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium text-sm hover:border-gray-400 dark:hover:border-gray-500 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Compartir
                </button>
              </div>
            </div>

            {/* Shipping info strip */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
              {[
                {
                  icon: (
                    <svg className="w-4 h-4 text-emerald-500 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12h12l1-12M10 12v4M14 12v4" />
                    </svg>
                  ),
                  text: 'Despacho a Lima Metropolitana y todo el Perú',
                },
                {
                  icon: (
                    <svg className="w-4 h-4 text-blue-500 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  text: 'Entrega en 24–48 h en Lima',
                },
                {
                  icon: (
                    <svg className="w-4 h-4 text-amber-500 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  text: 'Garantía oficial de fábrica',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900">
                  {item.icon}
                  <span className="text-xs text-gray-600 dark:text-gray-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
}
