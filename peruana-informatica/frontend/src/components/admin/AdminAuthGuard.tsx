'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');

        if (!token || isTokenExpired(token)) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            router.replace('/admin/login?reason=expired');
            setIsAuthenticated(false);
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    // Show loading while checking auth
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    // Don't render children if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500">Redirigiendo al login...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
