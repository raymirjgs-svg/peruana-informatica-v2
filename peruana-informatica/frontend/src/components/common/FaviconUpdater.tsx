
'use client';
import { useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

export function FaviconUpdater() {
    const { faviconUrl } = useSettings();

    useEffect(() => {
        if (faviconUrl) {
            const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = faviconUrl;
            const head = document.head || document.getElementsByTagName('head')[0];
            if (head) {
                head.appendChild(link);
            }
        }
    }, [faviconUrl]);

    return null;
}
