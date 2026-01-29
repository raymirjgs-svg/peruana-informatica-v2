'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Image as ImageIcon,
  Settings,
  Users,
  Search,
  Mail,
  LogOut,
  Sun,
  Moon,
  Ticket,
  Percent,
  FileText,
  Menu,
  X,
  MessageCircle,
  Heart,
  Activity,
} from 'lucide-react';

interface MenuItem {
  name: string;
  href?: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="h-5 w-5" />
  },
  {
    name: "Ventas",
    icon: <ShoppingCart className="h-5 w-5" />,
    children: [
      { name: "Pedidos", href: "/admin/orders", icon: <ShoppingCart className="h-4 w-4" /> },
      { name: "Cotizaciones", href: "/admin/quotations", icon: <FileText className="h-4 w-4" /> },
      { name: "Reportes", href: "/admin/reports", icon: <FileText className="h-4 w-4" /> }
    ]
  },
  {
    name: "Catálogo",
    icon: <Package className="h-5 w-5" />,
    children: [
      { name: "Productos", href: "/admin/products", icon: <Package className="h-4 w-4" /> },
      { name: "Categorías", href: "/admin/categories", icon: <Tags className="h-4 w-4" /> },
      { name: "Taxonomía", href: "/admin/taxonomy", icon: <Tags className="h-4 w-4" /> },
      { name: "Inventario", href: "/admin/inventory", icon: <Package className="h-4 w-4" /> }
    ]
  },
  {
    name: "Marketing",
    icon: <Ticket className="h-5 w-5" />,
    children: [
      { name: "Reseñas", href: "/admin/reviews", icon: <MessageCircle className="h-4 w-4" /> },
      { name: "Favoritos", href: "/admin/wishlists", icon: <Heart className="h-4 w-4" /> },
      { name: "Cupones", href: "/admin/coupons", icon: <Ticket className="h-4 w-4" /> },
      { name: "Descuentos", href: "/admin/discounts", icon: <Percent className="h-4 w-4" /> },
      { name: "Publicidad Pop-ups", href: "/admin/promo-banners", icon: <ImageIcon className="h-4 w-4" /> }
    ]
  },
  {
    name: "Contenido",
    icon: <ImageIcon className="h-5 w-5" />,
    children: [
      { name: "Blog", href: "/admin/blog", icon: <FileText className="h-4 w-4" /> },
      { name: "Carrusel", href: "/admin/carousel", icon: <ImageIcon className="h-4 w-4" /> },
      { name: "Páginas", href: "/admin/pages", icon: <FileText className="h-4 w-4" /> }
    ]
  },
  {
    name: "Sistema",
    icon: <Settings className="h-5 w-5" />,
    children: [
      { name: "Empresa", href: "/admin/company-settings", icon: <Settings className="h-4 w-4" /> },
      { name: "Clientes", href: "/admin/customers", icon: <Users className="h-4 w-4" /> },
      { name: "Usuarios", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
      { name: "Configuración", href: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
      { name: "Monitor de Sistema", href: "/admin/system", icon: <Activity className="h-4 w-4" /> },
      { name: "Contactos", href: "/admin/contacts", icon: <Mail className="h-4 w-4" /> },
      { name: "SEO", href: "/admin/seo", icon: <Search className="h-4 w-4" /> }
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string>('');

  useEffect(() => {
    // Auto expand menu based on active route
    menuItems.forEach(item => {
      if (item.children) {
        if (item.children.some(child => pathname?.startsWith(child.href || ''))) {
          setExpandedMenus(prev => ({ ...prev, [item.name]: true }));
        }
      }
    });
    setActiveItem(pathname || '');
  }, [pathname]);

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.name];
    const isItemActive = isActive(item.href);

    return (
      <div key={item.name} className="mb-1">
        {hasChildren ? (
          <div>
            <button
              onClick={() => toggleMenu(item.name)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                isExpanded
                  ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "transition-colors",
                  isExpanded ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                isExpanded ? "rotate-180 text-blue-500" : "text-gray-400"
              )} />
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-4 pl-4 border-l border-gray-100 dark:border-gray-800 my-1 space-y-0.5">
                    {item.children?.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href || '#'}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all relative group/child",
                          isActive(child.href)
                            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 font-medium"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                        )}
                      >
                        {/* Dot for active state */}
                        {isActive(child.href) && (
                          <motion.div
                            layoutId="activeDot"
                            className="absolute left-[-5px] w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
                          />
                        )}
                        <span>{child.name}</span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link
            href={item.href || '#'}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
              isItemActive
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            <span className={isItemActive ? "text-white/90" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}>
              {item.icon}
            </span>
            <span>{item.name}</span>
          </Link>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            PI
          </div>
          <span className="font-bold text-gray-900 dark:text-white">Admin</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Floating Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-72 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 z-40 transition-transform duration-300 lg:translate-x-0 pt-0",
          isMobileMenuOpen ? "translate-x-0 mt-16 lg:mt-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50">

          {/* Logo Area */}
          <div className="p-6 hidden lg:block">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl">PI</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">Peruana</h1>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium tracking-wide">PANEL DE CONTROL</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-2">
            <div className="mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Principal
            </div>
            {menuItems.slice(0, 2).map((item) => renderMenuItem(item))}

            <div className="mt-6 mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Gestión
            </div>
            {menuItems.slice(2, 5).map((item) => renderMenuItem(item))}

            <div className="mt-6 mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Configuración
            </div>
            {menuItems.slice(5).map((item) => renderMenuItem(item))}
          </div>

          {/* User Profile Footer */}
          <div className="p-4 m-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5">
                <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  <img src="https://ui-avatars.com/api/?name=Admin+User&background=random" alt="Admin" className="w-full h-full" />
                </div>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Administrador</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@peruana.com</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {theme === 'dark' ? 'Claro' : 'Oscuro'}
              </button>
              <button
                className="flex items-center justify-center p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}