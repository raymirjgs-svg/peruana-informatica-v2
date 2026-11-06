'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0B0F19] relative">
      {/* Subtle background gradient orbs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-100/30 dark:bg-blue-900/10 blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="fixed bottom-0 left-72 w-[400px] h-[400px] rounded-full bg-indigo-100/20 dark:bg-indigo-900/10 blur-[100px] pointer-events-none translate-y-1/2" />

      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-72 transition-all duration-300 relative z-10 flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
