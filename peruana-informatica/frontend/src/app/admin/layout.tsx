'use client';

import { useEffect } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { usePathname } from "next/navigation";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

// Intercept all fetch calls to /api/admin/* and inject the JWT token automatically
function useAdminFetchInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      if (url.includes('/api/admin/') || url.includes('/api/blog/admin') || url.includes('/contacts/admin')) {
        const token = localStorage.getItem('adminToken');
        if (token) {
          const headers = new Headers(init?.headers);
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          init = { ...init, headers };
        }
      }
      return originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useAdminFetchInterceptor();

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
