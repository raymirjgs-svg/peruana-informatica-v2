/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ========== SHADCN/UI COLORS (Mantener compatibilidad) ==========
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ========== PERUANA INFORMÁTICA BRAND COLORS ==========
        // Paleta Corporativa: Rojo, Negro, Plomo, Gris

        brand: {
          // ROJO - Color Principal de Acción
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',  // Principal
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          // NEGRO - Autoridad y Premium
          black: {
            DEFAULT: '#000000',
            900: '#0a0a0a',
            800: '#1a1a1a',
            700: '#262626',
            600: '#333333',
          },
          // PLOMO - Profesionalismo
          slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          },
          // GRIS - Neutralidad
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
          },
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1a1a1a 0%, #1e293b 100%)',
        'gradient-header': 'linear-gradient(to right, #0a0a0a 0%, #0f172a 50%, #0a0a0a 100%)',
        'gradient-subtle': 'linear-gradient(to bottom, #1e293b 0%, #0f172a 100%)',
      },
      boxShadow: {
        'brand-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'brand-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'brand-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'brand-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'brand-red': '0 10px 15px -3px rgba(220, 38, 38, 0.3), 0 4px 6px -2px rgba(220, 38, 38, 0.15)',
      },
    }
  },
  plugins: [],
}