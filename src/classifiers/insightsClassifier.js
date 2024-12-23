const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function classifyContent(content, title, url) {
    try {
        console.log(`Classifying article: ${title}`);

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

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    "role": "user", 
                    "content": prompt 
                }
            ],
            temperature: 0.7,
        });

        console.log(`Classification completed for: ${title}`);
        return completion.choices[0].message.content.trim();

    } catch (error) {
        console.error('Error classifying content:', error);
        return "NIET RELEVANT - Error tijdens classificatie";
    }
}

module.exports = {
    classifyContent,
}; 