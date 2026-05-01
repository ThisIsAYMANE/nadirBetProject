import cron from 'node-cron';
import sportMonksSyncService from '../services/SportMonksSyncService.js';

export function initSportMonksCron() {
    console.log('⏰ Initializing SportMonks Core Sync Cron Jobs...');

    // Run every night at 03:00 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('🕰️ Running scheduled SportMonks core dictionaries sync...');
        try {
            await sportMonksSyncService.syncAllCoreData();
        } catch (error) {
            console.error('❌ Scheduled sync failed:', error);
        }
    });

    // Optional: Run immediately on startup if needed (uncomment in production)
    // setTimeout(() => sportMonksSyncService.syncAllCoreData(), 5000);
}
