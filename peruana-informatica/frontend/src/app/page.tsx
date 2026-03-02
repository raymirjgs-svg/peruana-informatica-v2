'use client';

import Link from 'next/link';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Carousel } from '@/components/common/Carousel';
import { BrandLogoCarousel } from '@/components/common/BrandLogoCarousel';
import { useEffect, useState } from 'react';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';

import { API_CONFIG } from '@/config/api';

const BACKEND_URL = API_CONFIG.API_BASE_URL;

const FALLBACK_QUICK_CATEGORIES = [
  { id: 1, label: 'Laptops', href: '/products?category=laptops', icon: '💻' },
  { id: 2, label: 'Monitores', href: '/products?category=monitores', icon: '🖥️' },
  { id: 3, label: 'Procesadores', href: '/products?category=procesadores', icon: '⚡' },
  { id: 4, label: 'Memorias RAM', href: '/products?category=memorias', icon: '🧠' },
  { id: 5, label: 'Almacenamiento', href: '/products?category=almacenamiento', icon: '💾' },
  { id: 6, label: 'Periféricos', href: '/products?category=perifericos', icon: '🖱️' },
  { id: 7, label: 'Cases', href: '/products?category=cases', icon: '🔲' },
  { id: 8, label: 'Impresoras', href: '/products?category=impresoras', icon: '🖨️' },
];

function SectionHeader({
  title,
  href,
  linkText = 'Ver todo',
  accentColor = '#dc2626',
  badge,
}: {
  title: string;
  href: string;
  linkText?: string;
  accentColor?: string;
  badge?: string;
}) {
  return (
    <div className="flex justify-between items-center mb-7">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {title}
          </h2>
          {badge && (
            <span
              className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: accentColor }}
            >
              {badge}
            </span>
          )}
        </div>
        <div
          className="h-0.5 w-10 rounded-full mt-1"
          style={{ backgroundColor: accentColor }}
        />
      </div>
      <Link
        href={href}
        className="flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5"
        style={{ color: accentColor }}
      >
        {linkText}
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <ProductCardSkeleton key={`skeleton-${i}`} />)}
    </div>
  );
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [clearanceProducts, setClearanceProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickCategories, setQuickCategories] = useState(FALLBACK_QUICK_CATEGORIES);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const productService = new ProductService();
      try {
        const [featured, newArrivals, clearance] = await Promise.all([
          productService.getProducts(1, 8, { featured: true }),
          productService.getProducts(1, 8, { new: true }),
          productService.getProducts(1, 8, { clearance: true }),
        ]);
        setFeaturedProducts(featured.products);
        setNewProducts(newArrivals.products);
        setClearanceProducts(clearance.products);
      } catch {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/quick-categories`)
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json) ? json : (json.data ?? []);
        if (list.length > 0) setQuickCategories(list);
      })
      .catch(() => {/* usa fallback */});
  }, []);

  return (
    <div className="space-y-0">

      {/* HERO CAROUSEL */}
      <Carousel />

      {/* BRAND LOGO CAROUSEL */}
      <BrandLogoCarousel />

      {/* QUICK CATEGORIES BAR */}
      <div className="mb-10 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {quickCategories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="flex-none flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200 group min-w-[80px]"
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 text-center whitespace-nowrap transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-16">

        {/* ─── NUEVOS INGRESOS ─── */}
        {(loading || newProducts.length > 0) && (
          <section>
            <SectionHeader
              title="Nuevos Ingresos"
              href="/products?new=true"
              badge="NEW"
              accentColor="#2563eb"
            />
            {loading ? <SkeletonGrid /> : <ProductGrid products={newProducts} />}
          </section>
        )}

        {/* ─── PRODUCTOS DESTACADOS ─── */}
        <section>
          <SectionHeader
            title="Productos Destacados"
            href="/products?featured=true"
            accentColor="#d97706"
          />
          {loading ? (
            <SkeletonGrid />
          ) : (
            <ProductGrid products={featuredProducts.length > 0 ? featuredProducts : []} />
          )}
        </section>

        {/* ─── ZONA DE REMATES ─── */}
        {(loading || clearanceProducts.length > 0) && (
          <section className="relative overflow-hidden rounded-2xl">
            {/* Diagonal stripe pattern */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: '#1a0000',
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 20px,
                  rgba(220,38,38,0.05) 20px,
                  rgba(220,38,38,0.05) 40px
                )`,
              }}
            />
            {/* Red glow top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            <div className="absolute top-0 left-1/4 w-1/2 h-24 bg-red-600/10 blur-3xl rounded-full" />

            <div className="relative z-10 p-8">
              <div className="flex justify-between items-center mb-7">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center animate-pulse">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7s1 2 3 3c0-2 .5-5 3-7 2 2 4 3 4 7a7 7 0 11-14 0c0-1.5.4-3 1-4a5 5 0 003 1z" />
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        Zona de Remates
                      </h2>
                      <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full text-white bg-red-600 animate-pulse">
                        OFERTA
                      </span>
                    </div>
                    <div className="h-0.5 w-10 rounded-full mt-1 bg-red-500" />
                    <p className="text-red-300/70 text-xs mt-1">Precios liquidación — stock limitado</p>
                  </div>
                </div>
                <Link
                  href="/products?clearance=true"
                  className="flex items-center gap-1.5 text-sm font-semibold text-red-400 hover:text-red-300 transition-all hover:gap-2.5"
                >
                  Ver ofertas
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              {loading ? <SkeletonGrid /> : <ProductGrid products={clearanceProducts} />}
            </div>
          </section>
        )}

        {/* ─── POR QUÉ ELEGIRNOS ─── */}
        <section>
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase text-red-600 mb-2">PERUANA INFORMÁTICA</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-3">¿Por qué elegirnos?</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
              Más de 10 años llevando tecnología de calidad a hogares y empresas en todo el Perú.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { value: '10+', label: 'Años de experiencia', color: '#dc2626' },
              { value: '5k+', label: 'Clientes satisfechos', color: '#2563eb' },
              { value: '1k+', label: 'Productos en catálogo', color: '#d97706' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
              >
                <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12h12l1-12M10 12v4M14 12v4" />
                  </svg>
                ),
                title: 'Envío Rápido',
                description: 'Llegamos a todo el Perú en 2-3 días hábiles con seguimiento en tiempo real.',
                accent: '#2563eb',
                bg: 'from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20',
                border: 'border-blue-100 dark:border-blue-900/40',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Garantía Oficial',
                description: 'Todos nuestros productos tienen garantía de fábrica y soporte post-venta.',
                accent: '#10b981',
                bg: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20',
                border: 'border-emerald-100 dark:border-emerald-900/40',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                title: 'Soporte 24/7',
                description: 'Nuestro equipo de expertos está disponible para ayudarte en todo momento.',
                accent: '#dc2626',
                bg: 'from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20',
                border: 'border-red-100 dark:border-red-900/40',
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`relative p-6 rounded-xl bg-gradient-to-br ${item.bg} border ${item.border} hover:shadow-lg transition-all duration-300 group`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${item.accent}18`, color: item.accent }}
                >
                  {item.icon}
                </div>
                <div
                  className="h-0.5 w-8 rounded-full mb-3"
                  style={{ backgroundColor: item.accent }}
                />
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECCIÓN CONTACTO ─── */}
        <section className="relative overflow-hidden rounded-2xl bg-gray-950 text-white">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
          {/* Subtle background pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="contactgrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#contactgrid)" />
          </svg>

          <div className="relative z-10 py-14 px-8">
            <div className="text-center mb-10">
              <p className="text-xs font-bold tracking-widest uppercase text-red-500 mb-2">CONTÁCTANOS</p>
              <h2 className="text-3xl font-black mb-3">¿Necesitas ayuda?</h2>
              <p className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
                Estamos aquí para ti. Contáctanos por cualquiera de estos medios y te responderemos de inmediato.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                {
                  color: '#10b981',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  ),
                  title: 'Llámanos',
                  lines: ['+51 1 234-5678', '+51 987-654-321'],
                },
                {
                  color: '#8b5cf6',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: 'Escríbenos',
                  lines: ['info@peruanainformatica.com', 'ventas@peruanainformatica.com'],
                },
                {
                  color: '#22c55e',
                  icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.085" />
                    </svg>
                  ),
                  title: 'WhatsApp',
                  lines: ['+51 987-654-321', 'Respuesta inmediata'],
                },
                {
                  color: '#ef4444',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                  title: 'Visítanos',
                  lines: ['Av. Tecnología 123', 'Lima, Perú 15001'],
                },
              ].map((contact) => (
                <div
                  key={contact.title}
                  className="flex flex-col items-center text-center p-5 rounded-xl border transition-all duration-200 hover:border-white/20"
                  style={{
                    backgroundColor: `${contact.color}08`,
                    borderColor: `${contact.color}20`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: contact.color, color: 'white' }}
                  >
                    {contact.icon}
                  </div>
                  <h3 className="font-bold text-sm mb-2">{contact.title}</h3>
                  {contact.lines.map((line, i) => (
                    <p key={i} className="text-gray-400 text-xs leading-relaxed">{line}</p>
                  ))}
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-red-900/30 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Ir al formulario de contacto
              </Link>
            </div>
          </div>
        </section>

      </div>

      <div className="mb-16" />
    </div>
  );
}
