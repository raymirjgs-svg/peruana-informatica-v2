'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated' || !session?.accessToken) {
            router.replace('/admin/login');
        }
    }, [session, status, router]);

    // Show loading while checking auth
    if (status === 'loading') {
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
    if (status === 'unauthenticated' || !session?.accessToken) {
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
