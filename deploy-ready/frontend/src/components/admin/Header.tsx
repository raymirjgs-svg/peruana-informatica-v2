'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const adminUser = session?.user?.username || session?.user?.name || "Admin";

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Breadcrumb / Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Panel de Administración</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona tu tienda desde aquí</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                {adminUser ? adminUser.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{adminUser || 'Admin'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Administrador</p>
              </div>
              <span className="text-gray-400">▼</span>
            </button>

            {/* Dropdown */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors flex items-center gap-2"
                >
                  <span>🚪</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
