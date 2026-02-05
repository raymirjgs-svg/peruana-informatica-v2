import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exportar como sitio estático para hosting compartido
  output: "standalone",

  // Fix NextAuth compatibility with Next.js 15
  serverExternalPackages: ["@auth/core"],

  // Deshabilitar optimización de imágenes para exportación estática
  // Si necesitas imágenes optimizadas, usa un servicio externo como Cloudinary


  // Configuración para URLs limpias
  trailingSlash: true,

  /* 
   * Configuración de imágenes optimizada
   * Se habilitan dominios externos necesarios para el proyecto
   */
  images: {
    unoptimized: true, // Disable optimization to avoid ECONNREFUSED in Docker
    remotePatterns: [
      // Development: Allow images from localhost (backend API)
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
        protocol: 'http',
        hostname: 'backend',
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
      // Permitir imágenes del propio dominio (producion self-hosted)
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