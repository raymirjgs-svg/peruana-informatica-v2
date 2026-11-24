'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Clave propia del panel admin: no choca con la preferencia del sitio publico.
const STORAGE_KEY = 'adminTheme';

function applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Estado inicial sincronizado con el script anti-flash del layout raiz.
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'light';
        const stored = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem('theme');
        return stored === 'dark' ? 'dark' : 'light';
    });

    useEffect(() => {
        // Si no hay preferencia guardada, seguir la del sistema.
        if (!localStorage.getItem(STORAGE_KEY) && !localStorage.getItem('theme')) {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setThemeState('dark');
                applyTheme('dark');
            }
        }
    }, []);

    const setTheme = (next: Theme) => {
        setThemeState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // modo privado / storage bloqueado: se mantiene solo en memoria
        }
        applyTheme(next);
    };

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
