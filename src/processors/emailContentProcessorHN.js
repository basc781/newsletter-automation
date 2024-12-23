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
            });

            let jsonString = response.choices[0].message.content.trim();
            console.log(response.usage + response.model);
            // Clean up the response
            jsonString = jsonString
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '');

            const parsedResponse = JSON.parse(jsonString);
            
            // Validate URLs and limit to first 5 articles
            parsedResponse.articles = parsedResponse.articles
                .filter(article => {
                    const url = article.url;
                    return url && 
                           url.includes('/') && 
                           !url.endsWith('.com') && 
                           !url.endsWith('.org') && 
                           !url.endsWith('.net');
                })
                .slice(0, 5); // Behoud alleen de eerste 5 artikelen

            return parsedResponse.articles;

        } catch (error) {
            console.error('Error processing HN Digest email:', error);
            return [];
        }
    }
}

module.exports = { EmailContentProcessorHN }; 