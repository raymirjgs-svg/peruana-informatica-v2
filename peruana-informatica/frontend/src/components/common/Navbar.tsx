// src/components/common/Navbar.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { BrandService, Brand } from '@/services/BrandService';
import { CategoryService, Category } from '@/services/CategoryService';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useCompare } from '@/hooks/useCompare';

export function Navbar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { totalItems, totalPrice } = useCart();
  const { wishlistCount } = useWishlist();
  const { compareCount } = useCompare();

  // Búsqueda Instantánea
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fix hydration error: only render after client-side mount
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 2) {
        setIsSearching(true);
        try {
          const productService = new ProductService();
          const suggestions = await productService.getSuggestions(searchTerm);
          setSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error searching:", error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const getImageUrl = (image: string) => {
    if (!image) return 'https://placehold.co/100';
    if (image.startsWith('http')) return image;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/images/products/${image}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const categoryService = new CategoryService();
      const brandService = new BrandService();

      const [categoriesData, brandsData] = await Promise.all([
        categoryService.getMenuCategories(),
        brandService.getBrands(),
      ]);

      setCategories(categoriesData.slice(0, 12));
      setBrands(brandsData.slice(0, 15));
    };
    loadData();
  }, []);

  return (
    <>
      {/* Top Bar */}
      <div className="bg-slate-950 text-white text-xs py-1.5 border-b border-slate-800">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="hidden md:flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                +51 1 234-5678
              </span>
              <span className="hidden lg:flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                info@peruanainformatica.com
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
                <span className="hidden md:inline">Envío gratis en compras mayores a S/. 100</span>
                <span className="md:hidden">Envío gratis +S/.100</span>
              </span>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-gray-500">|</span>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition" title="Facebook">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-pink-400 transition" title="Instagram">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-green-400 transition" title="WhatsApp">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.085" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-md border-b border-blue-900/30">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center py-2">
            {/* Botones de búsqueda y menú móvil */}
            <div className="flex items-center gap-4 lg:hidden">
              {/* Botón de búsqueda para móvil */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="text-white p-2 hover:text-blue-400 transition"
                aria-label="Buscar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Botón de menú móvil */}
              <button
                className="text-white p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Menú de escritorio */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                href="/"
                className="hover:text-blue-300 transition-all duration-300 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-950/50 relative group overflow-hidden border border-transparent hover:border-blue-500/30"
                onMouseEnter={() => {
                  setCategoriesOpen(false);
                  setBrandsOpen(false);
                }}
              >
                <span className="relative z-10 flex items-center gap-1.5 text-sm">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  Inicio
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/20 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>

              <Link
                href="/products"
                className="hover:text-blue-300 transition-all duration-300 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-950/50 relative group overflow-hidden border border-transparent hover:border-blue-500/30"
                onMouseEnter={() => {
                  setCategoriesOpen(false);
                  setBrandsOpen(false);
                }}
              >
                <span className="relative z-10 flex items-center gap-1.5 text-sm">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  Productos
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/20 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>

              <Link
                href="/products?new=true"
                className="hover:text-amber-300 transition-all duration-300 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-950/50 relative group overflow-hidden border border-transparent hover:border-amber-500/30"
                onMouseEnter={() => {
                  setCategoriesOpen(false);
                  setBrandsOpen(false);
                }}
              >
                <span className="relative z-10 flex items-center gap-1.5 text-sm">
                  <span className="text-yellow-400">✨</span>
                  Nuevos
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600/0 via-amber-600/20 to-amber-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>

              <Link
                href="/products?featured=true"
                className="hover:text-purple-300 transition-all duration-300 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-950/50 relative group overflow-hidden border border-transparent hover:border-purple-500/30"
                onMouseEnter={() => {
                  setCategoriesOpen(false);
                  setBrandsOpen(false);
                }}
              >
                <span className="relative z-10 flex items-center gap-1.5 text-sm">
                  <span className="text-purple-400">⭐</span>
                  Destacados
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/20 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>

              <Link
                href="/products?clearance=true"
                className="hover:text-red-300 transition-all duration-300 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-950/50 relative group overflow-hidden border border-transparent hover:border-red-500/30"
                onMouseEnter={() => {
                  setCategoriesOpen(false);
                  setBrandsOpen(false);
                }}
              >
                <span className="relative z-10 flex items-center gap-1.5 text-sm">
                  <span className="text-red-500">🔥</span>
                  Ofertas
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/20 to-red-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>

              {/* Dropdown de categorías */}
              <div className="relative group">
                <button
                  className="hover:text-blue-300 transition-all duration-300 font-medium flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-blue-950/50 border border-transparent hover:border-blue-500/30"
                  onMouseEnter={() => {
                    setCategoriesOpen(true);
                    setBrandsOpen(false);
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  <span className="text-sm">Categorías</span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${categoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {categoriesOpen && (
                  <div
                    className="absolute top-full left-0 -mt-2 z-50"
                    onMouseEnter={() => setCategoriesOpen(true)}
                    onMouseLeave={() => setCategoriesOpen(false)}
                  >
                    <div className="w-64 bg-white text-gray-800 rounded-lg shadow-xl py-2 max-h-96 overflow-y-auto border border-gray-200">
                      {categories.length > 0 ? (
                        <>
                          {categories.map((category) => (
                            <Link
                              key={category.id}
                              href={`/products?category=${category.slug}`}
                              className="block px-5 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 transition-all duration-200 font-medium hover:pl-6 border-l-4 border-transparent hover:border-blue-500"
                              onClick={() => setCategoriesOpen(false)}
                            >
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                {category.name}
                              </span>
                            </Link>
                          ))}
                          <div className="border-t my-2"></div>
                          <Link
                            href="/categories"
                            className="block px-5 py-3 text-blue-600 font-bold hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 hover:pl-6"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            <span className="flex items-center gap-2">
                              Ver todas las categorías →
                            </span>
                          </Link>
                        </>
                      ) : (
                        <div className="px-4 py-2 text-gray-500">Cargando...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown de marcas */}
              <div className="relative group">
                <button
                  className="hover:text-blue-300 transition-all duration-300 font-medium flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-blue-950/50 border border-transparent hover:border-blue-500/30"
                  onMouseEnter={() => {
                    setBrandsOpen(true);
                    setCategoriesOpen(false);
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  <span className="text-sm">Marcas</span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${brandsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {brandsOpen && (
                  <div
                    className="absolute top-full left-0 -mt-2 z-50"
                    onMouseEnter={() => setBrandsOpen(true)}
                    onMouseLeave={() => setBrandsOpen(false)}
                  >
                    <div className="w-72 bg-white text-gray-800 rounded-xl shadow-2xl py-3 max-h-96 overflow-y-auto border border-gray-100 backdrop-blur-sm">
                      {brands.length > 0 ? (
                        <>
                          {brands.map((brand) => (
                            <Link
                              key={brand.id}
                              href={`/products?brand=${brand.slug}`}
                              className="block px-5 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 transition-all duration-200 font-medium hover:pl-6 border-l-4 border-transparent hover:border-blue-500"
                              onClick={() => setBrandsOpen(false)}
                            >
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                {brand.name}
                              </span>
                            </Link>
                          ))}
                          <div className="border-t my-2"></div>
                          <Link
                            href="/brands"
                            className="block px-5 py-3 text-blue-600 font-bold hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 hover:pl-6"
                            onClick={() => setBrandsOpen(false)}
                          >
                            <span className="flex items-center gap-2">
                              Ver todas las marcas →
                            </span>
                          </Link>
                        </>
                      ) : (
                        <div className="px-4 py-2 text-gray-500">Cargando...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>



              {/* Barra de búsqueda de escritorio mejorada */}
              <div className="flex-1 max-w-2xl mx-8">
                {!isMounted ? (
                  // SSR placeholder to prevent hydration mismatch
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar productos, marcas o categorías..."
                      className="w-full px-4 py-2.5 pl-11 pr-24 rounded-full text-sm text-gray-800 bg-white/95 backdrop-blur-sm shadow-md border border-white/20"
                      disabled
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSearch} className="relative group">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Buscar productos, marcas o categorías..."
                        className="w-full px-4 py-2.5 pl-11 pr-24 rounded-full text-sm text-gray-800 bg-white/95 backdrop-blur-sm shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 border border-white/20"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {isSearching ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full transition-colors duration-300 text-xs font-medium"
                        aria-label="Buscar"
                      >
                        Buscar
                      </button>
                    </div>

                    {/* Dropdown de Sugerencias / Populares */}
                    {showSuggestions && (searchTerm.length < 3 || suggestions.length > 0) && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">

                        {/* Resultados de búsqueda */}
                        {searchTerm.length > 2 && suggestions.length > 0 && (
                          <div className="py-2">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wider">Resultados Sugeridos</div>
                            {suggestions.map((product) => (
                              <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                                onClick={() => {
                                  setShowSuggestions(false);
                                  setSearchTerm('');
                                }}
                              >
                                {/* Imagen miniatura simple */}
                                <div className="w-10 h-10 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
                                  {/* Asumiendo que tenemos acceso a la imagen o placeholder */}
                                  <img
                                    src={product.images && product.images.length > 0 && product.images[0]?.imagen ? getImageUrl(product.images[0].imagen) : 'https://placehold.co/100'}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100' }}
                                  />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</div>
                                  <div className="text-xs text-blue-600 font-bold">S/. {product.price.toFixed(2)}</div>
                                </div>
                              </Link>
                            ))}
                            <Link
                              href={`/products?search=${encodeURIComponent(searchTerm)}`}
                              className="block text-center py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 hover:underline"
                              onClick={() => setShowSuggestions(false)}
                            >
                              Ver todos los resultados para "{searchTerm}"
                            </Link>
                          </div>
                        )}

                        {/* Búsquedas Populares (Solo si no hay búsqueda activa) */}
                        {searchTerm.length < 3 && (
                          <div className="p-4 bg-gray-50/50">
                            <div className="text-xs text-gray-500 mb-2 font-medium">Búsquedas populares:</div>
                            <div className="flex flex-wrap gap-2">
                              {['Laptops', 'Procesadores', 'Tarjetas gráficas', 'Memoria RAM', 'SSD'].map((term) => (
                                <button
                                  key={term}
                                  onClick={() => {
                                    setSearchTerm(term);
                                    // Trigger immediate logical search is complex here due to state, but usually user clicks search btn
                                  }}
                                  className="px-3 py-1 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 rounded-full text-xs transition-colors shadow-sm"
                                >
                                  {term}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Overlay invisible para cerrar al hacer click fuera (opcional, o confiar en onBlur/Focus pero es tricky) */}
                    {showSuggestions && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowSuggestions(false)} style={{ display: 'none' }} />} {/* Hacky */}
                  </form>
                )}
              </div>

              {/* Acciones del usuario */}
              <div className="flex items-center gap-1 md:gap-2">
                {/* Nuevos Iconos de Ayuda (Tracking y Contacto) */}
                <Link href="/track-order" className="relative p-2 text-white hover:bg-slate-800 rounded-lg transition-colors group" title="Rastrear Pedido">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </Link>

                <Link href="/lista-distribucion" className="relative p-2 text-white hover:bg-slate-800 rounded-lg transition-colors group" title="Lista de Distribución">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </Link>

                <Link href="/contacto" className="relative p-2 text-white hover:bg-slate-800 rounded-lg transition-colors group" title="Contacto">
                  <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </Link>

                {/* Favoritos */}
                <Link href="/wishlist" className="relative flex items-center gap-2 px-2 md:px-3 py-2 text-white hover:bg-slate-800 rounded-lg transition-colors group" title="Favoritos">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Comparar */}
                <Link href="/compare" className="relative flex items-center gap-2 px-2 md:px-3 py-2 text-white hover:bg-slate-800 rounded-lg transition-colors group" title="Comparar">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {compareCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {compareCount}
                    </span>
                  )}
                </Link>

                {/* Cotizador */}
                <Link
                  href="/cotizador"
                  className="relative flex items-center gap-2 px-3 py-2 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                  title="Cotizador"
                >
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden xl:inline text-sm font-medium">Cotizador</span>
                </Link>

                {/* Usuario/Login */}
                <div className="relative group">
                  <button className="flex items-center justify-center p-2 text-white hover:bg-slate-800 rounded-lg transition-colors" title="Mi Cuenta">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="py-2">
                      <Link href="/account/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">
                        Iniciar Sesión
                      </Link>
                      <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          Panel Administrador
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Carrito */}
                <Link
                  href="/cart"
                  className="relative p-2 text-white hover:bg-slate-800 rounded-lg transition-colors group"
                  title="Ver Carrito"
                >
                  <svg className="w-6 h-6 text-green-400 group-hover:text-green-300 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold animate-pulse shadow-md">
                      {totalItems > 99 ? '99' : totalItems}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>

          {/* Búsqueda móvil */}
          {showSearch && (
            <div className="lg:hidden py-3 border-t border-gray-700">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos..."
                  className="flex-grow px-3 py-2 rounded-l text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="submit"
                  className="bg-blue-600 px-3 py-2 rounded-r hover:bg-blue-700 transition"
                >
                  Buscar
                </button>
              </form>
            </div>
          )}

          {/* Menú móvil */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-3 border-t border-gray-700">
              <Link href="/" className="block py-2 hover:text-blue-400 transition" onClick={() => setMobileMenuOpen(false)}>
                Inicio
              </Link>
              <Link href="/products" className="block py-2 hover:text-blue-400 transition" onClick={() => setMobileMenuOpen(false)}>
                Productos
              </Link>
              <Link href="/products?new=true" className="block py-2 hover:text-yellow-300 transition" onClick={() => setMobileMenuOpen(false)}>
                ✨ Nuevos
              </Link>
              <Link href="/products?featured=true" className="block py-2 hover:text-purple-300 transition" onClick={() => setMobileMenuOpen(false)}>
                ⭐ Destacados
              </Link>
              <Link href="/products?clearance=true" className="block py-2 hover:text-red-300 transition" onClick={() => setMobileMenuOpen(false)}>
                🔥 Ofertas
              </Link>
              <Link href="/track-order" className="block py-2 hover:text-amber-300 transition" onClick={() => setMobileMenuOpen(false)}>
                📦 Rastrear Pedido
              </Link>

              {/* Categorías móviles */}
              <div className="py-2">
                <button
                  onClick={() => setCategoriesOpen(!categoriesOpen)}
                  className="w-full text-left flex justify-between items-center hover:text-blue-400 transition"
                >
                  Categorías
                  <svg className={`w-4 h-4 transform transition ${categoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {categoriesOpen && (
                  <div className="pl-4 mt-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/products?category=${category.slug}`}
                        className="block py-2 text-sm hover:text-blue-400 transition"
                        onClick={() => {
                          setCategoriesOpen(false);
                          setMobileMenuOpen(false);
                        }}
                      >
                        {category.name}
                      </Link>
                    ))}
                    <Link
                      href="/categories"
                      className="block py-2 text-sm text-blue-400 font-semibold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Ver todas →
                    </Link>
                  </div>
                )}
              </div>

              {/* Marcas móviles */}
              <div className="py-2">
                <button
                  onClick={() => setBrandsOpen(!brandsOpen)}
                  className="w-full text-left flex justify-between items-center hover:text-blue-400 transition"
                >
                  Marcas
                  <svg className={`w-4 h-4 transform transition ${brandsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {brandsOpen && (
                  <div className="pl-4 mt-2">
                    {brands.map((brand) => (
                      <Link
                        key={brand.id}
                        href={`/products?brand=${brand.slug}`}
                        className="block py-2 text-sm hover:text-blue-400 transition"
                        onClick={() => {
                          setBrandsOpen(false);
                          setMobileMenuOpen(false);
                        }}
                      >
                        {brand.name}
                      </Link>
                    ))}
                    <Link
                      href="/brands"
                      className="block py-2 text-sm text-blue-400 font-semibold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Ver todas →
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/blog" className="block py-2 hover:text-blue-400 transition" onClick={() => setMobileMenuOpen(false)}>
                Blog
              </Link>
              <Link href="/contacto" className="block py-2 hover:text-blue-400 transition" onClick={() => setMobileMenuOpen(false)}>
                Contacto
              </Link>
              <Link href="/lista-distribucion" className="block py-2 hover:text-blue-400 transition" onClick={() => setMobileMenuOpen(false)}>
                Lista distribución
              </Link>

              <Link
                href="/cart"
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-4 py-3 rounded-lg transition-all duration-300 font-medium flex items-center justify-center gap-2 shadow-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="text-lg">🛒</div>
                <div>
                  <div className="text-sm">Carrito</div>
                  {totalItems > 0 && (
                    <div className="text-xs opacity-90">
                      {totalItems} items - S/. {totalPrice.toFixed(2)}
                    </div>
                  )}
                </div>
                {totalItems > 0 && (
                  <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {totalItems > 99 ? '99+' : totalItems}
                  </div>
                )}
              </Link>
            </div>
          )}
        </div>
      </nav >
    </>
  );
}