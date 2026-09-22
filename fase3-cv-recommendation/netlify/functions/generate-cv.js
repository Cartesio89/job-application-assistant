// Netlify Function - Genera una versione "su misura" di uno dei 20 CV
// preimpostati (Passaggio 1). Chiamata SOLO quando il motore di
// raccomandazione lato client (recommendCV in app.js, Passaggio 3) segnala
// bassa confidenza, o su richiesta esplicita dell'utente - mai come step
// automatico ad ogni generazione.
//
// Cosa fa, in ordine:
// 1. Legge {templateId, jdText, company, role} dal body.
// 2. Recupera cv-templates/manifest.json e il .docx corrispondente,
//    entrambi serviti staticamente dallo stesso sito (fetch same-origin,
//    nessun asset bundlato nella function: evita la fragilita' di
//    "included_files" con l'esbuild bundler, che non ho potuto verificare
//    empiricamente da questo ambiente).
// 3. Chiede a Claude di riscrivere SOLO il paragrafo "Profilo Professionale"
//    (quello a indice manifest.profileParagraphIndex, di norma 4) su misura
//    per la JD, mantenendo lingua e registro del preimpostato.
// 4. Inietta il nuovo testo nel .docx con un editing per INDICE di
//    paragrafo (non find&replace testuale): alcuni dei 20 file hanno quel
//    paragrafo diviso su piu' run (verificato empiricamente su uno dei 20
//    file caricati dall'utente - tipico artefatto di spell-check/autocorrect
//    di Word), quindi un find&replace su stringa fallirebbe silenziosamente
//    su quei file.
// 5. Ritorna il .docx risultante in base64. Se la generazione AI fallisce o
//    e' inutilizzabile, ritorna comunque il .docx originale (paragrafo
//    invariato) con fallback:true, MAI un errore secco: l'utente ottiene
//    sempre un file scaricabile.
//
// Dipendenze npm richieste (jszip, @xmldom/xmldom): il repo non ha
// attualmente un package.json (verificato: 404 su GitHub) - va aggiunto,
// altrimenti l'esbuild bundler di Netlify non trova questi pacchetti in
// fase di build. Vedi package.json fornito insieme a questo file.

const JSZip = require('jszip');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const FUNCTION_TIMEOUT_MS = 9000;

function getSiteOrigin(event) {
    const host = event.headers && (event.headers.host || event.headers.Host);
    if (!host) return 'https://job-application-assistant-v2.netlify.app';
    const proto = (event.headers['x-forwarded-proto'] || 'https');
    return `${proto}://${host}`;
}

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

function buildPrompt(entry, jdText, company, role) {
    const languageName = entry.language === 'it' ? 'ITALIANO' : 'INGLESE';
    return `Sei un consulente di carriera. Riscrivi SOLO il paragrafo "Profilo Professionale" di un CV, su misura per questo annuncio.

PARAGRAFO ORIGINALE (da usare come base per fatti/tono, non da copiare):
${entry.profileParagraph}

RUOLO NEL CV: ${entry.tagline}

ANNUNCIO (azienda: ${company || 'non specificata'}, ruolo: ${role || 'non specificato'}):
${jdText.substring(0, 2000)}

REGOLE:
1. Scrivi in ${languageName}, stesso registro professionale dell'originale.
2. Lunghezza simile all'originale (${entry.profileParagraph.split(/\s+/).length} parole circa, tolleranza +-20%).
3. Riprendi SOLO fatti gia' presenti nel paragrafo originale (esperienza, brand, settori, strumenti) - non inventare competenze non presenti nell'originale.
4. Enfatizza i punti del paragrafo originale piu' rilevanti per questo annuncio specifico.
5. Nessun markdown, nessuna virgoletta introduttiva, SOLO il testo del paragrafo.`;
}

async function replaceParagraphText(docxBuffer, paragraphIndex, newText) {
    const zip = await JSZip.loadAsync(docxBuffer);
    const xmlStr = await zip.file('word/document.xml').async('string');

    const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');
    const body = doc.getElementsByTagNameNS(W_NS, 'body')[0];
    if (!body) throw new Error('word:body non trovato nel documento');

    const paragraphs = [];
    for (let i = 0; i < body.childNodes.length; i++) {
        const node = body.childNodes[i];
        if (node.nodeType === 1 && node.localName === 'p' && node.namespaceURI === W_NS) {
            paragraphs.push(node);
        }
    }
    if (paragraphIndex >= paragraphs.length) {
        throw new Error(`Paragrafo ${paragraphIndex} non esiste (${paragraphs.length} totali)`);
    }
    const targetP = paragraphs[paragraphIndex];

    const runs = [];
    for (let i = 0; i < targetP.childNodes.length; i++) {
        const node = targetP.childNodes[i];
        if (node.nodeType === 1 && node.localName === 'r' && node.namespaceURI === W_NS) {
            runs.push(node);
        }
    }
    if (runs.length === 0) throw new Error(`Nessun run nel paragrafo ${paragraphIndex}`);

    let rPr = null;
    for (let i = 0; i < runs[0].childNodes.length; i++) {
        const node = runs[0].childNodes[i];
        if (node.nodeType === 1 && node.localName === 'rPr' && node.namespaceURI === W_NS) {
            rPr = node;
            break;
        }
    }

    for (const r of runs) targetP.removeChild(r);

    const newRun = doc.createElementNS(W_NS, 'w:r');
    if (rPr) newRun.appendChild(rPr.cloneNode(true));
    const newT = doc.createElementNS(W_NS, 'w:t');
    newT.setAttribute('xml:space', 'preserve');
    newT.appendChild(doc.createTextNode(newText));
    newRun.appendChild(newT);
    targetP.appendChild(newRun);

    const newXml = new XMLSerializer().serializeToString(doc);
    zip.file('word/document.xml', newXml);
    return zip.generateAsync({ type: 'nodebuffer' });
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON non valido' }) };
    }

    const { templateId, jdText, company, role } = body;
    if (!templateId || !jdText) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'templateId e jdText sono obbligatori' }) };
    }

    const origin = getSiteOrigin(event);

    try {
        const manifestRes = await fetch(`${origin}/cv-templates/manifest.json`);
        if (!manifestRes.ok) {
            throw new Error(`manifest.json non raggiungibile (HTTP ${manifestRes.status})`);
        }
        const manifest = await manifestRes.json();
        const entry = manifest.find(e => e.id === templateId);
        if (!entry) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: `Template '${templateId}' non trovato` }) };
        }

        const docxRes = await fetch(`${origin}/cv-templates/${entry.filename}`);
        if (!docxRes.ok) {
            throw new Error(`${entry.filename} non raggiungibile (HTTP ${docxRes.status})`);
        }
        const docxBuffer = Buffer.from(await docxRes.arrayBuffer());

        // Prova a generare il profilo su misura via Claude. Se fallisce in
        // QUALSIASI modo (timeout, errore API, risposta vuota/troppo corta),
        // si prosegue comunque con il testo originale: l'utente riceve
        // sempre un .docx valido, al massimo identico al preimpostato.
        let tailoredProfile = null;
        let aiFallback = true;
        try {
            const prompt = buildPrompt(entry, jdText, company, role);
            const claudeRes = await callClaude(prompt, 400);
            if (claudeRes.ok) {
                const data = await claudeRes.json();
                const text = data.content[0].text.trim();
                if (text.length > 40) {
                    tailoredProfile = text;
                    aiFallback = false;
                }
            } else {
                console.error('Claude API error:', claudeRes.status, await claudeRes.text());
            }
        } catch (aiError) {
            console.error('AI profile generation failed:', aiError.message);
        }

        const finalProfile = tailoredProfile || entry.profileParagraph;
        const outBuffer = await replaceParagraphText(docxBuffer, entry.profileParagraphIndex, finalProfile);

        const safeCompany = (company || 'azienda').replace(/[^a-z0-9]+/gi, '_').slice(0, 30);
        const filename = `CV_Martino_Cicerani_${entry.orientation}_${safeCompany}.docx`;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                docxBase64: outBuffer.toString('base64'),
                filename,
                fallback: aiFallback,
                templateUsed: entry.id
            })
        };
    } catch (error) {
        console.error('generate-cv error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
