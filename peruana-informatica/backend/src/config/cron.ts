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

        cron.schedule('0 */3 * * *', async () => {
            logger.info('Running ERP product sync job...');
            try {
                await SyncService.syncProducts();
                logger.info('ERP product sync completed.');
            } catch (error) {
                logger.error('Error in ERP product sync cron job:', error);
            }
        });

        logger.info('Cron jobs initialized successfully');
    }
}
