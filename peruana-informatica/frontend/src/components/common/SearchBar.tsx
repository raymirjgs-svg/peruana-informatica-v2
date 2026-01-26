'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { API_CONFIG } from '@/config/api';

// Simple local debounce hook implementation
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export function SearchBar() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounceValue(query, 300);
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
                                            {product.image && (
                                                <img
                                                    src={product.image.startsWith('http') ? product.image : `${API_CONFIG.BASE_URL}/${product.image}`}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                                                {product.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {(product.priceDis || 0) > 0 ? (
                                                    <>
                                                        <span className="text-red-600 font-bold text-xs">${product.priceDis}</span>
                                                        <span className="text-gray-400 text-xs line-through">${product.price}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-700 font-bold text-xs">${product.price}</span>
                                                )}
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
