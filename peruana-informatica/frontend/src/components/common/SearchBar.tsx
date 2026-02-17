'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { API_CONFIG } from '@/config/api';
import { useDebounce } from '@/hooks/useDebounce';

export function SearchBar() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounce(query, 300);
    const productService = new ProductService();

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const suggestions = await productService.getSuggestions(debouncedQuery, 6);
                setResults(suggestions);
                setShowDropdown(true);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setShowDropdown(false);
            router.push(`/products?search=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative group">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        className="w-full bg-slate-800/50 border border-slate-600 text-white pl-4 pr-12 py-2.5 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
                        placeholder="Buscar productos, marcas, categorías..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => {
                            if (results.length > 0) setShowDropdown(true);
                        }}
                    />
                    <button
                        type="submit"
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-600 p-1.5 rounded-full text-white hover:bg-blue-500 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>
            </form>

            {/* Dropdown de Resultados */}
            {showDropdown && (query.length >= 2) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 border border-gray-100">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent text-blue-600 rounded-full mr-2"></div>
                            Buscando...
                        </div>
                    ) : results.length > 0 ? (
                        <div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                {results.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/products/${product.slug}`}
                                        className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        {/* Imagen Thumbnail */}
                                        <div className="w-12 h-12 relative flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            {(() => {
                                                const p = product as any;
                                                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

                                                // Get image from images array
                                                const imgName = p.images?.[0]?.imagen;
                                                if (!imgName) {
                                                    return (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    );
                                                }

                                                const imgUrl = `${apiBase}/images/products/${imgName}`;
                                                return (
                                                    <img
                                                        src={imgUrl}
                                                        alt={product.name}
                                                        className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Sin+Imagen';
                                                        }}
                                                    />
                                                );
                                            })()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                                                {product.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-blue-600 font-bold text-sm">
                                                    S/ {Number((product as any).price_web || product.price || 0).toFixed(2)}
                                                </span>
                                                {product.category && (
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full capitalize">
                                                        {product.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                                <Link
                                    href={`/products?search=${encodeURIComponent(query)}`}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    Ver todos los resultados ({results.length}+)
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <p>No se encontraron productos para "{query}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
