// ============================================
// Custom Toast Hook for Sileo
// ============================================
'use client';

import { sileo } from 'sileo';

export interface ToastOptions {
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export const useToast = () => {
    const success = (title: string, description?: string, options?: ToastOptions) => {
        return sileo.success({
            title,
            description,
            duration: options?.duration || 3000,
            position: options?.position,
        });
    };

    const error = (title: string, description?: string, options?: ToastOptions) => {
        return sileo.error({
            title,
            description,
            duration: options?.duration || 4000,
            position: options?.position,
        });
    };

    const info = (title: string, description?: string, options?: ToastOptions) => {
        return sileo.info({
            title,
            description,
            duration: options?.duration || 3000,
            position: options?.position,
        });
    };

    const warning = (title: string, description?: string, options?: ToastOptions) => {
        return sileo.warning({
            title,
            description,
            duration: options?.duration || 3500,
            position: options?.position,
        });
    };

    const promise = <T,>(
        promise: Promise<T>,
        {
            loading,
            success: successMsg,
            error: errorMsg,
        }: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: Error) => string);
        },
        options?: ToastOptions
    ) => {
        return sileo.promise(promise, {
            loading: { title: loading },
            success: (data) => ({
                title: typeof successMsg === 'function' ? successMsg(data) : successMsg,
            }),
            error: (error) => ({
                title: typeof errorMsg === 'function' ? errorMsg(error) : errorMsg,
            }),
            duration: options?.duration,
            position: options?.position,
        });
    };

    return {
        success,
        error,
        info,
        warning,
        promise,
    };
};
