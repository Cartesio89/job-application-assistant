// Netlify Function - Validate Keywords via Claude API
// Path: netlify/functions/validate-keywords.js

// Il codice precedente usava 'claude-sonnet-4-20250514' (modello datato
// maggio 2025). Non ho potuto verificare EMPIRICAMENTE in questa sessione
// se quello specifico model ID sia stato dismesso da Anthropic (nessun
// accesso diretto alle API Anthropic da questo sandbox) - è un'ipotesi
// plausibile come causa di eventuali errori 4xx osservati, non una
// certezza. Il valore sotto è configurabile via env var così che un
// cambio di modello futuro non richieda un redeploy del codice.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

// Netlify (funzioni normali, non "background") termina l'esecuzione dopo
// ~10s sul piano gratuito. Una generazione da 800 token può avvicinarsi o
// superare quel limite: senza timeout interno, Netlify uccide la funzione
// e il frontend vede un errore di rete generico invece di un fallback
// pulito. Qui abortiamo prima (9s) e rispondiamo con fallback:true,
// così app.js può usare il template locale invece di sembrare rotto.
const FUNCTION_TIMEOUT_MS = 9000;

async function callClaude(prompt, maxTokens) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FUNCTION_TIMEOUT_MS);
    try {
        return await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: maxTokens,
                messages: [{ role: 'user', content: prompt }]
            })
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

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

            let response;
            try {
                response = await callClaude(prompt, maxTokens);
            } catch (fetchError) {
                const isTimeout = fetchError.name === 'AbortError';
                console.error('Claude API request failed:', fetchError.message);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        coverLetter: null,
                        fallback: true,
                        error: isTimeout ? 'Claude API timeout (>9s)' : fetchError.message
                    })
                };
            }

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

            // Difensivo (aggiunto 2026-09-25): un test empirico ha dato
            // "Cannot read properties of undefined (reading 'trim')" qui,
            // cioe' data.content[0].text non era una stringa come atteso.
            // Non so ancora il perche' (stop_reason anomalo? content block
            // di tipo diverso? risposta troncata?) - invece di continuare
            // a ipotizzare, se la struttura non torna come prevista
            // restituiamo un estratto della risposta grezza di Claude cosi'
            // il prossimo test mostra il dato reale invece di un errore
            // generico senza contesto.
            const textBlock = data.content && data.content[0];
            if (!textBlock || typeof textBlock.text !== 'string') {
                console.error('Unexpected Claude response shape:', JSON.stringify(data).slice(0, 1000));
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        coverLetter: null,
                        fallback: true,
                        error: 'Unexpected Claude response shape',
                        stopReason: data.stop_reason || null,
                        rawContentPreview: JSON.stringify(data.content || data).slice(0, 500)
                    })
                };
            }

            const coverLetter = textBlock.text.trim();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    coverLetter,
                    fallback: false,
                    stopReason: data.stop_reason || null
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
        let response;
        try {
            response = await callClaude(prompt, 500);
        } catch (fetchError) {
            const isTimeout = fetchError.name === 'AbortError';
            console.error('Claude API request failed:', fetchError.message);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    validKeywords: keywords.map(k => k.word),
                    fallback: true,
                    error: isTimeout ? 'Claude API timeout (>9s)' : fetchError.message
                })
            };
        }

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
