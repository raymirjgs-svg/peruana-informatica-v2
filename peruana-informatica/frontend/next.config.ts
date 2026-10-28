import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Exportar como sitio estático para hosting compartido
  output: "standalone",

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

  // ESLint se ejecuta en el build: los errores bloquean, los warnings no.
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    if (process.env.DOCKER_ENV === 'true') {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);