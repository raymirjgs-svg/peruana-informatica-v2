"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";

export function AdminSessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [ready, setReady] = useState(false);
  const signingOut = useRef(false);

  useEffect(() => {
    if (status === "loading") {
      setReady(false);
      return;
    }

    if (status === "authenticated") {
      const token = session?.accessToken;
      const sessionError = (session as { error?: string } | null)?.error;

      if (!token || sessionError) {
        if (!signingOut.current) {
          signingOut.current = true;
          void signOut({ callbackUrl: "/admin/login" });
        }
        return;
      }

      localStorage.setItem("adminToken", token);
      localStorage.removeItem("adminUser");
      signingOut.current = false;
      setReady(true);
      return;
    }

    localStorage.removeItem("adminToken");
    setReady(true);
  }, [session, status]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">Cargando sesión...</div>
      </div>
    );
  }

  return <>{children}</>;
}
