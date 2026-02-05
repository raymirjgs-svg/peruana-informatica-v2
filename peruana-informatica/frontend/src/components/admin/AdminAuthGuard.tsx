'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Check localStorage for admin token
        const token = localStorage.getItem('adminToken');

        if (!token) {
            router.replace('/admin/login');
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
