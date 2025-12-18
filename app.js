// Job Application System V2 - Enhanced Version
// Dual mode with improved keyword filtering and tool detection

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
        "AI for Marketing", "Prompt Engineering", "Team Management",
        "Excel", "PowerPoint"
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
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
}

// ============================================
// COMMON FUNCTIONS - ENHANCED
// ============================================

// Expanded stopwords list to filter out common non-meaningful words
const stopwords = new Set([
    // Italian
    'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
    'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'uno',
    'e', 'o', 'ma', 'se', 'che', 'chi', 'cui', 'del', 'della',
    'delle', 'dei', 'nel', 'nella', 'alle', 'agli', 'dai', 'dalle',
    // English - Common words
    'the', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'at', 'with',
    'you', 'your', 'we', 'our', 'will', 'have', 'has', 'who', 'what', 
    'when', 'where', 'why', 'how', 'this', 'that', 'these', 'those',
    'are', 'is', 'was', 'were', 'been', 'being', 'can', 'could', 
    'may', 'might', 'must', 'shall', 'should', 'would',
    // Job posting generic terms
    'looking', 'support', 'work', 'working', 'offer', 'role',
    'within', 'through', 'including', 'such', 'experience',
    'years', 'least', 'preferred', 'required', 'ability'
]);

function extractKeywords(jdText, topN = 20) {
    // Extract words with minimum 4 letters to filter out most stopwords naturally
    const words = jdText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const filtered = words.filter(w => !stopwords.has(w));
    
    const freq = {};
    filtered.forEach(word => {
        freq[word] = (freq[word] || 0) + 1;
    });
    
    // Get top keywords sorted by frequency
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
    
    // Enhanced tool patterns with word boundaries for better matching
    const toolPatterns = [
        // Adobe Suite
        /adobe creative suite|photoshop|illustrator|premiere|after effects|indesign/gi,
        // Microsoft & Data Tools - Added word boundaries to catch Excel properly
        /\bexcel\b|\bpowerpoint\b|power bi|looker studio|google analytics|tableau/gi,
        // Social Media Platforms
        /\bmeta\b|facebook|instagram|tiktok|linkedin|youtube/gi,
        // Project Management
        /\bjira\b|trello|asana|monday\.com|confluence/gi,
        // Design Tools
        /canva|figma|sketch|adobe xd/gi,
        // Marketing/Analytics
        /google ads|meta ads|dv360|programmatic|tag manager|analytics/gi
    ];
    
    toolPatterns.forEach(pattern => {
        const matches = jdText.match(pattern) || [];
        requirements.tools.push(...matches.map(m => m.toLowerCase()));
    });
    
    // Remove duplicates and normalize
    requirements.tools = [...new Set(requirements.tools)];
    
    // Extract years of experience
    const expMatch = jdLower.match(/(\d+)\+?\s*(?:years?|anni?)[\s\w]*(?:experience|esperienza)/i);
    if (expMatch) {
        requirements.experienceYears = parseInt(expMatch[1]);
    }
    
    // Soft skills detection
    const softSkillsPatterns = [
        { pattern: /team\s*(?:work|working|management|collaboration)/gi, skill: 'team work' },
        { pattern: /comunicazione|communication/gi, skill: 'communication' },
        { pattern: /problem\s*solving/gi, skill: 'problem solving' },
        { pattern: /autonomia|autonomy|independent/gi, skill: 'autonomy' },
        { pattern: /creatività|creativity|creative/gi, skill: 'creativity' },
        { pattern: /organizzazione|organization/gi, skill: 'organization' },
        { pattern: /leadership/gi, skill: 'leadership' },
        { pattern: /analytical|analytic/gi, skill: 'analytical skills' }
    ];
    
    softSkillsPatterns.forEach(({ pattern, skill }) => {
        if (pattern.test(jdText)) {
            requirements.softSkills.push(skill);
        }
    });
    
    requirements.softSkills = [...new Set(requirements.softSkills)];
    
    return requirements;
}

function calculateATSScore(documentText, jdKeywords) {
    const docLower = documentText.toLowerCase();
    
    const matches = [];
    const missing = [];
    
    jdKeywords.forEach(kw => {
        // Use word boundary for more accurate matching
        const regex = new RegExp(`\\b${kw.word}\\b`, 'i');
        if (regex.test(documentText)) {
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
    
    const isCreative = /creative|grafica|design|video|contenuti|content creation/i.test(jdText);
    const isProduct = /product|prodotto|roadmap|sviluppo|launch/i.test(jdText);
    const isMedia = /media\s+(?:strategy|planning|buying|expert)|advertising/i.test(jdText);
    
    let letter = `Oggetto: Candidatura per ${role} – ${location}

Gentile Team Selezione ${company},

desidero candidarmi per la posizione di ${role}. Con oltre ${martinoProfile.yearsExp} anni di esperienza in digital marketing e gestione di campagne per brand internazionali, ritengo di poter portare un contributo concreto al vostro team.`;
    
    // Adapt paragraph based on job focus
    if (isMedia) {
        letter += `

Nel mio ruolo attuale di ${martinoProfile.currentRole} presso ${martinoProfile.company}, gestisco strategie media end-to-end per brand come ${martinoProfile.brandsManaged.slice(0, 3).join(', ')}, coordinando agenzie media e partner digitali. Ho esperienza diretta nella pianificazione e acquisto media su piattaforme Meta, Google, TikTok e programmatic, con focus su ottimizzazione del ROI e analisi delle performance. Gestisco budget multi-milionari e collaboro con team cross-funzionali per garantire l'allineamento strategico delle campagne.`;
    } else if (isCreative) {
        letter += `

Nel mio ruolo attuale di ${martinoProfile.currentRole} presso ${martinoProfile.company}, ho sviluppato competenze nella creazione e ottimizzazione di contenuti digitali multi-canale, collaborando costantemente con team creativi per sviluppare asset pubblicitari performanti. Ho esperienza nella gestione di progetti che integrano storytelling visivo, video content e design strategico, garantendo coerenza del brand su tutti i touchpoint digitali.`;
    } else if (isProduct) {
        letter += `

Nel mio ruolo attuale di ${martinoProfile.currentRole} presso ${martinoProfile.company}, mi occupo della definizione di strategie digitali annuali e del lancio di nuovi prodotti per clienti automotive, fashion e medical device. Ho esperienza diretta nell'analisi dei trend di mercato, nella valutazione di fornitori e soluzioni tecnologiche, e nella collaborazione con team cross-funzionali (IT, Legal, Marketing) per portare prodotti digitali sul mercato. Gestisco l'intero ciclo: dalla roadmap strategica al monitoraggio post-lancio con KPI definiti.`;
    } else {
        // Default: Performance/Analytics focus
        const tools = reqs.tools.length > 0 
            ? reqs.tools.slice(0, 4).join(', ')
            : 'Google Analytics 4, Power BI, Looker Studio';
        letter += `

Nel mio ruolo attuale di ${martinoProfile.currentRole} presso ${martinoProfile.company}, gestisco strategie di advertising per brand come ${martinoProfile.brandsManaged.slice(0, 3).join(', ')}, con focus su ottimizzazione delle performance e analisi data-driven. Ho esperienza nella gestione di budget multi-canale, nel monitoraggio di KPI attraverso strumenti come ${tools}, e nell'implementazione di strategie di testing A/B per massimizzare il ROI e guidare decisioni strategiche basate sui dati.`;
    }
    
    // Add tools paragraph if relevant tools detected
    if (reqs.tools.length > 0) {
        const relevantTools = reqs.tools.filter(tool => 
            !martinoProfile.coreSkills.some(skill => 
                skill.toLowerCase().includes(tool.toLowerCase())
            )
        );
        
        if (relevantTools.length > 0 && relevantTools.length < 5) {
            letter += `

Ho inoltre esperienza con ${reqs.tools.slice(0, 5).join(', ')} per la gestione operativa delle campagne e l'analisi delle performance. La mia capacità di lavorare con team internazionali e gestire stakeholder a diversi livelli organizzativi mi ha permesso di sviluppare eccellenti competenze comunicative in inglese.`;
        }
    }
    
    // AI differentiator paragraph
    letter += `

Un aspetto che mi differenzia è l'integrazione di competenze in AI applicata al marketing, certificate attraverso corsi specializzati della Fastweb Digital Academy (${martinoProfile.aiCertifications.slice(0, 3).join(', ')}). Ho utilizzato queste competenze per sviluppare progetti personali che includono web development, strumenti di automazione e gestione data-driven di un property Airbnb, ottenendo risultati misurabili in termini di engagement e conversioni.`;
    
    // Closing
    letter += `

Sono motivato dalla possibilità di contribuire agli obiettivi di ${company} e mettere a disposizione un approccio analitico, orientato ai risultati e in continua evoluzione rispetto alle nuove tecnologie digitali.

Resto a disposizione per un colloquio conoscitivo.

Cordiali saluti,

${martinoProfile.name}
${martinoProfile.email} | ${martinoProfile.phone}`;
    
    return letter;
}

function generateCVAboutSectionMartino(jdText) {
    const reqs = extractRequirements(jdText);
    const jdLower = jdText.toLowerCase();
    
    const focusAreas = [];
    if (/media\s+(?:strategy|planning|buying)|advertising/i.test(jdText)) focusAreas.push("media strategy and planning");
    if (/performance|roi|kpi|optimization/i.test(jdText)) focusAreas.push("performance analysis");
    if (/strategy|strategic/i.test(jdText)) focusAreas.push("strategic planning");
    if (/product/i.test(jdText)) focusAreas.push("product management");
    if (/creative|content/i.test(jdText)) focusAreas.push("content creation");
    if (/data|analytics/i.test(jdText)) focusAreas.push("data analysis");
    
    if (focusAreas.length === 0) {
        focusAreas.push("digital strategy", "campaign optimization");
    }
    
    let about = `Digital Media Planner with over ${martinoProfile.yearsExp} years of experience in ${focusAreas.slice(0, 2).join(' and ')} for international brands. `;
    
    // Add relevant tools
    if (reqs.tools.length > 0) {
        const toolsToMention = reqs.tools.slice(0, 4).join(', ');
        about += `Proficient in ${toolsToMention}, `;
    }
    
    about += `specialized in optimizing omnichannel strategies and leveraging data-driven insights to improve marketing performance. `;
    
    // Add experience managing agencies/teams if relevant
    if (/agenc|partner|vendor|stakeholder/i.test(jdText)) {
        about += "Experienced in managing agencies, partners and cross-functional teams to deliver integrated marketing campaigns. ";
    }
    
    // Add AI certification if relevant
    if (/\bai\b|artificial intelligence|automation|machine learning/i.test(jdText)) {
        about += "Certified in AI-driven marketing with hands-on experience in implementing AI tools for campaign optimization and automation. ";
    }
    
    // Add career goal if senior role
    if (/manager|director|lead|head|senior/i.test(jdText)) {
        const targetRole = /product/i.test(jdText) ? 'product management' : 
                          /media/i.test(jdText) ? 'media strategy leadership' :
                          'strategic marketing roles';
        about += `Currently seeking opportunities in ${targetRole} to leverage analytical skills, strategic thinking and drive business growth.`;
    }
    
    return about.trim();
}

function generateSuggestionsMartino(jdText) {
    const suggestions = [];
    const jdLower = jdText.toLowerCase();
    const reqs = extractRequirements(jdText);
    
    // Specific tactical suggestions based on JD content
    if (/budget|cost/i.test(jdText)) {
        suggestions.push("📊 Evidenzia esperienza in budget management e negoziazione con fornitori nella sezione Work Experience");
    }
    
    if (/team|cross-functional|stakeholder/i.test(jdText)) {
        suggestions.push("👥 Sottolinea la gestione di team e coordinamento stakeholder cross-funzionali");
    }
    
    if (/international|global/i.test(jdText)) {
        suggestions.push("🌍 Metti in risalto l'esperienza con clienti internazionali (Honda, Levi's, Acuvue)");
    }
    
    if (reqs.experienceYears && reqs.experienceYears <= martinoProfile.yearsExp - 3) {
        suggestions.push(`⚡ Il ruolo richiede ${reqs.experienceYears} anni di esperienza: puoi enfatizzare anche progetti side e certificazioni recenti`);
    }
    
    if (/product|launch|roadmap/i.test(jdText)) {
        suggestions.push("🎯 Aggiungi bullet point su lancio prodotti e roadmap nella sezione UM Italia");
    }
    
    if (/creative|content|storytelling/i.test(jdText)) {
        suggestions.push("🎨 Evidenzia collaborazione con team creativi e sviluppo asset performanti");
    }
    
    if (/agenc|partner|vendor/i.test(jdText)) {
        suggestions.push("🤝 Sottolinea esperienza nella gestione di agenzie media e partner tecnologici");
    }
    
    if (/media\s+(?:planning|buying|strategy)/i.test(jdText)) {
        suggestions.push("📺 Evidenzia esperienza in media planning end-to-end e acquisto media su piattaforme programmatic");
    }
    
    // Check for missing critical tools
    const criticalTools = ['excel', 'powerpoint', 'power bi', 'google analytics', 'jira'];
    const missingCritical = criticalTools.filter(tool => 
        new RegExp(`\\b${tool}\\b`, 'i').test(jdText) && 
        !martinoProfile.coreSkills.some(skill => skill.toLowerCase().includes(tool))
    );
    
    if (missingCritical.length > 0) {
        suggestions.push(`⚠️ Tool mancanti nel CV ma richiesti: ${missingCritical.join(', ')} - aggiungili esplicitamente se hai esperienza`);
    }
    
    // Soft skills suggestions
    if (reqs.softSkills.length > 0 && /leadership|management/i.test(jdText)) {
        suggestions.push("💪 Aggiungi esempi concreti di leadership e gestione team nella sezione esperienza");
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
                    <button class="download-btn" onclick="downloadAsWord('${company.replace(/'/g, "\\'")}', '${role.replace(/'/g, "\\'")}', 'coverLetter')">📥 Download DOCX</button>
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
        const text = await extractTextFromPDF(arrayBuffer);
        uploadedCVText = text;
        showCVPreview(text);
    } catch (error) {
        alert('Errore nel parsing del PDF. Prova con un file DOCX o copia/incolla il contenuto.');
        console.error(error);
    }
}

async function extractTextFromPDF(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    let text = '';
    
    for (let i = 0; i < uint8Array.length; i++) {
        if (uint8Array[i] >= 32 && uint8Array[i] <= 126) {
            text += String.fromCharCode(uint8Array[i]);
        } else if (uint8Array[i] === 10 || uint8Array[i] === 13) {
            text += '\n';
        }
    }
    
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
    
    const cvInfo = extractCVInfo(cvText);
    const suggestions = generateGenericSuggestions(cvText, jdText, reqs, atsScore);
    const draftAboutMe = generateDraftAboutMe(cvInfo, jdText, reqs);
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
    
    const emailMatch = cvText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = cvText.match(/[\d\s\+\-\(\)]{10,}/);
    
    const yearMatches = cvText.match(/\b(19|20)\d{2}\b/g);
    let yearsExp = 0;
    if (yearMatches && yearMatches.length >= 2) {
        const years = yearMatches.map(y => parseInt(y)).sort();
        const firstYear = years[0];
        const currentYear = new Date().getFullYear();
        yearsExp = currentYear - firstYear;
        if (yearsExp > 50) yearsExp = 0;
    }
    
    const commonSkills = [
        'excel', 'powerpoint', 'google analytics', 'power bi', 'looker studio',
        'meta', 'facebook', 'instagram', 'tiktok', 'linkedin',
        'jira', 'trello', 'asana',
        'python', 'javascript', 'html', 'css', 'sql',
        'tableau', 'photoshop', 'illustrator'
    ];
    const foundSkills = commonSkills.filter(skill => 
        new RegExp(`\\b${skill}\\b`, 'i').test(cvText)
    );
    
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
    
    if (/manager|management|lead|director/i.test(jdText) && /manager|gestione|lead/i.test(cvText)) {
        suggestions.push("✅ Hai esperienza di management nel CV - evidenziala maggiormente nella sezione esperienza");
    }
    
    if (atsScore.missing.length > 8) {
        suggestions.push(`⚠️ Mancano ${atsScore.missing.length} keyword importanti. Priorità: ${atsScore.missing.slice(0, 5).join(', ')}`);
    } else if (atsScore.missing.length > 4) {
        suggestions.push(`⚠️ Considera di aggiungere queste keyword: ${atsScore.missing.slice(0, 5).join(', ')}`);
    }
    
    reqs.tools.forEach(tool => {
        if (!new RegExp(`\\b${tool}\\b`, 'i').test(cvText)) {
            suggestions.push(`🔧 Aggiungi "${tool}" alle competenze se hai esperienza (anche indiretta)`);
        }
    });
    
    if (reqs.experienceYears) {
        suggestions.push(`📅 La posizione richiede ${reqs.experienceYears} anni di esperienza. Assicurati che sia chiaro nel CV`);
    }
    
    if (/product|prodotto|launch/i.test(jdText)) {
        suggestions.push("🎯 Enfatizza progetti dove hai contribuito allo sviluppo/lancio di prodotti o servizi");
    }
    
    if (/data|analytics|performance|kpi/i.test(jdText)) {
        suggestions.push("📊 Metti in evidenza competenze di analisi dati e ottimizzazione performance con metriche concrete");
    }
    
    if (/team|collaboration|cross-functional/i.test(jdText)) {
        suggestions.push("👥 Sottolinea esperienze di lavoro in team e collaborazione cross-funzionale");
    }
    
    if (/agenc|partner|vendor|stakeholder/i.test(jdText)) {
        suggestions.push("🤝 Evidenzia esperienza nella gestione di agenzie, partner o stakeholder esterni");
    }
    
    return suggestions;
}

function generateDraftAboutMe(cvInfo, jdText, reqs) {
    const jdLower = jdText.toLowerCase();
    
    let focusAreas = [];
    if (/marketing|campaign/i.test(jdText)) focusAreas.push("marketing");
    if (/media\s+(?:planning|strategy|buying)/i.test(jdText)) focusAreas.push("media planning");
    if (/product/i.test(jdText)) focusAreas.push("product management");
    if (/data|analytics/i.test(jdText)) focusAreas.push("data analysis");
    if (/strategy|strategic/i.test(jdText)) focusAreas.push("strategic planning");
    
    if (focusAreas.length === 0) focusAreas = ["professional experience"];
    
    const yearsText = cvInfo.yearsExp && cvInfo.yearsExp !== 'Non rilevato' 
        ? `${cvInfo.yearsExp}+ years` 
        : 'several years';
    
    let draft = `Professional with ${yearsText} of experience in ${focusAreas.slice(0, 2).join(' and ')}. `;
    
    if (cvInfo.skills.length > 0) {
        draft += `Skilled in ${cvInfo.skills.slice(0, 5).join(', ')}. `;
    }
    
    if (reqs.tools.length > 0) {
        draft += `Experience with ${reqs.tools.slice(0, 4).join(', ')} for campaign management and performance analysis. `;
    }
    
    draft += `Strong analytical skills with a focus on data-driven decision making and results optimization.`;
    
    draft += `\n\n[NOTA: Questa è una bozza generica. Personalizzala con:
- Il tuo ruolo/titolo specifico attuale
- Nomi di aziende/brand con cui hai lavorato
- Risultati quantificabili (percentuali, numeri, metriche concrete)
- Specializzazioni uniche che ti differenziano
- Certificazioni o competenze distintive]`;
    
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
    
    reqs.tools.forEach(tool => {
        if (!new RegExp(`\\b${tool}\\b`, 'i').test(cvText)) {
            if (/jira|excel|powerpoint|google analytics/i.test(tool)) {
                gaps.critical.push(tool);
            } else if (/meta|google ads|power bi/i.test(tool)) {
                gaps.important.push(tool);
            } else {
                gaps.nice.push(tool);
            }
        }
    });
    
    const criticalKeywords = ['budget', 'team', 'strategy', 'analysis', 'performance'];
    criticalKeywords.forEach(kw => {
        if (new RegExp(`\\b${kw}\\b`, 'i').test(jdText) && 
            !new RegExp(`\\b${kw}\\b`, 'i').test(cvText)) {
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
