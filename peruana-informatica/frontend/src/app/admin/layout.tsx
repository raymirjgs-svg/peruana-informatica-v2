'use client';

import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { usePathname } from "next/navigation";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't require auth for login page (handle both with and without trailing slash)
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';

  return (
    <ThemeProvider>
      {isLoginPage ? (
        children
      ) : (
        <AdminAuthGuard>
          {children}
        </AdminAuthGuard>
      )}
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}
