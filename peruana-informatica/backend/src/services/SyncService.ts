import fs from 'fs';
import { Op } from 'sequelize';
import { Product } from '../models/Product';
import { PeruanaInformaticaService } from './PeruanaInformaticaService';

export class SyncService {
    private static isSyncing = false;
    private static lastSyncTime = 0;
    private static SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour cooldown

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

    static async syncProducts() {
        // Prevent concurrent syncs and respect cooldown
        const now = Date.now();
        if (this.isSyncing || (now - this.lastSyncTime < this.SYNC_INTERVAL_MS)) {
            // Debug log to know why it skipped
            // console.log(`SyncService: Skipped. Syncing: ${this.isSyncing}, Cooldown: ${((this.SYNC_INTERVAL_MS - (now - this.lastSyncTime)) / 1000).toFixed(0)}s remaining`);
            return { skipped: true, reason: this.isSyncing ? 'Sync in progress' : 'Cooldown active' };
        }

        this.isSyncing = true;
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

                        if (
                            Number(product.price) !== newPrice ||
                            Number(product.price_web) !== newPriceWeb ||
                            Number(product.price_cot) !== newPriceCot ||
                            Number(product.price_dis) !== newPriceDis ||
                            product.stock !== newStock
                        ) {
                            await product.update({
                                price: newPrice,
                                price_web: newPriceWeb,
                                price_cot: newPriceCot,
                                price_dis: newPriceDis,
                                stock: newStock
                            });
                            updatedCount++;
                            // console.log(`SyncService: Updated ${product.codigo_interno}: Stock=${newStock}, Web=${newPriceWeb}`);
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
