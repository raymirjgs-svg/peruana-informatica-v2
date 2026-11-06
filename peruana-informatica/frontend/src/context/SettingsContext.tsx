
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CompanySettings {
    id: number;
    company_name: string;
    company_ruc: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    logo_url?: string;
    favicon_url?: string;
    company_whatsapp?: string;
    company_website?: string;
    store_address?: string;
    store_hours?: string;
    facebook_url?: string;
    instagram_url?: string;
    twitter_url?: string;
    linkedin_url?: string;
    show_distributor_price_in_detail?: boolean;
}

interface SettingsContextType {
    settings: CompanySettings | null;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    logoUrl: string; // Helper para obtener URL completa
    faviconUrl: string; // Helper para obtener URL completa
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/api/settings`);

            if (res.ok) {
                const data = await res.json();
                // Transform flat key-value to CompanySettings structure
                const transformedSettings: CompanySettings = {
                    id: 1,
                    company_name: data.company_name || 'Peruana Informática',
                    company_ruc: data.company_ruc || '',
                    company_address: data.company_address || '',
                    company_phone: data.company_phone || '',
                    company_email: data.company_email || '',
                    logo_url: data.logo_url,
                    favicon_url: data.favicon_url,
                    company_whatsapp: data.company_whatsapp,
                    company_website: data.company_website,
                    store_address: data.store_address,
                    store_hours: data.store_hours,
                    facebook_url: data.facebook_url,
                    instagram_url: data.instagram_url,
                    twitter_url: data.twitter_url,
                    linkedin_url: data.linkedin_url,
                    show_distributor_price_in_detail: data.show_distributor_price_in_detail === 'true',
                };
                setSettings(transformedSettings);
            } else {
                console.error('Failed to fetch settings status:', res.status);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const getFullUrl = (path?: string, fallback = '') => {
        if (!path) return fallback;
        if (path.startsWith('http')) return path;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        // Ensure path starts with slash if not present
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${apiUrl}${cleanPath}`;
    };

    const logoUrl = getFullUrl(settings?.logo_url, '/logo/peruana-logo.png'); // Default fallback logo path
    const faviconUrl = getFullUrl(settings?.favicon_url, '/favicon.ico');

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, logoUrl, faviconUrl }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
