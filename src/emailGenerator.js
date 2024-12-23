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
Je bent een Innovation Manager die een email samenstelt voor het MACH8 team.
Deze email moet informeren over de meest interessante tech ontwikkelingen.

Hier zijn de relevante artikelen en inzichten:

${articlesList}

Genereer een professionele maar toegankelijke email die:
1. Begint met een korte intro over de belangrijkste trends deze week
2. De artikelen groepeert per type (News Flash / Creative Lab / Tech Dive)
3. Per artikel een korte, pakkende beschrijving geeft
4. Per artikel een link naar de bron toevoegd 
5. Per artikel inhoudelijk voorbeeld gevene voor dat specifieke format van MACH8 

Gebruik deze stijl:
- Informeel maar professioneel
- Focus op praktische toepassingen
- Maak duidelijk waarom iets interessant is voor MACH8
- Voeg relevante emoji's toe voor visuele structuur

Hieronder meer uitleg over de groeperingen. De mail is namelijk ter inspiratie om de volgende formats mee te kunnen produceren:
Functie & Context:

Innovatie manager bij MACH8
Focus op experimenteren met nieuwste technologieën
Twee hoofdpilaren: Marketing en Product
Produceert content voor niet-technisch publiek met interesse in tech

Content Formats:

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

De sectie dient als inspiratiebron voor het maken van verhalende content waarin we experimenteren met de nieuwste tools. We willen hiermee zowel de technische mogelijkheden als de praktische toepasbaarheid van nieuwe AI-tools laten zien. Belangrijk is dat je best uitgebreid mag antwoorden op Creative Lab potentieel. Uitgewerkte voorbeelden zijn erg belangrijk.

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

Vereiste: minimaal 1 AI tool gebruiken

Nieuwsbrief (Substack)

Frequentie: tweewekelijks
3-4 belangrijke recente topics
Inclusief video versie
Focus op belangrijkste tech gebeurtenissen

Plaats je antwoord in de volgende email HTML template, waar nodig mag je aanpassingen en aanvullen doen!

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MACH8 AI & Tech Update Template</title>
    <!-- 
    MACH8 HUISSTIJL KLEUREN:
    - Hoofdkleur (paars): #B5B3FF
    - Accent (oranje): #FF7F5C 
    - Achtergrond sections: #ffffff
    - Text: #000000
    -->
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
        .section-title .highlight {
            color: #FF7F5C;
        }
        .news-item {
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
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
            margin-top: 40px;
        }
        .bullet-list {
            margin: 15px 0;
            padding-left: 20px;
        }
        .bullet-list li {
            margin-bottom: 10px;
            color: #333;
        }
        .highlight {
            color: #FF7F5C;
            font-weight: bold;
        }
        .cta-button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #FF7F5C;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 10px;
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
        <div class="header">
            <h1>STAY AHEAD OF THE CURVE</h1>
            <p>[WEEKNUMMER] - [DATUM]</p>
        </div>

       <!-- CREATIVE LAB -->
<div class="section">
    <div class="section-title">
        <span class="emoji">🎨</span><span class="highlight">Creative</span> Lab
    </div>
    
    <div class="news-item">
        <h3>This Week's Creative Inspiration 💡</h3>
        
        <!-- Content Creation Tools -->
        <h4>🎬 Relevant Tools for Storytelling</h4>
        <p><strong>Focus op tools die direct bijdragen aan content creatie:</strong></p>
        <ul class="bullet-list">
            <li>Video generatie (bijv. <span class="highlight">Runway, Pika, Sora</span>)</li>
            <li>Video editing (bijv. <span class="highlight">DaVinci, Adobe Premiere</span>)</li>
            <li>Audio tools (bijv. <span class="highlight">ElevenLabs, Descript</span>)</li>
            <li>Visual effects (bijv. <span class="highlight">Adobe Firefly, Midjourney</span>)</li>
            <li>3D/AR tools (bijv. <span class="highlight">Spline, Reality Composer</span>)</li>
        </ul>

        <!-- Creative Possibilities -->
        <div class="idea-box">
            <strong>Creative Lab potentie:</strong>
            <ul class="bullet-list">
                <li> Idee 1 voor een creative lab <span class="highlight">[tekst]</span></li>
                <li> Idee 2 voor een creative lab<span class="highlight">[tekst]</span></li>
            </ul>
        </div>
    </div>
</div>
        <!-- NEWS FLASH -->
        <div class="section">
            <div class="section-title">
                <span class="emoji">📰</span><span class="highlight">News</span> Flash
            </div>
            
            <!-- NEWS FLASH ITEM -->
            <div class="news-item">
                <h3>[Major News] 🌟</h3>
                <p><strong>[Breaking development or launch]</strong></p>
                <ul class="bullet-list">
                    <li>Primary <span class="highlight">[impact]</span></li>
                    <li>Industry <span class="highlight">[changes]</span></li>
                </ul>
                <div class="idea-box">
                    <strong>News Flash idea:</strong> [Application or action]
                </div>
            </div>
        </div>

        <!-- NEWS SHORT -->
        <div class="section">
            <div class="section-title">
                <span class="emoji">📱</span><span class="highlight">News</span> Short
            </div>
            
            <!-- NEWS SHORT ITEMS -->
            <div class="news-item">
                <h3>Quick Updates 🔄</h3>
                <ul class="bullet-list">
                    <li><strong>[Update 1]:</strong> <span class="highlight">[key point]</span></li>
                    <li><strong>[Update 2]:</strong> <span class="highlight">[key point]</span></li>
                    <li><strong>[Update 3]:</strong> <span class="highlight">[key point]</span></li>
                </ul>
                <div class="idea-box">
                    <strong>News Short takeaway:</strong> [Quick insight]
                </div>
            </div>
        </div>

        <!-- TECH DIVE -->
        <div class="section">
            <div class="section-title">
                <span class="emoji">🔬</span><span class="highlight">Tech</span> Dive
            </div>
            
            <!-- TECH DIVE ITEM -->
            <div class="news-item">
                <h3>[Technical Topic] Analysis ⚡</h3>
                <p><strong>[Technical development or insight]</strong></p>
                <ul class="bullet-list">
                    <li>Technical <span class="highlight">[details]</span></li>
                    <li>Implementation <span class="highlight">[approach]</span></li>
                </ul>
                <div class="idea-box">
                    <strong>Tech Dive insight:</strong> [Technical conclusion]
                </div>
            </div>
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

//             const openAiResponse = await this.openai.chat.completions.create({
//                 model: "o1-preview",
//                 messages: [{ role: "user", content: prompt }],
//                 temperature: 1,
//             });

//             const unprocessedEmail = openAiResponse.choices[0].message.content;

// const promptemailformatting = `
// Pas de head content toe aan de volgende email. 

// Inhoud voor de mail:
// ${unprocessedEmail}

// -------- EINDE INHOUD --------


// </html>


// `;
            const OpenAiformatting = await this.openai.chat.completions.create({
                model: "o1",
                messages: [{ role: "user", content: prompt }],
                temperature: 1,
            });
            console.log(OpenAiformatting.choices[0].message.content);


            const emailContent = OpenAiformatting.choices[0].message.content;            
            return emailContent;

        } catch (error) {
            console.error('Error generating email:', error);
            return null;
        }
    }
}

module.exports = { EmailGenerator }; 