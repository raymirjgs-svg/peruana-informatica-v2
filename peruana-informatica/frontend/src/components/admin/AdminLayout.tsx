'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8f9fa] dark:bg-[#0B0F19] relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/10 blur-[120px] pointer-events-none" />

      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-72 transition-all duration-300 relative z-10">
        <Header />
        {children}
      </main>
    </div>
  );
}
