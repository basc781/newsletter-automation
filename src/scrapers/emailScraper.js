const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { formatInTimeZone } = require('date-fns-tz');
const db = require('../db');
const { EmailContentProcessor } = require('../processors/emailContentProcessor');
const { EmailContentProcessorHN } = require('../processors/emailContentProcessorHN');
const emailWebsiteContentScraper = require('./emailWebsiteContentScraper');
const insightsClassifier = require('../classifiers/insightsClassifier');


const imapConfig = {
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    },
    logger: false
};

// Helper function to format dates in CET
function formatCETDate(date) {
    return formatInTimeZone(date, 'Europe/Amsterdam', "yyyy-MM-dd'T'HH:mm:ssXXX");
}

async function scrapeEmails() {
    const client = new ImapFlow(imapConfig);
    const standardProcessor = new EmailContentProcessor();
    const hnProcessor = new EmailContentProcessorHN();

    try {
        await client.connect();
        console.log('Connected to IMAP server');

        const lock = await client.getMailboxLock('INBOX');
        try {
            // Get date from 8 days ago in CET
            const eightDaysAgo = new Date();
            eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
            eightDaysAgo.setHours(0, 0, 0, 0);

            console.log(`Searching for emails since: ${eightDaysAgo.toISOString()}`);

            // Count total messages that match our criteria
            const messageCount = await client.search({ since: eightDaysAgo });
            
            

            let processedCount = 0;
            for await (let message of client.fetch({ since: eightDaysAgo }, { source: true })) {

                processedCount++;

                try {
                    console.log(`\nProcessing message ${processedCount} of ${messageCount.length}`);
                    const mail = await simpleParser(message.source);
                    
                    // Check for duplicate message_id
                    try {
                        console.log(`Checking for duplicate message_id: ${mail.messageId}`);
                        
                        const existingArticles = await db.queryItems(
                            'news_articles',
                            'message_id = :msgId',
                            { ':msgId': mail.messageId },
                            'MessageIdIndex'  // Hier geef je aan dat je de GSI wilt gebruiken
                        );
                        
                        if (existingArticles.Items && existingArticles.Items.length > 0) {
                            console.log(`Skipping email - already processed (Message-ID: ${mail.messageId})`);
                            continue;
                        }
                    } catch (error) {
                        console.error('Error checking duplicates:', error);
                    }

                    console.log('Processing new email...');
                    const processor = mail.from.text.includes('hello@hndigest.com') 
                        ? hnProcessor 
                        : standardProcessor;

                    const contentToProcess = mail.from.text.includes('hello@hndigest.com')
                        ? mail.html
                        : (mail.text || mail.html);

                    if (mail.from.text.includes('hello@hndigest.com')) {
                        console.log('Processing HN Digest email...');
                    } else {
                        console.log('Processing standard email...');
                    }

                    const articles = await processor.splitEmailIntoArticles(
                        contentToProcess,
                        mail.subject,
                        mail.from.text
                    );

                    console.log(`Found ${articles.length} articles in this email`);

                    for (const article of articles) {
                        try {
                            let articleUrl = article.url || `email:${mail.messageId}#${encodeURIComponent(article.title)}`;
                            articleUrl = articleUrl.split(/[?#]/)[0];

                            // Check of het een HN Digest artikel is en scrape indien nodig
                            if (mail.from.text.includes('hello@hndigest.com')) {
                                console.log(`HN Digest article detected, scraping website content for: ${articleUrl}`);
                                try {
                                    const scrapedContent = await emailWebsiteContentScraper.scrapeWebsiteContent(articleUrl);
                                    if (scrapedContent) {
                                        article.content = scrapedContent;
                                        article.needs_scraping = 0;
                                        article.last_scraped = new Date().toISOString();
                                    }
                                } catch (error) {
                                    console.error(`Error scraping website content for ${articleUrl}:`, error);
                                    article.needs_scraping = 1;
                                }
                            }

                            // Classificeer het artikel
                            const insights = await insightsClassifier.classifyContent(
                                article.content,
                                article.title,
                                articleUrl
                            );

                            // Ga verder met het opslaan van het artikel
                            const result = await db.putItem('news_articles', {
                                id: Date.now().toString(),
                                date: new Date().toISOString().split('T')[0],
                                message_id: mail.messageId,
                                title: article.title,
                                content: article.content,
                                url: articleUrl,
                                source: mail.from.text,
                                insights: insights,
                            });

                            console.log(`Article processed and classified: ${article.title}`);

                        } catch (error) {
                            console.error(`Error processing article: ${error}`);
                        }
                    }

                } catch (error) {
                    console.error(`Error processing message ${processedCount}:`, error);
                    continue;
                }
            }

            console.log(`\nCompleted processing ${processedCount} of ${messageCount.length} messages`);

        } finally {
            lock.release();
        }

    } catch (error) {
        console.error('Error in email scraper:', error);
    } finally {
        console.log('Closing connections...');
        console.log('Connections closed');
    }
}

module.exports = { scrapeEmails };