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
    try {
        console.log('Starting process:', {
            timestamp: new Date().toISOString(),
            nodeVersion: process.version,
            memory: process.memoryUsage()
        });

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
        // Zorg dat de process exit code niet-nul is bij errors
        process.exitCode = 1;
    } finally {
        console.log('Process completing:', {
            timestamp: new Date().toISOString(),
            memory: process.memoryUsage()
        });
    }
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});