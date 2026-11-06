/**
 * Centralized price column mapping utility.
 * Maps setting values to actual database column names.
 */

import { Setting } from '../models/Setting';

const PRICE_FIELD_MAP: Record<string, string> = {
    'pre_web': 'price_web',
    'pre_dis': 'price_dis',
    'pre_cot': 'price',
    'pre_cli': 'price',
};

/**
 * Maps a price setting value to the corresponding database field name.
 */
export function getPriceField(priceSetting: string): string {
    return PRICE_FIELD_MAP[priceSetting] || 'price';
}

/**
 * Reads the active price column from settings.
 */
export async function getActivePriceColumn(): Promise<string> {
    const setting = await Setting.findByPk('cotizador_price_type');
    const value = setting ? setting.value : 'pre_web';
    // Handle legacy fallback
    return value === 'pre_cot' ? 'pre_web' : value;
}

/**
 * Gets the actual price value from a product based on the active price setting.
 */
export function getProductPrice(product: any, activePriceCol: string): number {
    if (activePriceCol === 'pre_web') return Number(product.price_web) || 0;
    if (activePriceCol === 'pre_dis') return Number(product.price_dis) || 0;
    return Number(product.price) || 0;
}
