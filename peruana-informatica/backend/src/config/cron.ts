import cron from 'node-cron';
import { abandonedCartService } from '../services/AbandonedCartService';
import { SyncService } from '../services/SyncService';
import { logger } from '../config/logger';

export class CronJobScheduler {
    /**
     * Initialize all cron jobs
     */
    static initialize() {
        logger.info('Initializing cron jobs...');

        // Run abandoned cart recovery emails every 6 hours
        cron.schedule('0 */6 * * *', async () => {
            logger.info('Running abandoned cart recovery job...');
            try {
                const sent = await abandonedCartService.sendRecoveryEmails();
                logger.info(`Abandoned cart recovery completed. ${sent} emails sent.`);
            } catch (error) {
                logger.error('Error in abandoned cart cron job:', error);
            }
        });

        // Sync ERP prices and stock every 10 minutes
        cron.schedule('*/10 * * * *', async () => {
            logger.info('Running scheduled ERP price/stock sync...');
            try {
                const result = await SyncService.forceSyncProducts();
                logger.info(`ERP sync completed: ${JSON.stringify(result)}`);
            } catch (error) {
                logger.error('Error in ERP price sync cron job:', error);
            }
        });

        logger.info('Cron jobs initialized successfully');
    }
}
