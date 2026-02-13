'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SearchBar } from './SearchBar';
import { MegaMenu } from './MegaMenu';
import { useSettings } from '@/context/SettingsContext'; // Usar Contexto
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useCompare } from '@/hooks/useCompare';
import { CategoryService, Category } from '@/services/CategoryService';

export function Header() {
  const { settings, logoUrl } = useSettings(); // Usar hook
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const { compareCount } = useCompare();
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesData = await new CategoryService().getMenuCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading header data:', error);
      }
    };
    fetchData();
  }, []);

  // Body & HTML Scroll Lock
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="sticky top-0 z-50 flex flex-col transition-all duration-300 shadow-xl">
      {/* Main Header */}
      <header className={`text-white py-3 border-b border-white/5 relative z-20 transition-colors duration-300 ${isScrolled ? 'bg-slate-900/95 backdrop-blur-md' : 'bg-slate-900'}`}>
        <div className="max-w-[1920px] mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center gap-4">

            {/* Left Group (Mobile Menu + Logo) */}
            <div className="flex items-center gap-3 min-w-fit">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 -ml-2 text-gray-300 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Logo */}
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
                {settings?.logo_url ? (
                  <img
                    src={logoUrl}
                    alt={settings?.company_name || 'Logo'}
                    className="h-12 w-auto object-contain max-w-[200px]"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <div className="hidden xl:block">
                      <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent leading-tight">
                        {settings?.company_name || 'Peruana de Informática'}
                      </h1>
                    </div>
                  </div>
                )}
              </Link>
            </div>

            {/* Desktop Search Bar & Mega Menu */}
            <div className="flex-1 max-w-4xl px-2 hidden md:flex items-center gap-2">
              <MegaMenu />
              <div className="flex-1">
                <SearchBar />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 min-w-fit">
              {/* Mobile Search Toggle */}
              <button
                className="md:hidden p-2 text-gray-300 hover:text-white"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Account Link */}
              <AccountLink />

              {/* Wishlist Icon */}
              <Link href="/wishlist" className="relative p-2 hover:bg-white/10 rounded-full transition-colors group hidden sm:flex" title="Favoritos">
                <svg className="w-6 h-6 text-white group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Compare Icon */}
              <Link href="/compare" className="relative p-2 hover:bg-white/10 rounded-full transition-colors group hidden sm:flex" title="Comparar">
                <svg className="w-6 h-6 text-white group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {compareCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm">
                    {compareCount}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link href="/cart" className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-full transition-colors relative group">
                <div className="relative">
                  <svg className="w-6 h-6 text-white group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm">
                      {totalItems}
                    </span>
                  )}
                </div>
                <div className="hidden lg:block text-left leading-tight">
                  <span className="block text-[10px] text-gray-400">Carrito</span>
                  <span className="block text-xs font-bold">Ver items</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {mobileSearchOpen && (
            <div className="md:hidden mt-3 pb-2 animate-in fade-in slide-in-from-top-2">
              <SearchBar />
            </div>
          )}
        </div>
      </header>

      {/* Desktop Secondary Navigation */}
      <nav className="bg-slate-800 text-gray-300 text-sm border-b border-slate-700 hidden md:block relative z-10 shadow-inner">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6">
          <div className="flex items-center gap-6 py-2 overflow-x-auto scrollbar-hide">
            {/* Main Links */}
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-white transition-colors font-medium hover:bg-white/5 px-3 py-1 rounded-md flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Inicio
              </Link>
              <Link href="/products" className="hover:text-white transition-colors font-medium hover:bg-white/5 px-3 py-1 rounded-md flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Productos
              </Link>
              <Link href="/brands" className="hover:text-white transition-colors hover:bg-white/5 px-3 py-1 rounded-md flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                Marcas
              </Link>
            </div>

            <div className="w-px h-4 bg-gray-600"></div>

            {/* Special Links */}
            <div className="flex items-center gap-4">
              <Link href="/products?new=true" className="hover:text-yellow-400 transition-colors font-medium flex items-center gap-1 hover:bg-white/5 px-3 py-1 rounded-md">
                <span>✨</span> Nuevos
              </Link>
              <Link href="/products?featured=true" className="hover:text-purple-400 transition-colors font-medium flex items-center gap-1 hover:bg-white/5 px-3 py-1 rounded-md">
                <span>⭐</span> Destacados
              </Link>
              <Link href="/products?clearance=true" className="hover:text-red-400 transition-colors font-medium flex items-center gap-1 hover:bg-white/5 px-3 py-1 rounded-md">
                <span>🔥</span> Ofertas
              </Link>
            </div>

            <div className="w-px h-4 bg-gray-600"></div>

            {/* Service Links */}
            <div className="flex items-center gap-4">
              <Link href="/track-order" className="hover:text-white transition-colors flex items-center gap-2 hover:bg-white/5 px-3 py-1 rounded-md" title="Rastrear Pedido">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                Seguimiento
              </Link>
              <Link href="/cotizador" className="hover:text-white transition-colors flex items-center gap-2 hover:bg-white/5 px-3 py-1 rounded-md" title="Cotizador Online">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Cotizador
              </Link>
              <Link href="/blog" className="hover:text-white transition-colors hover:bg-white/5 px-3 py-1 rounded-md flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                Blog
              </Link>
            </div>

            <Link href="/lista-distribucion" className="hover:text-white transition-colors ml-auto hover:bg-white/5 px-3 py-1 rounded-md text-xs bg-white/5 border border-white/10 uppercase tracking-wider font-semibold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Lista Distribución
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 md:hidden h-[100dvh] flex flex-col animate-in fade-in duration-200">
          {/* Sticky Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-slate-950 sticky top-0 z-10 shrink-0">
            <h2 className="text-xl font-bold text-white">Menú</h2>
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Scrollable Content - Added min-h-0 for flex scrolling fix */}
          <div className="overflow-y-auto flex-1 min-h-0 w-full p-4 pb-32 space-y-2 overscroll-contain">
            <div className="space-y-4">
              <Link href="/" className="block text-lg font-medium text-gray-300 hover:text-white py-3 border-b border-gray-800/50 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Inicio
              </Link>

              {/* Categories Accordion */}
              <div className="border-b border-gray-800/50 pb-2">
                <button
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  className="w-full flex justify-between items-center text-lg font-medium text-gray-300 hover:text-white py-3"
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    Categorías
                  </span>
                  <svg className={`w-5 h-5 transition-transform duration-300 ${mobileCategoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {mobileCategoriesOpen && (
                  <div className="pl-4 space-y-2 mt-1 mb-3 border-l-2 border-blue-500/30 ml-1 animate-in slide-in-from-top-2 duration-200">
                    {categories.map((cat) => (
                      <Link key={cat.id} href={`/products?category=${cat.slug}`} className="block text-gray-400 hover:text-blue-400 py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                        {cat.name}
                      </Link>
                    ))}
                    <Link href="/categories" className="block text-blue-400 font-medium py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>Ver todas las categorías →</Link>
                  </div>
                )}
              </div>

              <Link href="/brands" className="block text-lg font-medium text-gray-300 hover:text-white py-3 border-b border-gray-800/50 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                Marcas
              </Link>

              <Link href="/products?new=true" className="block text-lg font-medium text-yellow-400 py-3 border-b border-gray-800/50 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <span>✨</span> Nuevos
              </Link>
              <Link href="/products?featured=true" className="block text-lg font-medium text-purple-400 py-3 border-b border-gray-800/50 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <span>⭐</span> Destacados
              </Link>
              <Link href="/products?clearance=true" className="block text-lg font-medium text-red-400 py-3 border-b border-gray-800/50 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <span>🔥</span> Ofertas
              </Link>

              <div className="pt-4 space-y-2">
                <Link href="/track-order" className="block text-gray-400 hover:text-white py-2 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Rastrear Pedido
                </Link>
                <Link href="/cotizador" className="block text-gray-400 hover:text-white py-2 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Cotizador Online
                </Link>
                <Link href="/blog" className="block text-gray-400 hover:text-white py-2 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  Blog
                </Link>
                <Link href="/contact" className="block text-gray-400 hover:text-white py-2 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Ayuda / Contacto
                </Link>
                <div className="pt-2">
                  <Link href="/lista-distribucion" className="block text-xs uppercase tracking-wider font-semibold text-gray-400 hover:text-white py-2 flex items-center gap-3 border border-gray-700 rounded-md px-3 bg-white/5" onClick={() => setMobileMenuOpen(false)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    Lista Distribución
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountLink() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="bg-slate-700 p-2 rounded-full animate-pulse">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    );
  }

  if (session) {
    return (
      <Link href="/account/profile" className="flex items-center gap-2 hover:bg-white/10 p-1.5 pr-3 rounded-full transition-colors group">
        <div className="bg-slate-700 group-hover:bg-slate-600 p-1.5 rounded-full transition-colors">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="text-left leading-none hidden sm:block">
          <p className="text-[10px] text-gray-400">Hola, {session.user?.username || 'Cliente'}</p>
          <p className="text-xs font-bold text-white">Mi Cuenta</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/account/login" className="flex items-center gap-2 hover:bg-white/10 p-1.5 pr-3 rounded-full transition-colors group">
      <div className="bg-slate-700 group-hover:bg-slate-600 p-1.5 rounded-full transition-colors">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      </div>
      <div className="text-left leading-none hidden sm:block">
        <p className="text-[10px] text-gray-400">Bienvenido</p>
        <p className="text-xs font-bold text-white">Ingresar</p>
      </div>
    </Link>
  );
}
