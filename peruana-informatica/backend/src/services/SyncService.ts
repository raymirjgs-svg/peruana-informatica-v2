import fs from 'fs';
import { Op } from 'sequelize';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { PeruanaInformaticaService } from './PeruanaInformaticaService';

export class SyncService {
    private static isSyncing = false;
    private static lastSyncTime = 0;
    private static SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes cooldown

    // Per-product cache: codigo_interno → timestamp of last sync
    private static productCache: Map<string, number> = new Map();
    private static PRODUCT_CACHE_MS = 60 * 1000; // 60 seconds per product

    // Brand cache: name (uppercase) → brand_id, to avoid repeated DB lookups per sync run
    private static brandCache: Map<string, number> = new Map();

    private static async resolveBrandId(marcaName: string | null | undefined): Promise<number | null> {
        if (!marcaName) return null;
        const key = marcaName.toUpperCase().trim();
        if (this.brandCache.has(key)) return this.brandCache.get(key)!;
        const [brand] = await Brand.findOrCreate({
            where: { name: key },
            defaults: { name: key, slug: Brand.generateSlug(key) }
        });
        this.brandCache.set(key, brand.id);
        return brand.id;
    }

    static getSyncStatus() {
        return {
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime > 0 ? this.lastSyncTime : null,
            nextSyncTime: this.lastSyncTime > 0 ? this.lastSyncTime + this.SYNC_INTERVAL_MS : null,
            intervalMs: this.SYNC_INTERVAL_MS,
        };
    }

    static async forceSyncProducts() {
        this.lastSyncTime = 0; // bypass cooldown
        return this.syncProducts();
    }

    /**
     * Syncs a single product's price/stock from ERP.
     * Uses a 60-second per-product cache to avoid hammering the ERP on every page view.
     * Returns true if prices were updated.
     */
    static async syncSingleProduct(codigoInterno: string): Promise<boolean> {
        const now = Date.now();
        const lastSync = this.productCache.get(codigoInterno) ?? 0;
        if (now - lastSync < this.PRODUCT_CACHE_MS) return false; // cached

        try {
            const syncData = await PeruanaInformaticaService.obtenerStockYPrecio(codigoInterno);
            if (!syncData) return false;

            const updateData: any = {
                price: syncData.pre_cli,
                price_web: syncData.pre_web,
                price_cot: syncData.pre_cot,
                price_dis: syncData.pre_dis,
                stock: syncData.stock,
            };
            if (syncData.nombre) updateData.name = syncData.nombre;
            const brandId = await this.resolveBrandId(syncData.marca);
            if (brandId) updateData.brand_id = brandId;

            await Product.update(updateData, { where: { codigo_interno: codigoInterno } as any });

            this.productCache.set(codigoInterno, now);
            return true;
        } catch (err: any) {
            console.error(`SyncService.syncSingleProduct error for ${codigoInterno}:`, err.message);
            return false;
        }
    }

    static async syncProducts() {
        // Prevent concurrent syncs and respect cooldown
        const now = Date.now();
        if (this.isSyncing || (now - this.lastSyncTime < this.SYNC_INTERVAL_MS)) {
            // Debug log to know why it skipped
            // console.log(`SyncService: Skipped. Syncing: ${this.isSyncing}, Cooldown: ${((this.SYNC_INTERVAL_MS - (now - this.lastSyncTime)) / 1000).toFixed(0)}s remaining`);
            return { skipped: true, reason: this.isSyncing ? 'Sync in progress' : 'Cooldown active' };
        }

        this.isSyncing = true;
        this.brandCache.clear(); // reset per-run cache
        let updatedCount = 0;
        let errorCount = 0;

        try {
            console.log('SyncService: Starting synchronization with External API...');

            // Get all active products with an internal code
            const products = await Product.findAll({
                where: {
                    codigo_interno: { [Op.ne]: null as any },
                    is_active: 1
                }
            });

            console.log(`SyncService: Found ${products.length} products to sync.`);

            // Process sequentially to avoid overwhelming the external API
            for (const product of products) {
                if (!product.codigo_interno) continue;

                try {
                    // Slight delay to be nice to the API
                    await new Promise(resolve => setTimeout(resolve, 200));

                    // Use centralized service logic to get active data
                    const syncData = await PeruanaInformaticaService.obtenerStockYPrecio(product.codigo_interno);

                    if (syncData) {
                        // Check if prices or stock changed
                        // SyncService maps:
                        // pre_cli -> price (Precio Base)
                        // pre_web -> price_web (Precio Online)
                        // pre_cot -> price_cot
                        // pre_dis -> price_dis

                        const newPrice = syncData.pre_cli;
                        const newPriceWeb = syncData.pre_web;
                        const newPriceCot = syncData.pre_cot;
                        const newPriceDis = syncData.pre_dis;
                        const newStock = syncData.stock;

                        if (product.codigo_interno === '15953') {
                            console.log(`[SYNC DEBUG 15953] DB: Cli=${product.price}, Web=${product.price_web}, Dis=${product.price_dis}`);
                            console.log(`[SYNC DEBUG 15953] API: Cli=${newPrice}, Web=${newPriceWeb}, Dis=${newPriceDis}`);
                        }

                        const newName = syncData.nombre || null;
                        const newBrandId = await this.resolveBrandId(syncData.marca);

                        if (
                            Number(product.price) !== newPrice ||
                            Number(product.price_web) !== newPriceWeb ||
                            Number(product.price_cot) !== newPriceCot ||
                            Number(product.price_dis) !== newPriceDis ||
                            product.stock !== newStock ||
                            (newName && product.name !== newName) ||
                            (newBrandId && (product as any).brand_id !== newBrandId)
                        ) {
                            const updateFields: any = {
                                price: newPrice,
                                price_web: newPriceWeb,
                                price_cot: newPriceCot,
                                price_dis: newPriceDis,
                                stock: newStock,
                            };
                            if (newName) updateFields.name = newName;
                            if (newBrandId) updateFields.brand_id = newBrandId;
                            await product.update(updateFields);
                            updatedCount++;
                        }
                    } else {
                        // Product not found in API or error
                        // console.warn(`SyncService: Data not found for ${product.codigo_interno}`);
                        errorCount++;
                    }
                } catch (err: any) {
                    console.error(`SyncService: Error syncing product ${product.codigo_interno}`, err.message);
                    errorCount++;
                }
            }

            this.lastSyncTime = Date.now();
            console.log(`SyncService: Sync completed. ${updatedCount} products updated. ${errorCount} errors.`);
            return { success: true, updated: updatedCount, errors: errorCount };

        } catch (error) {
            console.error('SyncService: Fatal error', error);
            return { error: 'Sync failed' };
        } finally {
            this.isSyncing = false;
        }
    }
}
