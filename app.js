// Job Application System V2 - With Generic CV Analysis
// Includes PDF parsing capability

// ============================================
// MARTINO'S PROFILE (Hardcoded from CV)
// ============================================
const martinoProfile = {
    name: "Martino Cicerani",
    email: "martino.cicerani@gmail.com",
    phone: "+39 329 1908536",
    currentRole: "Digital Consultant",
    company: "UM Italia",
    yearsExp: 8,
    coreSkills: [
        "Digital Strategy", "Media Planning", "Budget Management",
        "Performance Analysis", "Data Analysis", "Campaign Optimization",
        "Meta Ads", "Google Ads", "TikTok", "Programmatic",
        "Google Analytics 4", "Looker Studio", "Power BI",
        "AI for Marketing", "Prompt Engineering", "Team Management"
    ],
    brandsManaged: ["Honda", "Levi's", "Acuvue", "Ceres"],
    aiCertifications: [
        "AI for Marketing (Fastweb Digital Academy)",
        "Prompt Engineering", "Claude", "NotebookLM", "Midjourney"
    ]
};

// Global variables for CV upload
let uploadedCVText = '';
let uploadedFileName = '';

// ============================================
// TAB SWITCHING
// ============================================
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
}

// ============================================
// COMMON FUNCTIONS
// ============================================
const stopwords = new Set([
    'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
    'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'uno',
    'e', 'o', 'ma', 'se', 'che', 'chi', 'cui',
    'the', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'at', 'with'
]);

function extractKeywords(jdText, topN = 20) {
    const words = jdText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const filtered = words.filter(w => !stopwords.has(w));
    
    const freq = {};
    filtered.forEach(word => {
        freq[word] = (freq[word] || 0) + 1;
    });
    
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([word, count]) => ({ word, count }));
}

function extractRequirements(jdText) {
    const jdLower = jdText.toLowerCase();
    const requirements = {
        tools: [],
        experienceYears: null,
        softSkills: []
    };
    
    const toolPatterns = [
        /adobe creative suite|photoshop|illustrator|premiere|after effects|indesign/g,
        /excel|powerpoint|power bi|looker studio|google analytics|tableau/g,
        /meta|facebook|instagram|tiktok|linkedin|youtube/g,
        /jira|trello|asana|monday/g,
        /canva|figma|sketch/g
    ];
    
    toolPatterns.forEach(pattern => {
        const matches = jdLower.match(pattern) || [];
        requirements.tools.push(...matches);
    });
    
    requirements.tools = [...new Set(requirements.tools)];
    
    const expMatch = jdLower.match(/(\d+)[\s-]+(anni?|years?)/);
    if (expMatch) {
        requirements.experienceYears = parseInt(expMatch[1]);
    }
    
    const softSkillsKw = [
        'team', 'comunicazione', 'problem solving', 'autonomia',
        'creatività', 'organizzazione', 'flessibilità', 'leadership'
    ];
    
    softSkillsKw.forEach(skill => {
        if (jdLower.includes(skill)) {
            requirements.softSkills.push(skill);
        }
    });
    
    return requirements;
}

function calculateATSScore(documentText, jdKeywords) {
    const docLower = documentText.toLowerCase();
    
    const matches = [];
    const missing = [];
    
    jdKeywords.forEach(kw => {
        if (docLower.includes(kw.word)) {
            matches.push(kw.word);
        } else {
            missing.push(kw.word);
        }
    });
    
    const score = jdKeywords.length > 0 
        ? Math.round((matches.length / jdKeywords.length) * 100) 
        : 0;
    
    return {
        score,
        matches,
        missing,
        totalKeywords: jdKeywords.length,
        matchedKeywords: matches.length
    };
}

function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('✓ Copiato negli appunti!');
    });
}

// ============================================
// MARTINO'S SECTION - Full Document Generation
// ============================================

function generateCoverLetterMartino(jdText, company, role, location) {
    const reqs = extractRequirements(jdText);
    const jdLower = jdText.toLowerCase();
    
    const isCreative = /creative|grafica|design|video|contenuti/.test(jdLower);
    const isProduct = /product|prodotto|roadmap|sviluppo/.test(jdLower);
    
    let letter = `Oggetto: Candidatura per ${role} – ${location}

Gentile Team Selezione ${company},

desidero candidarmi per la posizione di ${role}. Con oltre ${martinoProfile.yearsExp} anni di esperienza in digital marketing e gestione di campagne per brand internazionali, ritengo di poter portare un contributo concreto al vostro team.`;
    
    if (isCreative) {
        letter += `\n\nNel mio ruolo attuale di ${martinoProfile.currentRole} presso ${martinoProfile.company}, ho sviluppato competenze nella creazione e ottimizzazione di contenuti digitali multi-canale, collaborando costantemente con team creativi per sviluppare asset pubblicitari performanti. Ho esperienza nella gestione di progetti che integrano storytelling visivo, video content e design strategico.`;
    } else if (isProduct) {
        letter += `\n\nNel mio ruolo attuale di ${martinoProfile.currentRole} presso ${martinoProfile.company}, mi occupo della definizione di strategie digitali annuali e del lancio di nuovi prodotti per clienti automotive, fashion e medical device. Ho esperienza diretta nell'analisi dei trend di mercato, nella valutazione di fornitori e soluzioni tecnologiche, e nella collaborazione con team cross-funzionali (IT, Legal, Marketing) per portare prodotti digitali sul mercato.`;
    } else {
        const tools = reqs.tools.slice(0, 3).join(', ') || 'Google Analytics 4, Power BI e Looker Studio';
        letter += `\n\nNel mio ruolo attuale di ${martinoProfile.currentRole} presso ${martinoProfile.company}, gestisco strategie di advertising per brand come ${martinoProfile.brandsManaged.slice(0, 3).join(', ')}, con focus su ottimizzazione delle performance e analisi data-driven. Ho esperienza nella gestione di budget multi-canale, nel monitoraggio di KPI attraverso strumenti come ${tools}, e nell'implementazione di strategie di testing per massimizzare il ROI.`;
    }
    
    if (reqs.tools.length > 0) {
        letter += `\n\nHo solida padronanza di ${reqs.tools.slice(0, 4).join(', ')} per analisi e reportistica. La mia esperienza con clienti internazionali mi ha permesso di sviluppare eccellenti competenze in inglese e capacità di coordinamento con stakeholder globali.`;
    }
    
    letter += `\n\nUn aspetto che mi differenzia è l'integrazione di competenze in AI applicata al marketing, certificate attraverso corsi specializzati della Fastweb Digital Academy (${martinoProfile.aiCertifications.slice(0, 3).join(', ')}). Ho utilizzato queste competenze per sviluppare progetti personali che includono web development, strumenti di automazione e gestione data-driven di un property Airbnb, ottenendo risultati misurabili in termini di engagement e conversioni.`;
    
    letter += `\n\nSono motivato dalla possibilità di contribuire agli obiettivi di ${company} e mettere a disposizione un approccio analitico, orientato ai risultati e in continua evoluzione rispetto alle nuove tecnologie digitali.\n\nResto a disposizione per un colloquio conoscitivo.\n\nCordiali saluti,\n\n${martinoProfile.name}\n${martinoProfile.email} | ${martinoProfile.phone}`;
    
    return letter;
}

function generateCVAboutSectionMartino(jdText) {
    const reqs = extractRequirements(jdText);
    const jdLower = jdText.toLowerCase();
    
    const focusAreas = [];
    if (/performance|roi|kpi/.test(jdLower)) focusAreas.push("performance analysis");
    if (/strategy|strategic/.test(jdLower)) focusAreas.push("strategic planning");
    if (/product/.test(jdLower)) focusAreas.push("product management");
    if (/creative|content/.test(jdLower)) focusAreas.push("content creation");
    if (/data|analytics/.test(jdLower)) focusAreas.push("data analysis");
    
    if (focusAreas.length === 0) {
        focusAreas.push("digital strategy", "campaign optimization");
    }
    
    let about = `Digital Media Planner with over ${martinoProfile.yearsExp} years of experience in ${focusAreas.slice(0, 2).join(' and ')} for international brands. `;
    
    if (reqs.tools.length > 0) {
        about += `Proficient in ${reqs.tools.slice(0, 4).join(', ')}, `;
    }
    
    about += `specialized in optimizing omnichannel strategies and leveraging data-driven insights to improve marketing performance. `;
    
    if (/ai|artificial intelligence|automation/.test(jdLower)) {
        about += "Certified in AI-driven marketing with hands-on experience in implementing AI tools for campaign optimization and automation. ";
    }
    
    if (/manager|specialist|lead/.test(jdLower)) {
        const targetRole = /product/.test(jdLower) ? 'product management' : 'strategic marketing roles';
        about += `Currently seeking opportunities in ${targetRole} to leverage analytical skills and drive business growth.`;
    }
    
    return about.trim();
}

function generateSuggestionsMartino(jdText) {
    const suggestions = [];
    const jdLower = jdText.toLowerCase();
    const reqs = extractRequirements(jdText);
    
    if (/budget|costi/.test(jdLower)) {
        suggestions.push("📊 Evidenzia esperienza in budget management e negoziazione con fornitori nella sezione Work Experience");
    }
    
    if (/team|coordinamento/.test(jdLower)) {
        suggestions.push("👥 Sottolinea la gestione di team e coordinamento stakeholder cross-funzionali");
    }
    
    if (/international|globale/.test(jdLower)) {
        suggestions.push("🌍 Metti in risalto l'esperienza con clienti internazionali (Honda, Levi's, Acuvue)");
    }
    
    if (reqs.experienceYears && reqs.experienceYears <= 3) {
        suggestions.push("⚡ Il ruolo richiede meno esperienza: puoi enfatizzare progetti side e certificazioni recenti");
    }
    
    if (/product/.test(jdLower)) {
        suggestions.push("🎯 Aggiungi bullet point su lancio prodotti e roadmap nella sezione UM Italia");
    }
    
    if (/creative|contenuti/.test(jdLower)) {
        suggestions.push("🎨 Evidenzia collaborazione con team creativi e sviluppo asset performanti");
    }
    
    const missingTools = ['excel', 'powerpoint', 'power bi', 'google analytics', 'jira']
        .filter(tool => jdLower.includes(tool) && 
                       !martinoProfile.coreSkills.some(skill => skill.toLowerCase().includes(tool)));
    
    if (missingTools.length > 0) {
        suggestions.push(`⚠️ Keyword mancanti importanti: ${missingTools.join(', ')} - valuta se hai esperienza anche indiretta da menzionare`);
    }
    
    return suggestions;
}

function generateDocumentsMartino() {
    const company = document.getElementById('company').value.trim();
    const role = document.getElementById('role').value.trim();
    const location = document.getElementById('location').value.trim() || 'Roma';
    const jd = document.getElementById('jd').value.trim();
    
    if (!company || !role || !jd) {
        alert('Per favore compila tutti i campi obbligatori (*)');
        return;
    }
    
    document.getElementById('loading-martino').classList.add('show');
    document.getElementById('results-martino').classList.remove('show');
    
    setTimeout(() => {
        const keywords = extractKeywords(jd, 15);
        const coverLetter = generateCoverLetterMartino(jd, company, role, location);
        const aboutMe = generateCVAboutSectionMartino(jd);
        const suggestions = generateSuggestionsMartino(jd);
        const atsScore = calculateATSScore(coverLetter + ' ' + aboutMe, keywords);
        
        displayResultsMartino(atsScore, coverLetter, aboutMe, suggestions, company, role);
        
        document.getElementById('loading-martino').classList.remove('show');
        document.getElementById('results-martino').classList.add('show');
        document.getElementById('results-martino').scrollIntoView({ behavior: 'smooth' });
    }, 1000);
}

function displayResultsMartino(atsScore, coverLetter, aboutMe, suggestions, company, role) {
    let interpretation = '';
    if (atsScore.score >= 70) {
        interpretation = '✅ Ottimo match! Alta probabilità di passare i filtri ATS';
    } else if (atsScore.score >= 50) {
        interpretation = '⚠️ Buon match, ma considera di aggiungere alcune keyword mancanti';
    } else {
        interpretation = '❌ Match basso. Valuta attentamente se candidarti o rivedi i documenti';
    }
    
    const resultsHTML = `
        <div class="card">
            <div class="score-display">
                <div class="score-number">${atsScore.score}%</div>
                <div class="score-label">ATS Match Score</div>
                <div class="score-interpretation">${interpretation}</div>
            </div>
            
            <div class="keyword-section">
                <h3>✅ Keyword Matchate (${atsScore.matchedKeywords})</h3>
                <div class="keyword-tags">
                    ${atsScore.matches.map(kw => `<span class="keyword-tag matched">${kw}</span>`).join('')}
                </div>
            </div>
            
            <div class="keyword-section">
                <h3>⚠️ Keyword Mancanti (${atsScore.missing.length})</h3>
                <div class="keyword-tags">
                    ${atsScore.missing.slice(0, 10).map(kw => `<span class="keyword-tag missing">${kw}</span>`).join('')}
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="document-output">
                <h3>📄 Cover Letter Generata</h3>
                <pre id="coverLetterOutput">${coverLetter}</pre>
                <div class="download-section">
                    <button class="copy-btn" onclick="copyToClipboard('coverLetterOutput')">📋 Copia Testo</button>
                    <button class="download-btn" onclick="downloadAsWord('${company}', '${role}', 'coverLetter')">📥 Download DOCX</button>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="document-output">
                <h3>👤 Paragrafo "About Me" CV</h3>
                <pre id="aboutMeOutput">${aboutMe}</pre>
                <button class="copy-btn" onclick="copyToClipboard('aboutMeOutput')">📋 Copia Testo</button>
            </div>
        </div>
        
        <div class="card">
            <h3>💡 Suggerimenti per il CV</h3>
            <ul class="suggestions-list">
                ${suggestions.map(sug => `<li>${sug}</li>`).join('')}
            </ul>
        </div>
    `;
    
    document.getElementById('results-martino').innerHTML = resultsHTML;
    
    window.currentCoverLetter = coverLetter;
    window.currentAboutMe = aboutMe;
    window.currentCompany = company;
    window.currentRole = role;
}

// ============================================
// GENERIC CV SECTION - Analysis Only
// ============================================

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert('File troppo grande! Max 5MB');
        return;
    }
    
    uploadedFileName = file.name;
    
    document.getElementById('uploadedFileInfo').innerHTML = `
        <div class="uploaded-file">
            <span>📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
            <button class="remove-btn" onclick="removeFile()">✕ Rimuovi</button>
        </div>
    `;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        if (file.type === 'application/pdf') {
            parsePDF(e.target.result);
        } else {
            // For DOC/DOCX, we'll extract what we can as plain text
            uploadedCVText = e.target.result;
            showCVPreview(uploadedCVText);
        }
    };
    
    if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
    
    document.getElementById('analyzeBtn').disabled = false;
}

async function parsePDF(arrayBuffer) {
    try {
        // Simple PDF text extraction (works for text-based PDFs)
        const text = await extractTextFromPDF(arrayBuffer);
        uploadedCVText = text;
        showCVPreview(text);
    } catch (error) {
        alert('Errore nel parsing del PDF. Prova con un file DOCX o copia/incolla il contenuto.');
        console.error(error);
    }
}

// Simplified PDF text extraction (basic implementation)
async function extractTextFromPDF(arrayBuffer) {
    // Convert ArrayBuffer to string for basic text extraction
    const uint8Array = new Uint8Array(arrayBuffer);
    let text = '';
    
    // Basic PDF text extraction (limited, works only for simple PDFs)
    for (let i = 0; i < uint8Array.length; i++) {
        if (uint8Array[i] >= 32 && uint8Array[i] <= 126) {
            text += String.fromCharCode(uint8Array[i]);
        } else if (uint8Array[i] === 10 || uint8Array[i] === 13) {
            text += '\n';
        }
    }
    
    // Clean up the text
    text = text.replace(/[^\x20-\x7E\n]/g, ' ');
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\n\s+/g, '\n');
    
    return text.trim();
}

function showCVPreview(text) {
    const preview = text.substring(0, 1000) + (text.length > 1000 ? '...' : '');
    document.getElementById('cvPreview').innerHTML = `
        <div class="cv-preview">
            <h3>📄 Preview CV Estratto (primi 1000 caratteri)</h3>
            <pre>${preview}</pre>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
                <strong>Verifica che il testo sia corretto.</strong> 
                Il parsing automatico potrebbe non essere perfetto per CV con layout complessi.
            </p>
        </div>
    `;
}

function removeFile() {
    uploadedCVText = '';
    uploadedFileName = '';
    document.getElementById('cvFile').value = '';
    document.getElementById('uploadedFileInfo').innerHTML = '';
    document.getElementById('cvPreview').innerHTML = '';
    document.getElementById('analyzeBtn').disabled = true;
}

function analyzeGenericCV() {
    const company = document.getElementById('company-gen').value.trim();
    const role = document.getElementById('role-gen').value.trim();
    const location = document.getElementById('location-gen').value.trim() || 'Roma';
    const jd = document.getElementById('jd-gen').value.trim();
    
    if (!uploadedCVText) {
        alert('Per favore carica un CV prima di analizzare');
        return;
    }
    
    if (!company || !role || !jd) {
        alert('Per favore compila tutti i campi obbligatori (*)');
        return;
    }
    
    document.getElementById('loading-generic').classList.add('show');
    document.getElementById('results-generic').classList.remove('show');
    
    setTimeout(() => {
        const analysis = performCVAnalysis(uploadedCVText, jd, company, role, location);
        displayGenericResults(analysis);
        
        document.getElementById('loading-generic').classList.remove('show');
        document.getElementById('results-generic').classList.add('show');
        document.getElementById('results-generic').scrollIntoView({ behavior: 'smooth' });
    }, 1500);
}

function performCVAnalysis(cvText, jdText, company, role, location) {
    const keywords = extractKeywords(jdText, 20);
    const reqs = extractRequirements(jdText);
    const atsScore = calculateATSScore(cvText, keywords);
    
    // Extract basic info from CV
    const cvInfo = extractCVInfo(cvText);
    
    // Generate suggestions
    const suggestions = generateGenericSuggestions(cvText, jdText, reqs, atsScore);
    
    // Generate draft About Me
    const draftAboutMe = generateDraftAboutMe(cvInfo, jdText, reqs);
    
    // Gap analysis
    const gaps = identifyGaps(cvText, jdText, reqs);
    
    return {
        cvInfo,
        atsScore,
        keywords,
        suggestions,
        draftAboutMe,
        gaps,
        reqs
    };
}

function extractCVInfo(cvText) {
    const cvLower = cvText.toLowerCase();
    
    // Try to extract basic info
    const emailMatch = cvText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = cvText.match(/[\d\s\+\-\(\)]{10,}/);
    
    // Extract years of experience (rough estimate)
    const yearMatches = cvText.match(/\b(19|20)\d{2}\b/g);
    let yearsExp = 0;
    if (yearMatches && yearMatches.length >= 2) {
        const years = yearMatches.map(y => parseInt(y)).sort();
        const firstYear = years[0];
        const currentYear = new Date().getFullYear();
        yearsExp = currentYear - firstYear;
        if (yearsExp > 50) yearsExp = 0; // Sanity check
    }
    
    // Extract skills mentioned
    const commonSkills = ['excel', 'powerpoint', 'google analytics', 'meta', 'facebook', 
                         'instagram', 'tiktok', 'jira', 'python', 'javascript', 'html', 
                         'css', 'sql', 'tableau', 'power bi'];
    const foundSkills = commonSkills.filter(skill => cvLower.includes(skill));
    
    return {
        email: emailMatch ? emailMatch[0] : 'Non rilevata',
        phone: phoneMatch ? phoneMatch[0].trim() : 'Non rilevato',
        yearsExp: yearsExp || 'Non rilevato',
        skills: foundSkills
    };
}

function generateGenericSuggestions(cvText, jdText, reqs, atsScore) {
    const suggestions = [];
    const cvLower = cvText.toLowerCase();
    const jdLower = jdText.toLowerCase();
    
    // Suggest highlighting relevant experience
    if (/manager|management/.test(jdLower) && /manager|gestione/.test(cvLower)) {
        suggestions.push("✅ Hai esperienza di management nel CV - evidenziala maggiormente nella sezione esperienza");
    }
    
    // Suggest adding missing keywords
    if (atsScore.missing.length > 5) {
        suggestions.push(`⚠️ Mancano ${atsScore.missing.length} keyword importanti. Considera di aggiungere: ${atsScore.missing.slice(0, 5).join(', ')}`);
    }
    
    // Tool-specific suggestions
    reqs.tools.forEach(tool => {
        if (!cvLower.includes(tool)) {
            suggestions.push(`🔧 Aggiungi "${tool}" alle competenze se hai esperienza (anche indiretta)`);
        }
    });
    
    // Experience level check
    if (reqs.experienceYears) {
        suggestions.push(`📅 La posizione richiede ${reqs.experienceYears} anni di esperienza. Assicurati che sia chiaro nel CV`);
    }
    
    // Generic advice
    if (/product|prodotto/.test(jdLower)) {
        suggestions.push("🎯 Enfatizza progetti dove hai contribuito allo sviluppo/lancio di prodotti o servizi");
    }
    
    if (/data|analytics|performance/.test(jdLower)) {
        suggestions.push("📊 Metti in evidenza competenze di analisi dati e ottimizzazione performance");
    }
    
    if (/team|collaboration|cross-functional/.test(jdLower)) {
        suggestions.push("👥 Sottolinea esperienze di lavoro in team e collaborazione cross-funzionale");
    }
    
    return suggestions;
}

function generateDraftAboutMe(cvInfo, jdText, reqs) {
    const jdLower = jdText.toLowerCase();
    
    let focusAreas = [];
    if (/marketing|campaign/.test(jdLower)) focusAreas.push("marketing");
    if (/product/.test(jdLower)) focusAreas.push("product management");
    if (/data|analytics/.test(jdLower)) focusAreas.push("data analysis");
    if (/strategy|strategic/.test(jdLower)) focusAreas.push("strategic planning");
    
    if (focusAreas.length === 0) focusAreas = ["professional"];
    
    const yearsText = cvInfo.yearsExp && cvInfo.yearsExp !== 'Non rilevato' 
        ? `${cvInfo.yearsExp}+ years` 
        : 'several years';
    
    let draft = `Professional with ${yearsText} of experience in ${focusAreas.join(' and ')}. `;
    
    if (cvInfo.skills.length > 0) {
        draft += `Skilled in ${cvInfo.skills.slice(0, 4).join(', ')}. `;
    }
    
    if (reqs.tools.length > 0) {
        draft += `Experience with ${reqs.tools.slice(0, 3).join(', ')} for project management and analysis. `;
    }
    
    draft += `Strong analytical skills with a focus on data-driven decision making and results optimization.`;
    
    draft += `\n\n[NOTA: Questa è una bozza generica. Personalizzala con:
- Il tuo ruolo/titolo specifico
- Nomi di aziende/brand gestiti
- Risultati quantificabili (%, numeri, metriche)
- Specializzazioni uniche]`;
    
    return draft;
}

function identifyGaps(cvText, jdText, reqs) {
    const cvLower = cvText.toLowerCase();
    const jdLower = jdText.toLowerCase();
    
    const gaps = {
        critical: [],
        important: [],
        nice: []
    };
    
    // Check for critical skills
    reqs.tools.forEach(tool => {
        if (!cvLower.includes(tool)) {
            if (/jira|excel|powerpoint/.test(tool)) {
                gaps.critical.push(tool);
            } else {
                gaps.important.push(tool);
            }
        }
    });
    
    // Check for keywords
    const criticalKeywords = ['team', 'budget', 'strategy', 'analysis'];
    criticalKeywords.forEach(kw => {
        if (jdLower.includes(kw) && !cvLower.includes(kw)) {
            gaps.important.push(kw);
        }
    });
    
    return gaps;
}

function displayGenericResults(analysis) {
    let interpretation = '';
    if (analysis.atsScore.score >= 70) {
        interpretation = '✅ Ottimo match! Il CV è ben allineato con la JD';
    } else if (analysis.atsScore.score >= 50) {
        interpretation = '⚠️ Match moderato. Ci sono aree di miglioramento';
    } else {
        interpretation = '❌ Match basso. Serve ottimizzazione significativa del CV';
    }
    
    const resultsHTML = `
        <div class="card">
            <div class="info-badge">
                <strong>ℹ️ Analisi Automatica</strong>
                Questi sono suggerimenti generati automaticamente. Verifica e adatta al tuo caso specifico.
            </div>
            
            <h2 style="margin-bottom: 20px;">📊 Risultati Analisi CV</h2>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="font-size: 1em; margin-bottom: 10px;">📄 Info Estratte dal CV:</h3>
                <p style="font-size: 13px; line-height: 1.6; margin: 0;">
                    <strong>Email:</strong> ${analysis.cvInfo.email}<br>
                    <strong>Telefono:</strong> ${analysis.cvInfo.phone}<br>
                    <strong>Anni Esperienza (stimati):</strong> ${analysis.cvInfo.yearsExp}<br>
                    <strong>Skills Rilevate:</strong> ${analysis.cvInfo.skills.length > 0 ? analysis.cvInfo.skills.join(', ') : 'Nessuna rilevata automaticamente'}
                </p>
            </div>
        </div>
        
        <div class="card">
            <div class="score-display">
                <div class="score-number">${analysis.atsScore.score}%</div>
                <div class="score-label">ATS Match Score</div>
                <div class="score-interpretation">${interpretation}</div>
            </div>
            
            <div class="keyword-section">
                <h3>✅ Keyword Presenti nel CV (${analysis.atsScore.matchedKeywords})</h3>
                <div class="keyword-tags">
                    ${analysis.atsScore.matches.map(kw => `<span class="keyword-tag matched">${kw}</span>`).join('')}
                </div>
            </div>
            
            <div class="keyword-section">
                <h3>⚠️ Keyword Mancanti (${analysis.atsScore.missing.length})</h3>
                <div class="keyword-tags">
                    ${analysis.atsScore.missing.slice(0, 10).map(kw => `<span class="keyword-tag missing">${kw}</span>`).join('')}
                </div>
            </div>
        </div>
        
        ${analysis.gaps.critical.length > 0 ? `
        <div class="card">
            <h3 style="color: #d32f2f;">🚨 GAP CRITICI</h3>
            <p style="font-size: 13px; margin: 10px 0;">Queste competenze sono richieste nella JD ma non appaiono nel CV:</p>
            <div class="keyword-tags">
                ${analysis.gaps.critical.map(gap => `<span class="keyword-tag missing">${gap}</span>`).join('')}
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
                <strong>Azione:</strong> Se hai esperienza con questi tool, aggiungili esplicitamente al CV.
            </p>
        </div>
        ` : ''}
        
        <div class="card">
            <h3>💡 Suggerimenti Personalizzati</h3>
            <ul class="suggestions-list">
                ${analysis.suggestions.map(sug => `<li>${sug}</li>`).join('')}
            </ul>
        </div>
        
        <div class="card">
            <div class="document-output">
                <h3>📝 Bozza "About Me" da Personalizzare</h3>
                <pre id="draftAboutMe">${analysis.draftAboutMe}</pre>
                <button class="copy-btn" onclick="copyToClipboard('draftAboutMe')">📋 Copia Bozza</button>
                <p style="font-size: 12px; color: #666; margin-top: 15px; line-height: 1.5;">
                    <strong>⚠️ IMPORTANTE:</strong> Questa è una bozza generica generata automaticamente. 
                    Devi personalizzarla con i tuoi dati specifici, risultati quantificabili, 
                    e dettagli unici della tua esperienza prima di usarla.
                </p>
            </div>
        </div>
    `;
    
    document.getElementById('results-generic').innerHTML = resultsHTML;
}

// ============================================
// DOWNLOAD FUNCTIONS
// ============================================

function downloadAsWord(company, role, type) {
    const content = type === 'coverLetter' ? window.currentCoverLetter : window.currentAboutMe;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 2cm; }
        p { margin: 0 0 1em 0; }
    </style>
</head>
<body>
    <pre style="font-family: Arial; white-space: pre-wrap;">${content}</pre>
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover_Letter_${company.replace(/\s+/g, '_')}_Martino_Cicerani.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Drag and drop for file upload
document.addEventListener('DOMContentLoaded', function() {
    const fileUpload = document.getElementById('fileUpload');
    
    if (fileUpload) {
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.classList.add('dragover');
        });
        
        fileUpload.addEventListener('dragleave', () => {
            fileUpload.classList.remove('dragover');
        });
        
        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                document.getElementById('cvFile').files = e.dataTransfer.files;
                handleFileUpload({ target: { files: [file] } });
            }
        });
    }
});
