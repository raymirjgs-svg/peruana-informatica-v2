import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";

import AuthProvider from "@/components/providers/AuthProvider";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </AuthProvider>
  );
}
