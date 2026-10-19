import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";

import AuthProvider from "@/components/providers/AuthProvider";
import { AdminSessionSync } from "@/components/admin/AdminSessionSync";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AdminSessionSync>{children}</AdminSessionSync>
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </AuthProvider>
  );
}
