'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CategoryService, Category } from '@/services/CategoryService';

export function MegaMenu() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const categoryService = new CategoryService();

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await categoryService.getMenuCategories();
                // Fallback if data is empty, maybe fetch all
                if (data.length === 0) {
                    const all = await categoryService.getCategories();
                    setCategories(all.slice(0, 15)); // Limit to 15 for menu
                } else {
                    setCategories(data);
                }
            } catch (error) {
                console.error('Error loading menu categories:', error);
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-white/20"
            >
                <div className="flex flex-col gap-1 justify-center w-6 h-6">
                    <span className={`block w-full h-0.5 bg-white transition-all ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                    <span className={`block w-full h-0.5 bg-white transition-opacity ${isOpen ? 'opacity-0' : ''}`} />
                    <span className={`block w-full h-0.5 bg-white transition-all ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                </div>
                <span className="font-bold hidden xl:inline">Todas</span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[80vw] max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-xl font-bold text-gray-800">Departamentos</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/products?category=${cat.slug}`}
                                className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors group"
                                onClick={() => setIsOpen(false)}
                            >
                                {/* Placeholder Icon generated from Name */}
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {cat.name.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-gray-700 font-medium group-hover:text-blue-700 transition-colors">
                                    {cat.name}
                                </span>
                            </Link>
                        ))}

                        <Link
                            href="/products"
                            className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors group border border-dashed border-blue-200"
                            onClick={() => setIsOpen(false)}
                        >
                            <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold text-sm">
                                ➜
                            </div>
                            <span className="text-blue-600 font-medium">
                                Ver Todo
                            </span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
