'use client';

/**
 * ============================================
 * DEMO DE COLORES DE MARCA - PERUANA INFORMÁTICA
 * ============================================
 * 
 * Este componente muestra todos los colores de marca
 * y ejemplos de uso. Puedes acceder en: /demo-colors
 * 
 * Mientras migras, usa esta página como referencia visual.
 * ============================================
 */

export default function ColorDemo() {
    return (
        <div className="min-h-screen bg-brand-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-brand-black-800 mb-4">
                        🎨 Paleta de Colores - Peruana Informática
                    </h1>
                    <p className="text-brand-gray-600 max-w-2xl mx-auto">
                        Colores corporativos: Rojo, Negro, Plomo y Gris
                    </p>
                </div>

                {/* Paleta Principal */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-brand-black-800 mb-6">
                        Colores Principales
                    </h2>

                    <div className="grid md:grid-cols-4 gap-6">
                        {/* ROJO */}
                        <div className="bg-white rounded-xl shadow-brand-md overflow-hidden">
                            <div className="bg-brand-red-600 h-32 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">ROJO</span>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold mb-2">Acción y Urgencia</h3>
                                <p className="text-sm text-brand-gray-600 mb-3">
                                    Botones CTA, ofertas, alertas importantes
                                </p>
                                <div className="space-y-1 text-xs font-mono">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-brand-red-600 rounded"></div>
                                        <span>#dc2626</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-brand-red-700 rounded"></div>
                                        <span>#b91c1c</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NEGRO */}
                        <div className="bg-white rounded-xl shadow-brand-md overflow-hidden">
                            <div className="bg-brand-black-800 h-32 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">NEGRO</span>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold mb-2">Premium y Autoridad</h3>
                                <p className="text-sm text-brand-gray-600 mb-3">
                                    Headers, navegación, fondos principales
                                </p>
                                <div className="space-y-1 text-xs font-mono">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-brand-black-800 rounded border"></div>
                                        <span>#1a1a1a</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-brand-black-900 rounded border"></div>
                                        <span>#0a0a0a</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PLOMO */}
                        <div className="bg-white rounded-xl shadow-brand-md overflow-hidden">
                            <div className="bg-brand-slate-800 h-32 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">PLOMO</span>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold mb-2">Profesional</h3>
                                <p className="text-sm text-brand-gray-600 mb-3">
                                    Sidebars, estructura, fondos secundarios
                                </p>
                                <div className="space-y-1 text-xs font-mono">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-brand-slate-800 rounded border"></div>
                                        <span>#1e293b</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-brand-slate-900 rounded border"></div>
                                        <span>#0f172a</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GRIS */}
                        <div className="bg-white rounded-xl shadow-brand-md overflow-hidden">
                            <div className="bg-brand-gray-500 h-32 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">GRIS</span>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold mb-2">Neutro y Balance</h3>
                                <p className="text-sm text-brand-gray-600 mb-3">
                                    Texto secundario, bordes, backgrounds
                                </p>
                                <div className="space-y-1 text-xs font-mono">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-brand-gray-500 rounded border"></div>
                                        <span>#6b7280</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-brand-gray-300 rounded border"></div>
                                        <span>#d1d5db</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Botones - Ejemplos */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-brand-black-800 mb-6">
                        Botones
                    </h2>

                    <div className="bg-white rounded-xl shadow-brand-md p-8">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Botón Principal */}
                            <div>
                                <p className="text-sm font-semibold mb-3 text-brand-gray-600">Principal (CTA)</p>
                                <button className="w-full bg-brand-red-600 hover:bg-brand-red-700 active:bg-brand-red-800 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-brand-red transition-all duration-300">
                                    Comprar Ahora
                                </button>
                            </div>

                            {/* Botón con Gradiente */}
                            <div>
                                <p className="text-sm font-semibold mb-3 text-brand-gray-600">Con Gradiente</p>
                                <button className="w-full bg-gradient-brand text-white py-3 px-6 rounded-lg font-semibold shadow-brand-md hover:shadow-brand-red hover:scale-105 transition-all duration-300">
                                    Agregar al Carrito
                                </button>
                            </div>

                            {/* Botón Secundario */}
                            <div>
                                <p className="text-sm font-semibold mb-3 text-brand-gray-600">Secundario</p>
                                <button className="w-full bg-brand-slate-800 hover:bg-brand-slate-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
                                    Ver Detalles
                                </button>
                            </div>

                            {/* Botón Outline */}
                            <div>
                                <p className="text-sm font-semibold mb-3 text-brand-gray-600">Outline</p>
                                <button className="w-full border-2 border-brand-red-600 text-brand-red-600 hover:bg-brand-red-50 py-3 px-6 rounded-lg font-semibold transition-colors">
                                    Agregar a Favoritos
                                </button>
                            </div>

                            {/* Botón Deshabilitado */}
                            <div>
                                <p className="text-sm font-semibold mb-3 text-brand-gray-600">Deshabilitado</p>
                                <button disabled className="w-full bg-brand-gray-200 text-brand-gray-400 py-3 px-6 rounded-lg font-semibold cursor-not-allowed">
                                    Agotado
                                </button>
                            </div>

                            {/* Botón con Ícono */}
                            <div>
                                <p className="text-sm font-semibold mb-3 text-brand-gray-600">Con Ícono</p>
                                <button className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-brand-red transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Añadir
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Badges */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-brand-black-800 mb-6">
                        Badges y Etiquetas
                    </h2>

                    <div className="bg-white rounded-xl shadow-brand-md p-8">
                        <div className="flex flex-wrap gap-4">
                            <span className="bg-gradient-brand text-white px-4 py-2 rounded-full font-bold shadow-brand-red animate-pulse">
                                ¡OFERTA!
                            </span>

                            <span className="bg-brand-red-100 text-brand-red-800 px-4 py-2 rounded-full font-semibold">
                                Nuevo
                            </span>

                            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                En Stock
                            </span>

                            <span className="bg-brand-slate-800 text-white px-4 py-2 rounded-full font-semibold">
                                Premium
                            </span>

                            <span className="bg-brand-gray-100 text-brand-gray-800 px-4 py-2 rounded-full font-semibold">
                                -25% OFF
                            </span>

                            <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold flex items-center gap-1">
                                ⚠️ Solo 3 unidades
                            </span>
                        </div>
                    </div>
                </section>

                {/* Cards */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-brand-black-800 mb-6">
                        Tarjetas de Producto
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Card Normal */}
                        <div className="bg-white border border-brand-gray-200 rounded-xl shadow-brand-md hover:shadow-brand-lg hover:border-brand-red-400 transition-all overflow-hidden group">
                            <div className="bg-brand-gray-100 h-48 flex items-center justify-center text-brand-gray-400">
                                [Imagen del Producto]
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-brand-black-800 mb-2 line-clamp-2">
                                    Laptop HP Pavilion 15.6" Intel Core i7
                                </h3>
                                <p className="text-2xl font-bold text-brand-black-800 mb-4">
                                    S/. 2,999.00
                                </p>
                                <button className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white py-2 rounded-lg font-semibold transition-colors">
                                    Agregar al Carrito
                                </button>
                            </div>
                        </div>

                        {/* Card con Oferta */}
                        <div className="bg-white border border-brand-red-400 rounded-xl shadow-brand-lg overflow-hidden relative">
                            <span className="absolute top-3 left-3 bg-gradient-brand text-white px-3 py-1 rounded-full text-xs font-bold shadow-brand-red z-10 animate-pulse">
                                -40% OFF
                            </span>
                            <div className="bg-brand-gray-100 h-48 flex items-center justify-center text-brand-gray-400">
                                [Imagen del Producto]
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-brand-black-800 mb-2 line-clamp-2">
                                    Mouse Gamer Logitech G502 RGB
                                </h3>
                                <div className="mb-4">
                                    <span className="text-brand-gray-400 line-through text-sm">S/. 499.00</span>
                                    <span className="text-2xl font-bold text-brand-red-600 ml-2">S/. 299.00</span>
                                </div>
                                <button className="w-full bg-gradient-brand text-white py-2 rounded-lg font-semibold shadow-brand-red hover:scale-105 transition-all">
                                    ¡Aprovechar Oferta!
                                </button>
                            </div>
                        </div>

                        {/* Card Agotado */}
                        <div className="bg-white border border-brand-gray-200 rounded-xl shadow-brand-md overflow-hidden opacity-75">
                            <div className="bg-brand-gray-200 h-48 flex items-center justify-center relative">
                                <span className="absolute top-3 left-3 bg-brand-gray-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                    Agotado
                                </span>
                                <span className="text-brand-gray-400">[Imagen del Producto]</span>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-brand-gray-600 mb-2 line-clamp-2">
                                    Teclado Mecánico RGB Cherry MX
                                </h3>
                                <p className="text-2xl font-bold text-brand-gray-400 mb-4">
                                    S/. 899.00
                                </p>
                                <button disabled className="w-full bg-brand-gray-200 text-brand-gray-400 py-2 rounded-lg font-semibold cursor-not-allowed">
                                    No Disponible
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Alerts */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-brand-black-800 mb-6">
                        Alertas y Notificaciones
                    </h2>

                    <div className="space-y-4">
                        {/* Error */}
                        <div className="bg-brand-red-50 border-l-4 border-brand-red-600 p-4 rounded">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-brand-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h4 className="font-bold text-brand-red-800">¡Producto agotado!</h4>
                                    <p className="text-sm text-brand-red-700">Este producto no está disponible en este momento.</p>
                                </div>
                            </div>
                        </div>

                        {/* Success */}
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h4 className="font-bold text-green-800">¡Agregado al carrito!</h4>
                                    <p className="text-sm text-green-700">El producto se agregó correctamente a tu carrito.</p>
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h4 className="font-bold text-blue-800">Envío gratis</h4>
                                    <p className="text-sm text-blue-700">En compras superiores a S/. 100.00</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Código de Ejemplo */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-brand-black-800 mb-6">
                        Código de Ejemplo
                    </h2>

                    <div className="bg-brand-black-800 text-white rounded-xl p-6 overflow-x-auto">
                        <pre className="text-sm">
                            {`// Botón Principal
<button className="bg-brand-red-600 hover:bg-brand-red-700 
  text-white py-3 px-6 rounded-lg font-semibold 
  hover:shadow-brand-red transition-all">
  Comprar Ahora
</button>

// Botón con Gradiente
<button className="bg-gradient-brand text-white 
  py-3 px-6 rounded-lg font-semibold 
  hover:scale-105 transition-all">
  Agregar al Carrito
</button>

// Badge de Oferta
<span className="bg-gradient-brand text-white 
  px-3 py-1 rounded-full font-bold 
  shadow-brand-red animate-pulse">
  ¡OFERTA!
</span>`}
                        </pre>
                    </div>
                </section>

                {/* Footer Demo */}
                <div className="text-center text-brand-gray-600 text-sm">
                    <p>Esta página es solo para referencia visual durante la migración</p>
                    <p className="mt-2">Consulta <code className="bg-brand-gray-200 px-2 py-1 rounded">BRAND_GUIDE.md</code> para más información</p>
                </div>
            </div>
        </div>
    );
}
