// Netlify Function - Validate Keywords via Claude API
// Path: netlify/functions/validate-keywords.js

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
       const body = JSON.parse(event.body);
        
        // Support both keyword validation AND cover letter generation
        if (body.prompt) {
            // Cover letter generation mode
            const prompt = body.prompt;
            const maxTokens = body.maxTokens || 800;
            
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: maxTokens,
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Claude API error:', response.status, errorText);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        coverLetter: null,
                        fallback: true,
                        error: `Claude API returned ${response.status}`
                    })
                };
            }
            
            const data = await response.json();
            const coverLetter = data.content[0].text.trim();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    coverLetter,
                    fallback: false
                })
            };
        }
        
        // Original keyword validation mode
        const { keywords, jdText } = body;
        
        if (!keywords || !jdText) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing keywords or jdText' })
            };
        }
        
        const keywordList = keywords.map(k => k.word).join(', ');
        
        const prompt = `Analizza questa job description e filtra solo le keyword TECNICHE, SPECIFICHE e RILEVANTI per il ruolo.

ESCLUDI assolutamente:
- Parole generiche HR (lavoro, offerta, posizione, candidato, azienda, team, etc)
- Aggettivi generici (dinamico, importante, ottimo, giovane, etc)
- Verbi generici (cerchiamo, offriamo, gestiamo, etc)
- Requisiti generici (esperienza, competenza, capacità, etc)

INCLUDI solo:
- Tool/software specifici (es: Power BI, Google Analytics, Figma, etc)
- Competenze tecniche specifiche (es: Media Planning, SEO, Agile, B2B Marketing, etc)
- Tecnologie/piattaforme (es: Meta Ads, Programmatic, AWS, etc)
- Industry terms specifici (es: Automotive, Robotics, Fashion, Pharma, etc)
- Acronimi tecnici (es: KPI, ROI, CPA, CPM, SaaS, etc)
- Hard skills rilevanti (es: Video Editing, Copywriting, Data Analysis, etc)

JD (primi 800 char):
${jdText.substring(0, 800)}...

Keywords estratte:
${keywordList}

Rispondi SOLO con lista keyword valide separate da virgola, NIENTE altro testo.`;

        // Call Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                messages: [{ 
                    role: 'user', 
                    content: prompt 
                }]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude API error:', response.status, errorText);
            
            // Return original keywords as fallback
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    validKeywords: keywords.map(k => k.word),
                    fallback: true,
                    error: `Claude API returned ${response.status}`
                })
            };
        }
        
        const data = await response.json();
        const validKeywordsText = data.content[0].text.trim();
        const validKeywords = validKeywordsText
            .split(',')
            .map(k => k.trim().toLowerCase())
            .filter(k => k.length > 0);
        
        console.log('Claude validated keywords:', validKeywords.length, 'out of', keywords.length);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                validKeywords,
                fallback: false,
                originalCount: keywords.length,
                validatedCount: validKeywords.length
            })
        };
        
    } catch (error) {
        console.error('Function error:', error);
        
        // Return original keywords as fallback
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                validKeywords: [],
                fallback: true,
                error: error.message
            })
        };
    }
};
