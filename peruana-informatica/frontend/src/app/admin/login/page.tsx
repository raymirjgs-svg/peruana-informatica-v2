"use client";
import { AlertTriangle } from 'lucide-react';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession, signOut } from "next-auth/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'expired') {
      setSessionExpired(true);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Credenciales incorrectas. Si inginaste varias veces seguidas, espera 15 minutos antes de reintentar.");
        return;
      }

      const session = await getSession();
      const role = session?.user?.role;

      if (role !== "admin" && role !== "super-admin") {
        await signOut({ redirect: false });
        setError("No tenés permisos de administrador");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-gray-800 p-4">
      <div className="w-full max-w-sm dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
          <p className="text-sm dark:text-gray-400 mt-1">Peruana de Informática</p>
        </div>

        {sessionExpired && (
          <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-md px-3 py-2 text-sm" role="alert">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <span>Tu sesión ha expirado. Por favor inicia sesión nuevamente.</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 dark:text-white dark:bg-gray-900 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="admin@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 dark:text-white dark:bg-gray-900 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
