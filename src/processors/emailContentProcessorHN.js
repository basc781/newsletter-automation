const OpenAI = require('openai');
require('dotenv').config();

class EmailContentProcessorHN {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async splitEmailIntoArticles(emailContent, subject, author) {
        try {
            console.log('Starting HN email processing:', {
                subject: subject,
                author: author,
                contentLength: emailContent?.length
            });

            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                    role: "user",
                    content: `
                        Parse this Hacker News Digest email and return ONLY a JSON object with the COMPLETE, SPECIFIC URLs.
                        For example, use "https://github.com/username/repo" instead of just "github.com".
                        Return in this exact format (no markdown):
                        {
                            "articles": [
                                {
                                    "title": "Complete article title",
                                    "url": "Complete, specific URL (not shortened, not domain-only)",
                                    "content": "Include points and comments count if available",
                                    "author": "${author}"
                                }
                            ]
                        }

                        Email content:
                        ${emailContent}
                    `
                }],
                temperature: 0.3,
            }).catch(error => {
                console.error('OpenAI API Error in HN processor:', {
                    message: error.message,
                    type: error.type,
                    status: error.status,
                    code: error.code,
                    stack: error.stack
                });
                throw error;
            });

            let jsonString = response.choices[0].message.content.trim();
            console.log('OpenAI Response received:', {
                modelUsed: response.model,
                tokensUsed: response.usage,
                responseLength: jsonString.length
            });

            try {
                jsonString = jsonString
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '');
                const parsedResponse = JSON.parse(jsonString);

                console.log('Successfully parsed HN response:', {
                    articlesFound: parsedResponse.articles?.length || 0
                });

                // Bestaande URL validatie en filtering
                parsedResponse.articles = parsedResponse.articles
                    .filter(article => {
                        const url = article.url;
                        const isValid = url && 
                               url.includes('/') && 
                               !url.endsWith('.com') && 
                               !url.endsWith('.org') && 
                               !url.endsWith('.net');
                        
                        if (!isValid) {
                            console.warn('Invalid URL filtered out:', url);
                        }
                        return isValid;
                    })
                    .slice(0, 5);

                console.log('Final filtered articles:', {
                    count: parsedResponse.articles.length
                });

                return parsedResponse.articles;

            } catch (parseError) {
                console.error('JSON Parsing Error in HN processor:', {
                    error: parseError.message,
                    rawResponse: jsonString.substring(0, 200), // Eerste 200 karakters van de response
                    stack: parseError.stack
                });
                throw parseError;
            }

        } catch (error) {
            console.error('Fatal error in HN processor:', {
                error: error.message,
                type: error.constructor.name,
                stack: error.stack,
                subject: subject,
                author: author
            });
            return [];
        }
    }
}

module.exports = { EmailContentProcessorHN }; 