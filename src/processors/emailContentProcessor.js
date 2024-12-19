const OpenAI = require('openai');
// const promptTracker = require('../utils/promptTracker');

class EmailContentProcessor {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async splitEmailIntoArticles(emailContent, emailSubject, emailSender) {
        const prompt = `
            Analyze this email newsletter and split it into individual news articles.
            For each article, extract:
            1. Title
            2. URL (if present)
            3. Content/Description
            4. Source (if mentioned)
            5. Author (use the email sender: "${emailSender}")

            Format the response as a JSON array of articles, like this:
            {
                "articles": [
                    {
                        "title": "Article Title",
                        "url": "https://example.com/" or null if not present For hacker news ONLY use the url that goes to the article and not the comments page,
                        "content": "Article description or content",
                        "source": "Source name" or null if not present,
                        "author": "${emailSender}"
                    }
                ]
            }

            Email Subject: ${emailSubject}
            Email Content:
            ${emailContent}
        `;

        console.log('\nProcessing email with GPT-4o-mini....');
        console.log('Email Subject:', emailSubject);
        console.log('Email Sender:', emailSender);

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: 0.3,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            // await promptTracker.trackPrompt(response, 'contentProcessor');
            console.log(`Split email into ${result.articles.length} articles`);
            return result.articles;

        } catch (error) {
            console.error('Error processing email content:', error);
            return [];
        }
    }
}

module.exports = { EmailContentProcessor }; 