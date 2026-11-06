'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { couponService, type PromoBanner } from '@/services/CouponService';
import Image from 'next/image';

const COOKIE_NAME = 'promo_modal_seen';
const COOKIE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function PromoModal() {
    const [banner, setBanner] = useState<PromoBanner | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkAndShowBanner = async () => {
            // Check if modal was already seen
            const modalSeen = localStorage.getItem(COOKIE_NAME);
            if (modalSeen) {
                const seenTime = parseInt(modalSeen);
                if (Date.now() - seenTime < COOKIE_DURATION) {
                    return; // Don't show again
                }
            }

            // Fetch active banners
            const result = await couponService.getActiveBanners();

            if (result.success && result.data && result.data.length > 0) {
                // Get first popup banner
                const popupBanner = result.data.find(b => b.show_as_popup);

                if (popupBanner) {
                    setBanner(popupBanner);

                    // Show with delay
                    setTimeout(() => {
                        setIsVisible(true);
                    }, (popupBanner.popup_delay || 3) * 1000);
                }
            }
        };

        checkAndShowBanner();
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Set cookie to not show again for 24 hours
        localStorage.setItem(COOKIE_NAME, Date.now().toString());
    };

    const handleCopyCoupon = () => {
        if (banner?.coupon_code) {
            navigator.clipboard.writeText(banner.coupon_code);
            alert(`Código ${banner.coupon_code} copiado al portapapeles!`);
        }
    };

    if (!isVisible || !banner) {
        return null;
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-50 transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full pointer-events-auto transform transition-all">
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>

                    {/* Banner Image */}
                    <div className="relative w-full h-64 rounded-t-2xl overflow-hidden">
                        <Image
                            src={banner.image_url}
                            alt={banner.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Content */}
                    <div className="p-8 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                            {banner.title}
                        </h2>

                        {banner.description && (
                            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                                {banner.description}
                            </p>
                        )}

                        {banner.coupon_code && (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-xl p-6 mb-6">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Usa el código:
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <code className="text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                                        {banner.coupon_code}
                                    </code>
                                    <button
                                        onClick={handleCopyCoupon}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleClose}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                        >
                            ¡Empezar a Comprar!
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
