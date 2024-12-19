const puppeteer = require('puppeteer');

async function scrapeWebsiteContent(url) {
    let browser;
    try {
        console.log('Scraping website content from:', url);
        
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Navigeer naar de pagina en wacht tot deze geladen is
        await page.goto(url, { 
            waitUntil: 'networkidle0', 
            timeout: 30000 
        });

        // Gebruik setTimeout via een Promise in plaats van waitForTimeout
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Haal de content op
        const content = await page.evaluate(() => {
            // Verwijder ongewenste elementen
            const elementsToRemove = document.querySelectorAll('script, style, iframe, nav, header, footer');
            elementsToRemove.forEach(el => el.remove());

            // Haal de main content op
            const mainContent = document.body.innerText;
            return mainContent.trim();
        });

        return content;

    } catch (error) {
        console.error('Error scraping website:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = {
    scrapeWebsiteContent
}; 