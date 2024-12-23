const OpenAI = require('openai');
// const promptTracker = require('../utils/promptTracker');

class EmailContentProcessor {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async splitEmailIntoArticles(emailContent, emailSubject, emailSender) {
        try {
            console.log('Starting email processing:', {
                subject: emailSubject,
                sender: emailSender,
                contentLength: emailContent?.length
            });

            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                    role: "user",
                    content: `
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
                    `
                }],
                temperature: 0.3,
                response_format: { type: "json_object" }
            }).catch(error => {
                console.error('OpenAI API Error:', {
                    message: error.message,
                    type: error.type,
                    status: error.status,
                    code: error.code,
                    stack: error.stack
                });
                throw error;
            });

            const result = JSON.parse(response.choices[0].message.content);
            console.log('Successfully processed email:', {
                articlesFound: result.articles?.length || 0,
                modelUsed: response.model,
                tokensUsed: response.usage
            });

            return result.articles;

        } catch (error) {
            console.error('Error in EmailContentProcessor:', {
                error: error.message,
                type: error.constructor.name,
                stack: error.stack,
                subject: emailSubject,
                sender: emailSender
            });
            return [];
        }
    }
}

module.exports = { EmailContentProcessor }; 