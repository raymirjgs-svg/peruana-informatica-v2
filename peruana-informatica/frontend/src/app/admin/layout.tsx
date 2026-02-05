'use client';

import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { usePathname } from "next/navigation";
import AuthProvider from "@/components/providers/AuthProvider";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't require auth for login page
  const isLoginPage = pathname === '/admin/login';

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
