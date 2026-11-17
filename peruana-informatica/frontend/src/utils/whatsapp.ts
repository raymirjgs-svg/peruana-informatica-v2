// ============================================
// src/utils/whatsapp.ts
// Helpers para consultas de precio por WhatsApp
// ============================================

export const DEFAULT_WHATSAPP = '988552455';

/**
 * Normaliza un numero de telefono (solo digitos, con codigo de pais).
 */
export function normalizeWhatsapp(phone?: string | null): string {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return DEFAULT_WHATSAPP;
    return digits.startsWith('51') ? digits : `51${digits}`;
}

/**
 * Construye el enlace de WhatsApp con un mensaje pre-cargado.
 */
export function buildWhatsappLink(message: string, phone?: string | null): string {
    return `https://wa.me/${normalizeWhatsapp(phone)}?text=${encodeURIComponent(message)}`;
}

/**
 * Un producto solo es comprable en linea si tiene precio publicado (> 0).
 * Los productos sin precio se muestran como "Consultar precio" y deben
 * coordinarse por WhatsApp: nunca pueden llegar al checkout.
 */
export function hasPublishedPrice(price: number | string | null | undefined): boolean {
    const value = Number(price);
    return Number.isFinite(value) && value > 0;
}

/**
 * Mensaje estandar para consultar el precio de un producto.
 */
export function priceInquiryMessage(productName: string, quantity = 1): string {
    const qty = quantity > 1 ? ` (${quantity} unidades)` : '';
    return `Hola, quiero consultar el precio de: ${productName}${qty}.`;
}
