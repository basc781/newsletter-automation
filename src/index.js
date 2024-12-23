const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('Environment check:');
console.log('Current directory:', process.cwd());
console.log('.env file location:', path.resolve(__dirname, '../.env'));
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'Present (length: ' + process.env.GMAIL_APP_PASSWORD.length + ')' : 'Not set');

const { scrapeEmails } = require('./scrapers/emailScraper');
const { EmailGenerator } = require('./emailGenerator');
const { sendEmail } = require('./emailSender');

async function main() {
    let memoryInterval;
    try {
        console.log('Starting process:', {
            timestamp: new Date().toISOString(),
            nodeVersion: process.version,
            memory: process.memoryUsage()
        });

        // Start memory monitoring
        memoryInterval = setInterval(() => {
            const memUsage = process.memoryUsage();
            console.log('Memory status:', {
                timestamp: new Date().toISOString(),
                heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
                rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
            });
        }, 10000);

        // Voeg unhandled rejection handler toe
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', {
                promise: promise,
                reason: reason,
                stack: reason.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Voeg uncaught exception handler toe
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });

        await scrapeEmails();
        
        const generator = new EmailGenerator();
        const emailContent = await generator.generateEmail();
        
        if (emailContent) {
            await sendEmail(emailContent);
        }

    } catch (error) {
        console.error('Fatal error in main process:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        process.exitCode = 1;
    } finally {
        // Cleanup
        if (memoryInterval) clearInterval(memoryInterval);
        
        console.log('Process completing:', {
            timestamp: new Date().toISOString(),
            memory: process.memoryUsage()
        });

        // Forceer een nette afsluiting
        process.exit(process.exitCode || 0);
    }
}

// Start het process
main();