const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
    DynamoDBDocumentClient, 
    QueryCommand 
} = require('@aws-sdk/lib-dynamodb');
const OpenAI = require('openai');

class EmailGenerator {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        //Comment
        
        const client = new DynamoDBClient({
            region: 'eu-north-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        
        this.docClient = DynamoDBDocumentClient.from(client);
    }

    async generateEmail() {
        try {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            const nowFormatted = now.toISOString().split('T')[0];
            const sevenDaysAgoFormatted = sevenDaysAgo.toISOString().split('T')[0];

            console.log(`Fetching articles between ${sevenDaysAgoFormatted} and ${nowFormatted}`);

            // Array van alle datums in de range maken
            let allArticles = [];
            let currentDate = new Date(sevenDaysAgo);
            const endDate = new Date(now);

            // Loop door elke datum
            while (currentDate <= endDate) {
                const dateString = currentDate.toISOString().split('T')[0];
                
                const command = new QueryCommand({
                    TableName: 'news_articles',
                    IndexName: 'date-insights-index',
                    KeyConditionExpression: '#date = :date AND begins_with(#insights, :relevantPrefix)',
                    ExpressionAttributeNames: {
                        '#date': 'date',
                        '#insights': 'insights'
                    },
                    ExpressionAttributeValues: {
                        ':date': dateString,
                        ':relevantPrefix': 'Titel:'
                    },
                    ScanIndexForward: false
                });

                console.log(`Querying for date: ${dateString}`);
                const dbResponse = await this.docClient.send(command);
                if (dbResponse.Items && dbResponse.Items.length > 0) {
                    allArticles = allArticles.concat(dbResponse.Items);
                }

                // Ga naar de volgende dag
                currentDate.setDate(currentDate.getDate() + 1);
            }

            console.log(`Found ${allArticles.length} relevant articles`);

            if (allArticles.length === 0) {
                console.log('No relevant articles found');
                return null;
            }

            // Maak een gestructureerde lijst van alle artikelen
            const articlesList = allArticles.map(article => `
Titel: ${article.title}
URL: ${article.url}
Inzicht: ${article.insights}
`).join('\n---\n');

            const prompt = `
Je bent een Hans de AI innovator bij MACH8 die een email samenstelt voor het MACH8 team.
Deze email moet informeren over de meest interessante tech ontwikkelingen met een focus op AI.

Hier zijn de relevante artikelen en inzichten:

${articlesList}

Genereer een professionele maar toegankelijke email die:
1. Begint met een korte tekstuele intro over de belangrijkste trends deze week
2. Voor elk artikel dat benoemd word ALTIJD de linkt naar de bron toevoegd

Gebruik deze stijl:
- Informeel maar professioneel
- Focus op praktische toepassingen
- Maak duidelijk waarom iets interessant is voor MACH8
- Voeg relevante emoji's toe voor visuele structuur

Content Formats die wij maken:

Creative Lab is onze experimentele showcase van de nieuwste creatieve mogelijkheden. In dit format combineren we steeds twee essentiële elementen:

De allernieuwste creatieve AI-tools
We focussen op tools die geschikt zijn voor:
Video creatie/bewerking
Audio generatie/manipulatie
Visual design/effecten
3D/AR experiences


Een relevante actualiteit of trend

Het doel van de Creative Lab sectie in de nieuwsbrief is inspiratie bieden voor nieuwe content door:

Recent gelanceerde relevante tools te highlighten
Mogelijke combinaties van tools te suggereren
Creatieve invalshoeken te schetsen

Techdive (podcast)

30-40 minuten discussie met Marc (host), Eelco en jij
Focus op innovatie topics (bijv. persoonlijke AI assistenten, zelfrijdende auto's, ruimtevaart)
Haakt aan op recent nieuws (bijv. SpaceX launch, OpenAI Advanced Voice release)
Doelgroep: niet-technische mensen met interesse in tech

News flash (video)

30 seconden video's
Showcase van nieuwe/interessante tools
Praktische demonstratie zonder te technisch te worden
Voorbeelden: gen-AI Minecraft met Oasis, voice-overs met Elevenlabs

Nieuwsbrief (Substack)

Frequentie: tweewekelijks
3-4 belangrijke recente topics
Inclusief video versie
Focus op belangrijkste tech gebeurtenissen

Plaats je antwoord in de volgende email HTML template, waar nodig mag je aanpassingen!

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MACH8 AI & Tech Update</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            text-align: center;
            padding: 40px 20px;
            background-color: #B5B3FF;
            color: white;
            margin: -20px -20px 20px -20px;
        }
        .header h1 {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 0.5px;
        }
        .section {
            margin: 30px 0;
            padding: 15px;
            background-color: #ffffff;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .section-title {
            color: #000000;
            font-size: 24px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            font-weight: bold;
        }
        .highlight {
            color: #FF7F5C;
            font-weight: bold;
        }
        .update-item {
            margin: 20px 0;
            padding: 15px;
            background-color: #ffffff;
            border-left: 4px solid #FF7F5C;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .emoji {
            margin-right: 8px;
            font-size: 24px;
        }
        .idea-box {
            margin-top: 15px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #FF7F5C;
        }
        .bullet-list {
            margin: 15px 0;
            padding-left: 20px;
        }
        .bullet-list li {
            margin-bottom: 10px;
            color: #333;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
            margin-top: 40px;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100%;
                padding: 10px;
            }
            .header {
                margin: -10px -10px 20px -10px;
            }
        }
    </style>
</head>

<body>
    <div class="container">        
        <!-- MAIN SECTION -->
        <div class="section">
            <div class="section-title">
                <span class="emoji">💡</span><span class="highlight">Tech & AI</span> Updates
            </div>
            
            <!-- TEMPLATE VOOR NIEUWE UPDATE -->
            <div class="update-item">
                <h3>[Onderwerp] 🌟</h3>
                <p><strong>[Korte beschrijving van de update]</strong></p>
                <ul class="bullet-list">
                    <li>Belangrijkste <span class="highlight">[impact/verandering]</span></li>
                    <li>Relevante <span class="highlight">[details/ontwikkelingen]</span></li>
                </ul>
                <div class="idea-box">
                    <strong>Inzicht:</strong> [Toepassing of actie voor MACH8]
                </div>
            </div>

            <!-- KOPIEER BOVENSTAANDE UPDATE-ITEM DIV VOOR MEER UPDATES -->
            
        </div>

        <div class="footer">
            <p>Met vriendelijke groet,<br>
            [NAAM]<br>
            Innovation Lead at MACH8</p>
        </div>
    </div>
</body>
</html>
`;
            const OpenAiformatting = await this.openai.chat.completions.create({
                model: "o1-preview",
                messages: [{ role: "user", content: prompt }],
                temperature: 1,
            });


            const emailContent = OpenAiformatting.choices[0].message.content
                .replace(/^```html\s*/i, '') // Verwijder opening ```html
                .replace(/```\s*$/i, '')     // Verwijder closing ```
                .trim();                     // Verwijder extra whitespace
            return emailContent;

        } catch (error) {
            console.error('Error generating email:', error);
            return null;
        }
    }
}

module.exports = { EmailGenerator }; 