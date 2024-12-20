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
        console.log('Starting email scraping process...');
        await scrapeEmails();
        // EENS KIJKEN OF DIE YML werkt
        const generator = new EmailGenerator();
        const emailContent = await generator.generateEmail();
        
        if (emailContent) {
            await sendEmail(emailContent);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        console.log('All operations completed');
        process.exit(0);  // We kunnen direct afsluiten
    }
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});