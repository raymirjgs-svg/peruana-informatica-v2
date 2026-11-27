'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0B0F19] relative">
      {/* Subtle background gradient orbs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-100/30 dark:bg-blue-900/10 blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="fixed bottom-0 left-72 w-[400px] h-[400px] rounded-full bg-blue-100/20 dark:bg-blue-900/10 blur-[100px] pointer-events-none translate-y-1/2" />

      <Sidebar />

      {/*
        El <main> NO lleva z-index: position relative + z-index crea un contexto
        de apilado propio y los overlays fixed que viven dentro (modales,
        toasts) quedaban por debajo del sidebar (z-40), que es hermano del main.
        Escala de capas del admin:
          contenido     z-0 .. z-20   dentro de la pagina
          header sticky z-30
          sidebar       z-40
          header movil  z-50
          desplegable   z-[55]
          modal         z-[60]   (Portal -> document.body)
          toast         z-[70]
      */}
      <main className="flex-1 ml-0 lg:ml-72 transition-all duration-300 relative flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
