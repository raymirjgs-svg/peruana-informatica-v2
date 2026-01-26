import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exportar como sitio estático para hosting compartido
  // output: "export",

  // Deshabilitar optimización de imágenes para exportación estática
  // Si necesitas imágenes optimizadas, usa un servicio externo como Cloudinary


  // Configuración para URLs limpias
  trailingSlash: true,

  /* 
   * Configuración de imágenes optimizada
   * Se habilitan dominios externos necesarios para el proyecto
   */
  images: {
    // unoptimized: false, // Default is false (optimized)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: '54.144.139.115', // IP de producción
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.122',
        port: '3001',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
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
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:3001/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;