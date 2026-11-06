'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, LogOut, ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  admin: 'Dashboard', products: 'Productos', categories: 'Categorías',
  brands: 'Marcas', orders: 'Pedidos', quotations: 'Cotizaciones',
  reports: 'Reportes', customers: 'Clientes', users: 'Usuarios',
  settings: 'Configuración', system: 'Sistema', blog: 'Blog',
  carousel: 'Carrusel', reviews: 'Reseñas', wishlists: 'Favoritos',
  coupons: 'Cupones', discounts: 'Descuentos', marketing: 'Marketing',
  inventory: 'Inventario', contacts: 'Contactos', seo: 'SEO',
  taxonomy: 'Taxonomía', announcements: 'Anuncios', pages: 'Páginas',
  'quick-categories': 'Accesos Rápidos', 'promo-banners': 'Pop-ups',
  'company-settings': 'Empresa', roles: 'Roles',
};

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const adminUser = session?.user?.username || session?.user?.name || 'Admin';

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  const segments = (pathname || '')
    .split('/')
    .filter(Boolean)
    .map((seg) => ({ label: routeLabels[seg] || seg, slug: seg }));

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60">
      <div className="px-6 py-3.5 flex items-center justify-between gap-4">

        {/* Breadcrumb */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
          <Home className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          {segments.map((seg, i) => (
            <span key={seg.slug} className="flex items-center gap-1.5 min-w-0">
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
              <span className={i === segments.length - 1
                ? 'font-semibold text-gray-800 dark:text-white truncate capitalize'
                : 'text-gray-400 dark:text-gray-500 capitalize truncate'
              }>
                {seg.label}
              </span>
            </span>
          ))}
        </nav>

        <div className="md:hidden">
          <span className="font-bold text-gray-900 dark:text-white text-sm">
            {routeLabels[segments.at(-1)?.slug || ''] || 'Admin'}
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/25">
                {adminUser.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-gray-800 dark:text-white leading-tight">{adminUser}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Administrador</p>
              </div>
              <ChevronRight className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 hidden md:block ${showMenu ? 'rotate-90' : ''}`} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl shadow-black/10 border border-gray-100 dark:border-gray-700 py-1.5 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{adminUser}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Sesión activa</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 mt-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors flex items-center gap-2.5 text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
