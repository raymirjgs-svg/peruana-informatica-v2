import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exportar como sitio estático para hosting compartido
  output: "standalone",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Fix NextAuth compatibility with Next.js 15
  serverExternalPackages: ["@auth/core"],

  /* 
   * Configuración de imágenes optimizada
   * Habilitar optimización solo en producción
   */
  images: {
    // En producción: optimización habilitada con Sharp
    // En desarrollo: deshabilitado para velocidad
    unoptimized: true,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 1 día
    remotePatterns: [
      // Production server
      {
        protocol: 'http',
        hostname: '200.58.98.122',
        pathname: '/images/**',
      },
      {
        protocol: 'http',
        hostname: 'peruana-informatica-backend',
        port: '3001',
        pathname: '/images/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/images/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },

  // ESLint laxo por ahora para permitir iteración rápida en UX, pero TypeScript estricto.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  async rewrites() {
    // ✅ NO usar rewrites en Docker
    // El frontend llama directamente a NEXT_PUBLIC_API_URL
    // En Docker local: http://localhost:3001
    // En Docker producción con Nginx: https://dominio.com
    // Nginx hace el routing, Next.js no debe interferir
    return [];
  },
};

export default nextConfig;