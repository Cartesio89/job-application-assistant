// Job Application System - JavaScript Engine
// Ported from Python version

const profile = {
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
    
    // Tool detection
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
    
    requirements.tools = [...new Set(requirements.tools)]; // Remove duplicates
    
    // Years experience
    const expMatch = jdLower.match(/(\d+)[\s-]+(anni?|years?)/);
    if (expMatch) {
        requirements.experienceYears = parseInt(expMatch[1]);
    }
    
    // Soft skills
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

function generateCoverLetter(jdText, company, role, location = "Roma") {
    const keywords = extractKeywords(jdText, 15);
    const reqs = extractRequirements(jdText);
    
    const jdLower = jdText.toLowerCase();
    
    const isCreative = /creative|grafica|design|video|contenuti/.test(jdLower);
    const isAnalytics = /analytics|data|performance|kpi|roi/.test(jdLower);
    const isProduct = /product|prodotto|roadmap|sviluppo/.test(jdLower);
    
    let letter = `Oggetto: Candidatura per ${role} – ${location}

Gentile Team Selezione ${company},

desidero candidarmi per la posizione di ${role}. Con oltre ${profile.yearsExp} anni di esperienza in digital marketing e gestione di campagne per brand internazionali, ritengo di poter portare un contributo concreto al vostro team.`;
    
    // Paragrafo competenze (personalizzato)
    if (isCreative) {
        letter += `

Nel mio ruolo attuale di ${profile.currentRole} presso ${profile.company}, ho sviluppato competenze nella creazione e ottimizzazione di contenuti digitali multi-canale, collaborando costantemente con team creativi per sviluppare asset pubblicitari performanti. Ho esperienza nella gestione di progetti che integrano storytelling visivo, video content e design strategico.`;
    } else if (isProduct) {
        letter += `

Nel mio ruolo attuale di ${profile.currentRole} presso ${profile.company}, mi occupo della definizione di strategie digitali annuali e del lancio di nuovi prodotti per clienti automotive, fashion e medical device. Ho esperienza diretta nell'analisi dei trend di mercato, nella valutazione di fornitori e soluzioni tecnologiche, e nella collaborazione con team cross-funzionali (IT, Legal, Marketing) per portare prodotti digitali sul mercato. Gestisco l'intero ciclo di sviluppo prodotto: dalla roadmap strategica al monitoraggio delle performance post-lancio, con particolare focus su ottimizzazione basata su dati e test A/B.`;
    } else {
        const tools = reqs.tools.slice(0, 3).join(', ') || 'Google Analytics 4, Power BI e Looker Studio';
        letter += `

Nel mio ruolo attuale di ${profile.currentRole} presso ${profile.company}, gestisco strategie di advertising per brand come ${profile.brandsManaged.slice(0, 3).join(', ')}, con focus su ottimizzazione delle performance e analisi data-driven. Ho esperienza nella gestione di budget multi-canale, nel monitoraggio di KPI attraverso strumenti come ${tools}, e nell'implementazione di strategie di testing per massimizzare il ROI.`;
    }
    
    // Se ci sono tool specifici richiesti, aggiungi paragrafo dedicato
    if (reqs.tools.length > 0) {
        letter += `

Ho solida padronanza di ${reqs.tools.slice(0, 4).join(', ')} per analisi di mercato e reportistica manageriale. La mia esperienza con clienti internazionali (${profile.brandsManaged.slice(0, 3).join(', ')}) mi ha permesso di sviluppare eccellenti competenze in inglese e capacità di coordinamento con stakeholder globali.`;
    }
    
    // Paragrafo AI
    letter += `

Un aspetto che mi differenzia è l'integrazione di competenze in AI applicata al marketing, certificate attraverso corsi specializzati della Fastweb Digital Academy (${profile.aiCertifications.slice(0, 3).join(', ')}). Ho utilizzato queste competenze per sviluppare progetti personali che includono web development, strumenti di automazione e gestione data-driven di un property Airbnb, ottenendo risultati misurabili in termini di engagement e conversioni.`;
    
    // Chiusura
    letter += `

Sono motivato dalla possibilità di contribuire agli obiettivi di ${company} e mettere a disposizione un approccio analitico, orientato ai risultati e in continua evoluzione rispetto alle nuove tecnologie digitali.

Resto a disposizione per un colloquio conoscitivo.

Cordiali saluti,

${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}

function generateCVAboutSection(jdText) {
    const reqs = extractRequirements(jdText);
    const keywords = extractKeywords(jdText, 10);
    
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
    
    let about = `Digital Media Planner with over ${profile.yearsExp} years of experience in ${focusAreas.slice(0, 2).join(' and ')} for international brands. `;
    
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

function generateSuggestions(jdText) {
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
    
    if (/jira|agile/.test(jdLower)) {
        suggestions.push("🔧 Menziona familiarità con metodologie agile se hai esperienza (anche indiretta)");
    }
    
    const missingTools = ['excel', 'powerpoint', 'power bi', 'google analytics', 'jira']
        .filter(tool => jdLower.includes(tool) && 
                       !profile.coreSkills.some(skill => skill.toLowerCase().includes(tool)));
    
    if (missingTools.length > 0) {
        suggestions.push(`⚠️ Keyword mancanti importanti: ${missingTools.join(', ')} - valuta se hai esperienza anche indiretta da menzionare`);
    }
    
    return suggestions;
}

// UI Functions
function generateDocuments() {
    const company = document.getElementById('company').value.trim();
    const role = document.getElementById('role').value.trim();
    const location = document.getElementById('location').value.trim() || 'Roma';
    const jd = document.getElementById('jd').value.trim();
    
    if (!company || !role || !jd) {
        alert('Per favore compila tutti i campi obbligatori (*)');
        return;
    }
    
    // Show loading
    document.getElementById('loading').classList.add('show');
    document.getElementById('results').classList.remove('show');
    
    // Simulate processing delay
    setTimeout(() => {
        // Extract keywords
        const keywords = extractKeywords(jd, 15);
        
        // Generate documents
        const coverLetter = generateCoverLetter(jd, company, role, location);
        const aboutMe = generateCVAboutSection(jd);
        const suggestions = generateSuggestions(jd);
        
        // Calculate ATS score
        const atsScore = calculateATSScore(coverLetter + ' ' + aboutMe, keywords);
        
        // Display results
        displayResults(atsScore, coverLetter, aboutMe, suggestions);
        
        // Hide loading, show results
        document.getElementById('loading').classList.remove('show');
        document.getElementById('results').classList.add('show');
        
        // Scroll to results
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    }, 1000);
}

function displayResults(atsScore, coverLetter, aboutMe, suggestions) {
    // Score
    document.getElementById('scoreNumber').textContent = atsScore.score + '%';
    
    let interpretation = '';
    if (atsScore.score >= 70) {
        interpretation = '✅ Ottimo match! Alta probabilità di passare i filtri ATS';
    } else if (atsScore.score >= 50) {
        interpretation = '⚠️ Buon match, ma considera di aggiungere alcune keyword mancanti';
    } else {
        interpretation = '❌ Match basso. Valuta attentamente se candidarti o rivedi i documenti';
    }
    document.getElementById('scoreInterpretation').textContent = interpretation;
    
    // Matched keywords
    document.getElementById('matchedCount').textContent = atsScore.matchedKeywords;
    const matchedDiv = document.getElementById('matchedKeywords');
    matchedDiv.innerHTML = atsScore.matches
        .map(kw => `<span class="keyword-tag matched">${kw}</span>`)
        .join('');
    
    // Missing keywords
    document.getElementById('missingCount').textContent = atsScore.missing.length;
    const missingDiv = document.getElementById('missingKeywords');
    missingDiv.innerHTML = atsScore.missing
        .slice(0, 10)
        .map(kw => `<span class="keyword-tag missing">${kw}</span>`)
        .join('');
    
    // Cover letter
    document.getElementById('coverLetterOutput').textContent = coverLetter;
    
    // About me
    document.getElementById('aboutMeOutput').textContent = aboutMe;
    
    // Suggestions
    const suggestionsDiv = document.getElementById('suggestionsList');
    suggestionsDiv.innerHTML = suggestions
        .map(sug => `<li>${sug}</li>`)
        .join('');
    
    // Store for download
    window.currentCoverLetter = coverLetter;
    window.currentAboutMe = aboutMe;
    window.currentCompany = document.getElementById('company').value;
    window.currentRole = document.getElementById('role').value;
}

function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('✓ Copiato negli appunti!');
    });
}

function downloadAsWord(type) {
    const company = window.currentCompany;
    const role = window.currentRole;
    const content = type === 'coverLetter' ? window.currentCoverLetter : window.currentAboutMe;
    
    // Create simple HTML for Word
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
