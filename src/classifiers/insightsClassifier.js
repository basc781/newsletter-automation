const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function classifyContent(content, title, url) {
    try {
        console.log('Starting classification:', {
            title,
            timestamp: new Date().toISOString()
        });

        const prompt = `Je bent een AI assistent die nieuwsartikelen filtert en analyseert. De focus ligt op artikellen die gaan over Generative AI tools en research ontwikellen probeer andere dingen er dus uit te fileren. Review het artikel tussen de '——— begin/eind artikel ———' tags en bepaal de relevantie voor deze content formats:


News Flash

30 seconden video
Showcase van nieuwe tool/technologie
Praktische demonstratie
Toegankelijke uitleg
Focus op concrete toepassingen
Voorbeelden: Minecraft AI tools, voice-over generators

Creative Lab

Video demonstraties van innovatieve AI concepten
Combineert bestaande AI tools op creatieve wijze
Visueel aantrekkelijk eindresultaat
Voorbeelden: pratende historische figuren, bewegende oude foto's
Moet minimaal 1 nieuwe AI tool showcasen

Nieuwsbrief

Tweewekelijkse round-up
3-4 belangrijke tech ontwikkelingen
Inclusief video versie
Focus op recente gebeurtenissen

Output format per relevant artikel:

Titel: [titel]
Relevantie: [welk format + concrete toepassing]
Key points: [max 3 bulletpoints]
Link: [indien beschikbaar]

Alleen artikelen vermelden die direct relevant zijn voor bovenstaande formats. Als een artikel niet relevant is plaats NIET RELEVANT in je antwoord

——— begin artikel ———
            Artikel titel: ${title}
            Content: ${content}
            url: ${url}
——— eind artikel ———
je mag best streng zijn en alleen artikelen vermelden die relevant zijn voor de bovenstaande formats en echt tof en interessant zijn.
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    "role": "user", 
                    "content": prompt 
                }
            ],
            temperature: 0.7,
        }).catch(error => {
            console.error('OpenAI API Error:', {
                error: error.message,
                title,
                type: error.type,
                stack: error.stack
            });
            throw error;
        });

        console.log('Classification completed:', {
            title,
            modelUsed: response.model,
            tokensUsed: response.usage,
            timestamp: new Date().toISOString()
        });

        return response.choices[0].message.content;

    } catch (error) {
        console.error('Classification error:', {
            error: error.message,
            title,
            url,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        throw error; // Gooi door zodat de aanroeper kan beslissen wat te doen
    }
}

module.exports = {
    classifyContent,
}; 