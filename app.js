// Job Application System V4.1 - PRODUCTION READY
// Complete rewrite with all fixes integrated
// Part 1: Core Data Structures, Storage, Advanced Keywords with Claude API

// ============================================
// MARTINO'S PROFILE
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
    industries: ["Automotive", "Fashion", "Medical Device", "Beverage"],
    aiCertifications: [
        "AI for Marketing (Fastweb Digital Academy)",
        "Prompt Engineering", "Claude", "NotebookLM", "Midjourney"
    ]
};

// Global variables
let uploadedCVText = '';
let uploadedFileName = '';
let currentAnalysisResults = null;

// ============================================
// ENHANCED STORAGE MANAGER (with sent tracking & feedback)
// ============================================
const StorageManager = {
    saveAnalysis(company, role, results, type = 'martino') {
        const history = this.getHistory();
        const entry = {
            id: Date.now(),
            company,
            role,
            type,
            date: new Date().toISOString(),
            atsScore: results.atsScore ? results.atsScore.score : 0,
            coverLetterPreview: results.coverLetter ? results.coverLetter.substring(0, 150) + '...' : '',
            fullResults: results,
            emailSent: false,
            sentDate: null,
            recipientEmail: null,
            attachments: [],
            feedbackCompleted: false,
            outcome: null,
            responseTime: null,
            feedbackNotes: '',
            feedbackDeadline: null,
            status: 'draft',
            reminderSent: false,
            recoverable: true
        };
        
        history.unshift(entry);
        
        if (history.length > 50) history.pop();
        
        localStorage.setItem('job_app_history', JSON.stringify(history));
        return entry.id;
    },
    
    getHistory() {
        const data = localStorage.getItem('job_app_history');
        return data ? JSON.parse(data) : [];
    },
    
    getAnalysis(id) {
        const history = this.getHistory();
        return history.find(entry => entry.id === parseInt(id));
    },
    
    updateAnalysis(id, updates) {
        const history = this.getHistory();
        const index = history.findIndex(entry => entry.id === parseInt(id));
        if (index !== -1) {
            history[index] = { ...history[index], ...updates };
            localStorage.setItem('job_app_history', JSON.stringify(history));
        }
    },
    
    markAsSent(id, emailData) {
        this.updateAnalysis(id, {
            emailSent: true,
            sentDate: new Date().toISOString(),
            recipientEmail: emailData.recipientEmail,
            attachments: emailData.attachments,
            status: 'sent',
            feedbackDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        });
    },
    
    updateFeedback(id, feedbackData) {
        this.updateAnalysis(id, {
            feedbackCompleted: true,
            outcome: feedbackData.outcome,
            responseTime: feedbackData.responseTime,
            feedbackNotes: feedbackData.feedbackNotes,
            interviewType: feedbackData.interviewType,
            status: 'completed',
            feedbackDate: new Date().toISOString()
        });
        
        this.updateLearningData(id, feedbackData);
    },
    
    updateLearningData(id, feedbackData) {
        const entry = this.getAnalysis(id);
        if (!entry) return;
        
        const learning = this.getLearningData();
        
        const industry = entry.fullResults?.industry || 'generic';
        if (!learning.industryStats[industry]) {
            learning.industryStats[industry] = {
                applications: 0,
                interviews: 0,
                rejections: 0,
                ghosted: 0,
                avgAtsScore: 0,
                bestStyle: null,
                totalAtsScore: 0
            };
        }
        
        const industryData = learning.industryStats[industry];
        industryData.applications++;
        industryData.totalAtsScore += entry.atsScore;
        industryData.avgAtsScore = Math.round(industryData.totalAtsScore / industryData.applications);
        
        if (feedbackData.outcome === 'interview') industryData.interviews++;
        if (feedbackData.outcome === 'rejection') industryData.rejections++;
        if (feedbackData.outcome === 'ghosted') industryData.ghosted++;
        
        const style = entry.fullResults?.selectedStyle || 'standard_it';
        if (!learning.styleEffectiveness[style]) {
            learning.styleEffectiveness[style] = {
                used: 0,
                interviews: 0,
                successRate: 0
            };
        }
        
        learning.styleEffectiveness[style].used++;
        if (feedbackData.outcome === 'interview') {
            learning.styleEffectiveness[style].interviews++;
        }
        learning.styleEffectiveness[style].successRate = Math.round(
            (learning.styleEffectiveness[style].interviews / learning.styleEffectiveness[style].used) * 100
        );
        
        localStorage.setItem('learning_data', JSON.stringify(learning));
    },
    
    getLearningData() {
        const data = localStorage.getItem('learning_data');
        return data ? JSON.parse(data) : {
            industryStats: {},
            styleEffectiveness: {},
            toolsEffectiveness: {},
            lastUpdated: new Date().toISOString()
        };
    },
    
    deleteAnalysis(id) {
        const history = this.getHistory().filter(entry => entry.id !== parseInt(id));
        localStorage.setItem('job_app_history', JSON.stringify(history));
    },
    
    clearHistory() {
        localStorage.removeItem('job_app_history');
    },
    
    exportData() {
        const data = {
            profile: martinoProfile,
            history: this.getHistory(),
            learningData: this.getLearningData(),
            exportedAt: new Date().toISOString(),
            version: '4.1'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `job_app_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showExportInstructions();
    },
    
    importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (!data.version || !data.history) {
                throw new Error('File non valido');
            }
            
            const currentHistory = this.getHistory();
            const merge = confirm(
                `Trovate ${data.history.length} candidature nel backup.\n\n` +
                `Hai attualmente ${currentHistory.length} candidature salvate.\n\n` +
                `Vuoi UNIRE i dati (consigliato) o SOVRASCRIVERE tutto?`
            );
            
            if (merge) {
                const merged = [...currentHistory];
                data.history.forEach(entry => {
                    const existingIndex = merged.findIndex(e => e.id === entry.id);
                    if (existingIndex === -1) {
                        merged.push(entry);
                    } else {
                        if (new Date(entry.date) > new Date(merged[existingIndex].date)) {
                            merged[existingIndex] = entry;
                        }
                    }
                });
                
                localStorage.setItem('job_app_history', JSON.stringify(merged));
                alert(`✅ Dati uniti! Totale candidature: ${merged.length}`);
            } else {
                localStorage.setItem('job_app_history', JSON.stringify(data.history));
                localStorage.setItem('learning_data', JSON.stringify(data.learningData || {}));
                alert(`✅ Dati importati! ${data.history.length} candidature caricate.`);
            }
            
            location.reload();
            
        } catch (error) {
            alert('❌ Errore import: file corrotto o formato non valido');
            console.error(error);
        }
    }
};

// ============================================
// FEEDBACK SYSTEM - Auto-ghost after 15 days
// ============================================
function checkFeedbackStatus() {
    const applications = StorageManager.getHistory();
    const today = new Date();
    
    applications.forEach(app => {
        if (app.status === 'sent' && !app.feedbackCompleted) {
            const sentDate = new Date(app.sentDate);
            const daysPassed = Math.floor((today - sentDate) / (1000 * 60 * 60 * 24));
            
            if (daysPassed === 15 && !app.reminderSent) {
                showFeedbackReminder(app);
                StorageManager.updateAnalysis(app.id, { reminderSent: true });
            }
            
            if (daysPassed > 15 && !app.feedbackCompleted) {
                StorageManager.updateAnalysis(app.id, {
                    status: 'auto-ghosted',
                    outcome: 'ghosted',
                    recoverable: true
                });
            }
        }
    });
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', checkFeedbackStatus);
}

// ============================================
// ADVANCED KEYWORD EXTRACTION - CLAUDE API VALIDATED
// ============================================

const stopwords = new Set([
    'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
    'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'uno',
    'al', 'allo', 'alla', 'ai', 'agli', 'alle',
    'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
    'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
    'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
    'del', 'dello', 'della', 'dei', 'degli', 'delle',
    'col', 'coi', 'sull', 'dall', 'all', 'coll',
    'e', 'ed', 'o', 'od', 'ma', 'però', 'perché', 'quindi', 'dunque',
    'anche', 'inoltre', 'oppure', 'ovvero', 'cioè', 'sia',
    'che', 'chi', 'cui', 'quale', 'quali', 'quanto', 'quanta', 'quanti', 'quante',
    'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro',
    'mi', 'ti', 'ci', 'vi', 'si', 'ne',
    'questo', 'questa', 'questi', 'queste',
    'quello', 'quella', 'quelli', 'quelle',
    'tale', 'tali', 'altro', 'altra', 'altri', 'altre',
    'è', 'sono', 'sei', 'siamo', 'siete', 'era', 'erano', 'ero', 'eravamo',
    'essere', 'stato', 'stata', 'stati', 'state', 'sia', 'siano',
    'avere', 'ha', 'hanno', 'hai', 'ho', 'abbiamo', 'avete',
    'aveva', 'avevano', 'avuto', 'avuta', 'avuti', 'avute',
    'può', 'possono', 'puoi', 'possiamo', 'potere',
    'deve', 'devono', 'devi', 'dobbiamo', 'dovere',
    'vuole', 'vogliono', 'vuoi', 'vogliamo', 'volere',
    'fare', 'fa', 'fanno', 'fai', 'facciamo', 'fatto', 'fatta',
    'dire', 'dice', 'dicono', 'detto', 'detta',
    'andare', 'va', 'vanno', 'vai', 'andiamo',
    'dare', 'dà', 'danno', 'dai', 'diamo', 'dato', 'data',
    'stare', 'sta', 'stanno', 'stai', 'stiamo',
    'vedere', 'vede', 'vedono', 'vedi', 'vediamo', 'visto', 'vista',
    'non', 'più', 'molto', 'poco', 'tanto', 'troppo', 'sempre', 'mai',
    'già', 'ancora', 'solo', 'proprio', 'quasi', 'almeno',
    'come', 'dove', 'quando', 'così', 'bene', 'male',
    'lavoro', 'lavori', 'lavorare', 'lavoratore', 'lavoratori',
    'offerta', 'offerte', 'offrire', 'offriamo',
    'posizione', 'posizioni', 'posto', 'posti',
    'ricerca', 'ricerche', 'ricerchiamo', 'ricercando',
    'opportunità', 'chance', 'possibilità',
    'cerchiamo', 'stiamo', 'cercando', 'cerco', 'cerca', 'cerchi', 'cercano',
    'assume', 'assumere', 'assunzione', 'assunzioni',
    'selezione', 'selezioni', 'seleziona', 'selezioniamo',
    'inserimento', 'inserire', 'inseriamo',
    'candidato', 'candidata', 'candidati', 'candidature', 'candidatura',
    'collega', 'colleghi', 'colleghe',
    'collaboratore', 'collaboratori', 'collaboratrice', 'collaboratrici',
    'risorsa', 'risorse', 'figura', 'figure', 'profilo', 'profili',
    'persona', 'persone', 'individuo', 'individui',
    'talento', 'talenti', 'professional', 'professionista', 'professionisti',
    'impiego', 'occupazione', 'incarico',
    'azienda', 'aziende', 'società', 'impresa', 'imprese', 'ditta',
    'team', 'gruppo', 'squadra', 'staff',
    'ufficio', 'sede', 'headquarter', 'headquarters',
    'reparto', 'dipartimento', 'divisione', 'area',
    'organizzazione', 'organico', 'struttura',
    'ambiente', 'contesto', 'realtà', 'panorama',
    'dinamico', 'dinamica', 'dinamici', 'dinamiche',
    'internazionale', 'internazionali', 'globale', 'globali',
    'giovane', 'giovani', 'stimolante', 'stimolanti',
    'innovativo', 'innovativa', 'innovativi', 'innovative',
    'importante', 'rilevante', 'leader', 'primario', 'primaria',
    'strutturato', 'strutturata', 'solido', 'solida',
    'crescita', 'espansione', 'sviluppo',
    'settore', 'settori', 'mercato', 'mercati', 'industria', 'industrie',
    'clienti', 'cliente', 'partner', 'fornitori', 'fornitore',
    'business', 'attività', 'operazioni', 'servizi', 'servizio',
    'vuoi', 'desidera', 'desiderano', 'desideri', 'desideriamo', 'desiderare',
    'interessato', 'interessata', 'interessati', 'interessate',
    'unire', 'unirti', 'unirsi', 'entrare', 'entri',
    'lavorare', 'lavorando', 'occupare', 'occuparsi',
    'svolgere', 'svolge', 'svolgono', 'svolgimento',
    'gestire', 'gestisce', 'gestiscono', 'gestione',
    'seguire', 'segue', 'seguono', 'supportare', 'supporto',
    'contribuire', 'contribuisce', 'contribuiscono', 'contributo',
    'coordinare', 'coordina', 'coordinamento',
    'sviluppare', 'sviluppa', 'sviluppano',
    'competenza', 'competenze', 'skill', 'skills',
    'esclusivit', 'esclusivo', 'esclusiva', 'esclusivi', 'esclusive',
    'requisito', 'requisiti', 'requirement', 'requirements',
    'necessario', 'necessari', 'necessaria', 'necessarie',
    'richiesto', 'richiesti', 'richiesta', 'richieste',
    'esperienza', 'esperienze', 'conoscenza', 'conoscenze',
    'capacità', 'abilità', 'attitudine', 'attitudini',
    'qualifica', 'qualifiche', 'titolo', 'titoli',
    'diploma', 'laurea', 'master', 'certificazione', 'certificazioni',
    'ottimo', 'ottima', 'ottimi', 'ottime', 'eccellente', 'eccellenti',
    'buono', 'buona', 'buoni', 'buone', 'valido', 'valida',
    'preferibile', 'preferibili', 'gradita', 'gradito', 'gradite',
    'apprezzata', 'apprezzato', 'apprezzate', 'completano', 'completa',
    'ideale', 'perfetto', 'perfetta', 'adatto', 'adatta',
    'offriamo', 'garantiamo', 'assicuriamo', 'prevediamo',
    'contratto', 'contrattuale', 'retribuzione', 'stipendio',
    'benefit', 'welfare', 'ticket', 'buoni', 'premio',
    'formazione', 'training', 'corso', 'corsi',
    'the', 'a', 'an', 'of', 'to', 'in', 'for', 'on', 'at', 'with', 'by', 'from', 'about',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'over',
    'and', 'or', 'but', 'so', 'yet', 'nor', 'as', 'if', 'than', 'that',
    'because', 'since', 'unless', 'while', 'where', 'when',
    'you', 'your', 'we', 'our', 'they', 'their', 'it', 'its',
    'he', 'she', 'him', 'her', 'us', 'them', 'this',
    'these', 'those', 'who', 'what', 'which', 'whom', 'whose',
    'are', 'is', 'was', 'were', 'been', 'being', 'be',
    'have', 'has', 'had', 'having',
    'can', 'could', 'may', 'might', 'must', 'should', 'would', 'will',
    'do', 'does', 'did', 'doing', 'done',
    'make', 'makes', 'made', 'making',
    'get', 'gets', 'got', 'getting',
    'go', 'goes', 'went', 'going', 'gone',
    'come', 'comes', 'came', 'coming',
    'take', 'takes', 'took', 'taking', 'taken',
    'see', 'sees', 'saw', 'seeing', 'seen',
    'know', 'knows', 'knew', 'knowing', 'known',
    'think', 'thinks', 'thought', 'thinking',
    'want', 'wants', 'wanted', 'wanting',
    'use', 'uses', 'used', 'using',
    'not', 'no', 'yes', 'very', 'too', 'also', 'just', 'only',
    'even', 'well', 'back', 'more', 'most', 'all', 'some', 'any',
    'both', 'each', 'every', 'such', 'other', 'another',
    'how', 'now', 'then', 'here', 'there',
    'job', 'jobs', 'position', 'positions', 'role', 'roles',
    'work', 'working', 'worker', 'workers',
    'offer', 'offering', 'opportunity', 'opportunities',
    'looking', 'seeking', 'search', 'searching',
    'hire', 'hiring', 'recruit', 'recruiting', 'recruitment',
    'employment', 'vacancy', 'vacancies', 'opening', 'openings',
    'candidate', 'candidates', 'applicant', 'applicants',
    'colleague', 'colleagues', 'member', 'members',
    'professional', 'professionals', 'talent', 'talents',
    'individual', 'individuals', 'person', 'people',
    'company', 'companies', 'firm', 'organization', 'business',
    'group', 'office', 'department', 'division',
    'environment', 'culture', 'workplace',
    'dynamic', 'international', 'global', 'innovative',
    'leading', 'major', 'growing', 'established',
    'successful', 'reputable', 'prestigious',
    'support', 'contribute', 'tasks', 'join',
    'manage', 'lead', 'develop', 'coordinate',
    'ensure', 'provide', 'deliver', 'achieve',
    'years', 'experience', 'preferred', 'required', 'must',
    'skills', 'knowledge', 'ability', 'abilities',
    'qualification', 'qualifications', 'degree', 'education',
    'excellent', 'strong', 'good', 'proven', 'solid'
]);

function extractBigrams(text) {
    const words = text.toLowerCase().match(/\b[a-zàèéìòù]{3,}\b/g) || [];
    const bigrams = [];
    
    for (let i = 0; i < words.length - 1; i++) {
        if (!stopwords.has(words[i]) && !stopwords.has(words[i + 1])) {
            bigrams.push(`${words[i]} ${words[i + 1]}`);
        }
    }
    
    return bigrams;
}

function calculateTFIDF(term, text, allTexts = [text]) {
    const termLower = term.toLowerCase();
    const textLower = text.toLowerCase();
    
    const termCount = (textLower.match(new RegExp(`\\b${termLower.replace(/\s+/g, '\\s+')}\\b`, 'g')) || []).length;
    const totalWords = textLower.split(/\s+/).length;
    const tf = termCount / totalWords;
    
    const docsWithTerm = allTexts.filter(doc => 
        doc.toLowerCase().includes(termLower)
    ).length;
    const idf = Math.log(allTexts.length / (docsWithTerm + 1));
    
    return tf * idf;
}

function getDomainBoost(term) {
    const boostMap = {
        'digital marketing': 2.5,
        'media planning': 2.5,
        'performance marketing': 2.5,
        'social media': 2.0,
        'content marketing': 2.0,
        'email marketing': 2.0,
        'seo': 2.0,
        'sem': 2.0,
        'campaign optimization': 2.0,
        'budget management': 2.0,
        'product management': 2.5,
        'agile': 2.0,
        'scrum': 2.0,
        'roadmap': 2.0,
        'user story': 2.0,
        'data analysis': 2.5,
        'data analytics': 2.5,
        'business intelligence': 2.0,
        'kpi': 2.0,
        'dashboard': 2.0,
        'google analytics': 2.0,
        'power bi': 2.0,
        'tableau': 2.0,
        'meta ads': 2.0,
        'google ads': 2.0,
        'facebook ads': 2.0,
        'tiktok': 1.8,
        'linkedin ads': 1.8,
        'programmatic': 1.8,
        'dv360': 1.8,
        'tag manager': 1.8,
        'looker studio': 1.8,
        'excel': 1.6,
        'powerpoint': 1.6,
        'photoshop': 1.8,
        'illustrator': 1.8,
        'figma': 1.8,
        'canva': 1.6,
        'jira': 1.6,
        'asana': 1.6,
        'marketing': 1.5,
        'strategy': 1.5,
        'analysis': 1.5,
        'management': 1.5,
        'planning': 1.5
    };
    
    return boostMap[term.toLowerCase()] || 1.0;
}

function filterIrrelevantKeywords(keywords) {
    const irrelevantPatterns = [
        /^(sull|dell|nell|all|coll)\s/i,
        /\b(offerta|lavoro|job|posizione|ricerca)\b/i,
        /\b(azienda|società|team|gruppo|ufficio)\b/i,
        /\b(cerchi|cerca|cerchiamo|ricerca|stiamo)\b/i,
        /\b(vuoi|vuole|desidera|interessato)\b/i,
        /\b(candidato|candidata|figura|risorsa)\b/i,
        /\b(ambiente|dinamico|internazionale|giovane)\b/i,
        /\b(importante|leader|settore|mercato)\b/i,
        /\b(ottimo|buono|eccellente|preferibile)\b/i,
        /\b(lavorare|occupare|svolgere|gestire|seguire)\b/i,
        /\b(unire|entrare|contribuire|supportare)\b/i,
        /\b(competenza|esperienza|conoscenza|capacità)\b/i,
        /\b(requisito|necessario|richiesto)\b/i,
        /\b(looking|support|work|offer|role)\b/i,
        /\b(opportunity|join|contribute|tasks)\b/i,
        /\b(candidate|position|hiring|seeking)\b/i,
        /\b(years|experience|preferred|required)\b/i,
        /\b(contratto|retribuzione|benefit|welfare)\b/i,
        /\b(formazione|training|corso)\b/i,
        /\b(sede|ufficio|zona|area|città)\b/i
    ];
    
    return keywords.filter(kw => {
        const word = kw.word.toLowerCase();
        
        if (irrelevantPatterns.some(pattern => pattern.test(word))) {
            return false;
        }
        
        if (word.length < 3) {
            return false;
        }
        
        if (word.length === 3 && !/^[A-Z]{3}$/.test(kw.word)) {
            return false;
        }
        
        if (/^\d+$/.test(word)) {
            return false;
        }
        
        if (word.includes(' ')) return true;
        if (kw.score > 1.0) return true;
        if (kw.count >= 3) return true;
        if (getDomainBoost(word) >= 1.8) return true;
        
        return false;
    });
}

async function validateKeywordsWithClaude(keywords, jdText) {
    try {
        const keywordList = keywords.map(k => k.word).join(', ');
        
        const prompt = `Analizza questa job description e filtra solo le keyword TECNICHE, SPECIFICHE e RILEVANTI per il ruolo.

ESCLUDI assolutamente:
- Parole generiche HR (lavoro, offerta, posizione, candidato, azienda, team, etc)
- Aggettivi generici (dinamico, importante, ottimo, giovane, etc)
- Verbi generici (cerchiamo, offriamo, gestiamo, etc)
- Requisiti generici (esperienza, competenza, capacità, etc)

INCLUDI solo:
- Tool/software specifici (es: Power BI, Google Analytics, Figma, etc)
- Competenze tecniche specifiche (es: Media Planning, SEO, Agile, etc)
- Tecnologie/piattaforme (es: Meta Ads, Programmatic, AWS, etc)
- Industry terms specifici (es: Automotive, Fashion, Pharma, etc)
- Acronimi tecnici (es: KPI, ROI, CPA, CPM, etc)

JD (primi 600 char):
${jdText.substring(0, 600)}...

Keywords estratte:
${keywordList}

Rispondi SOLO con lista keyword valide separate da virgola, NIENTE altro testo.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        if (!response.ok) {
            console.warn('Claude API validation failed, using local filter');
            return keywords;
        }
        
        const data = await response.json();
        const validKeywordsText = data.content[0].text.trim();
        const validKeywords = validKeywordsText.split(',').map(k => k.trim().toLowerCase());
        
        const filtered = keywords.filter(kw => 
            validKeywords.some(vk => 
                kw.word.toLowerCase() === vk || 
                kw.word.toLowerCase().includes(vk) ||
                vk.includes(kw.word.toLowerCase())
            )
        );
        
        return filtered.length > 0 ? filtered : keywords.slice(0, 8);
        
    } catch (error) {
        console.error('Claude validation error:', error);
        return keywords;
    }
}

async function extractKeywordsAdvanced(jdText, topN = 15) {
    const unigrams = jdText.toLowerCase().match(/\b[a-zàèéìòù]{4,}\b/g) || [];
    const bigrams = extractBigrams(jdText);
    
    const allTerms = [...new Set([...unigrams, ...bigrams])].filter(term => 
        !stopwords.has(term.toLowerCase())
    );
    
    const scored = allTerms.map(term => ({
        word: term,
        score: calculateTFIDF(term, jdText) * getDomainBoost(term),
        count: (jdText.toLowerCase().match(new RegExp(`\\b${term.replace(/\s+/g, '\\s+')}\\b`, 'g')) || []).length
    }));
    
    const localFiltered = filterIrrelevantKeywords(scored);
    
    const sorted = localFiltered
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(topN * 2, 30));
    
    const claudeValidated = await validateKeywordsWithClaude(sorted, jdText);
    
    return claudeValidated.slice(0, topN);
}
// Job Application System V4.1 - Part 2
// Industry Detection, Requirements Extraction, Competitive Analysis

// ============================================
// INDUSTRY DETECTION
// ============================================
function detectIndustry(jdText) {
    const patterns = {
        tech: {
            keywords: /\b(startup|saas|agile|scrum|sprint|mvp|github|aws|cloud|api|devops)\b/gi,
            weight: 0
        },
        corporate: {
            keywords: /\b(enterprise|compliance|governance|audit|corporate|policy|regulation)\b/gi,
            weight: 0
        },
        creative: {
            keywords: /\b(portfolio|design|creative|visual|brand|aesthetic|artistic)\b/gi,
            weight: 0
        },
        finance: {
            keywords: /\b(banking|investment|trading|financial|asset|portfolio|risk)\b/gi,
            weight: 0
        },
        marketing: {
            keywords: /\b(campaign|advertising|media|social|content|seo|brand awareness)\b/gi,
            weight: 0
        }
    };
    
    for (const [industry, data] of Object.entries(patterns)) {
        const matches = jdText.match(data.keywords);
        patterns[industry].weight = matches ? matches.length : 0;
    }
    
    const sorted = Object.entries(patterns).sort((a, b) => b[1].weight - a[1].weight);
    
    return sorted[0][1].weight > 0 ? sorted[0][0] : 'generic';
}

function getIndustryTemplate(industry) {
    const templates = {
        tech: {
            tone: 'informal',
            verbs: ['shipped', 'built', 'scaled', 'optimized', 'launched', 'implemented'],
            format: 'bullet_metrics',
            emphasis: 'results'
        },
        corporate: {
            tone: 'formal',
            verbs: ['managed', 'coordinated', 'ensured', 'delivered', 'oversaw', 'facilitated'],
            format: 'detailed_paragraphs',
            emphasis: 'process'
        },
        creative: {
            tone: 'expressive',
            verbs: ['designed', 'crafted', 'created', 'developed', 'conceptualized', 'produced'],
            format: 'storytelling',
            emphasis: 'impact'
        },
        finance: {
            tone: 'precise',
            verbs: ['analyzed', 'forecasted', 'optimized', 'managed', 'allocated', 'monitored'],
            format: 'quantitative',
            emphasis: 'numbers'
        },
        marketing: {
            tone: 'dynamic',
            verbs: ['drove', 'increased', 'boosted', 'generated', 'executed', 'optimized'],
            format: 'results_focused',
            emphasis: 'metrics'
        },
        generic: {
            tone: 'balanced',
            verbs: ['managed', 'developed', 'implemented', 'coordinated', 'achieved', 'delivered'],
            format: 'standard',
            emphasis: 'mixed'
        }
    };
    
    return templates[industry] || templates.generic;
}

// ============================================
// REQUIREMENTS EXTRACTION
// ============================================
function extractRequirements(jdText) {
    const jdLower = jdText.toLowerCase();
    const requirements = {
        tools: [],
        experienceYears: null,
        softSkills: [],
        hardSkills: []
    };
    
    const toolPatterns = [
        { pattern: /adobe creative suite|photoshop|illustrator|premiere pro|after effects|indesign/gi, category: 'design' },
        { pattern: /\bexcel\b|\bpowerpoint\b|power bi|looker studio|google analytics|ga4|tableau/gi, category: 'analytics' },
        { pattern: /\bmeta\b|facebook ads?|instagram|tiktok|linkedin ads?|youtube/gi, category: 'social' },
        { pattern: /\bjira\b|trello|asana|monday\.com|confluence/gi, category: 'project' },
        { pattern: /canva|figma|sketch|adobe xd/gi, category: 'design' },
        { pattern: /google ads|meta ads|dv360|programmatic|tag manager/gi, category: 'marketing' }
    ];
    
    toolPatterns.forEach(({ pattern, category }) => {
        const matches = jdText.match(pattern) || [];
        matches.forEach(match => {
            requirements.tools.push({ name: match.trim(), category });
        });
    });
    
    const uniqueTools = [];
    const seen = new Set();
    requirements.tools.forEach(tool => {
        const key = tool.name.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            uniqueTools.push(tool);
        }
    });
    requirements.tools = uniqueTools;
    
    const expMatch = jdLower.match(/(\d+)\+?\s*(?:years?|anni?)[\s\w]*(?:experience|esperienza)/i);
    if (expMatch) {
        requirements.experienceYears = parseInt(expMatch[1]);
    }
    
    const hardSkillsPatterns = [
        { pattern: /media planning|media strategy|media buying/gi, skill: 'Media Planning' },
        { pattern: /budget management|budget allocation/gi, skill: 'Budget Management' },
        { pattern: /performance analysis|performance monitoring/gi, skill: 'Performance Analysis' },
        { pattern: /data analysis|data-driven/gi, skill: 'Data Analysis' },
        { pattern: /campaign optimization|campaign management/gi, skill: 'Campaign Optimization' }
    ];
    
    hardSkillsPatterns.forEach(({ pattern, skill }) => {
        if (pattern.test(jdText)) {
            requirements.hardSkills.push(skill);
        }
    });
    
    const softSkillsPatterns = [
        { pattern: /team\s*(?:work|collaboration)/gi, skill: 'Team Collaboration' },
        { pattern: /communication/gi, skill: 'Communication' },
        { pattern: /problem\s*solving/gi, skill: 'Problem Solving' },
        { pattern: /leadership/gi, skill: 'Leadership' }
    ];
    
    softSkillsPatterns.forEach(({ pattern, skill }) => {
        if (pattern.test(jdText)) {
            requirements.softSkills.push(skill);
        }
    });
    
    requirements.softSkills = [...new Set(requirements.softSkills)];
    requirements.hardSkills = [...new Set(requirements.hardSkills)];
    
    return requirements;
}

function calculateATSScore(documentText, jdKeywords) {
    const matches = [];
    const missing = [];
    
    jdKeywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw.word.replace(/\s+/g, '\\s+')}\\b`, 'i');
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

// ============================================
// COMPETITIVE ANALYSIS - FIXED
// ============================================
function generateCompetitiveAnalysis(cvProfile, jdRequirements) {
    const analysis = {
        experienceGap: 0,
        toolsCoverage: 0,
        industryFit: 0,
        overallCompetitiveness: 0,
        strengths: [],
        weaknesses: [],
        positioning: []
    };
    
    if (jdRequirements.experienceYears) {
        const ratio = cvProfile.yearsExp / jdRequirements.experienceYears;
        if (ratio >= 1.5) {
            analysis.experienceGap = 100;
            analysis.strengths.push(`Esperienza superiore (${cvProfile.yearsExp} anni vs ${jdRequirements.experienceYears} richiesti)`);
            analysis.positioning.push('Lead with seniority and proven track record');
        } else if (ratio >= 1) {
            analysis.experienceGap = 80;
            analysis.strengths.push(`Esperienza allineata (${cvProfile.yearsExp} anni)`);
        } else if (ratio >= 0.75) {
            analysis.experienceGap = 60;
            analysis.weaknesses.push(`Esperienza leggermente sotto (${cvProfile.yearsExp} anni vs ${jdRequirements.experienceYears} richiesti)`);
            analysis.positioning.push('Compensate with specific achievements and skills');
        } else {
            analysis.experienceGap = 40;
            analysis.weaknesses.push(`Gap esperienza significativo`);
            analysis.positioning.push('Highlight rapid learning and relevant projects');
        }
    } else {
        analysis.experienceGap = 70;
    }
    
    if (jdRequirements.tools && jdRequirements.tools.length > 0) {
        const matchedTools = jdRequirements.tools.filter(tool =>
            cvProfile.coreSkills.some(skill =>
                skill.toLowerCase().includes(tool.name.toLowerCase()) ||
                tool.name.toLowerCase().includes(skill.toLowerCase())
            )
        );
        
        analysis.toolsCoverage = Math.round((matchedTools.length / jdRequirements.tools.length) * 100);
        
        if (analysis.toolsCoverage >= 80) {
            analysis.strengths.push(`Ottima copertura tool (${analysis.toolsCoverage}%)`);
        } else if (analysis.toolsCoverage >= 60) {
            analysis.strengths.push(`Buona copertura tool (${analysis.toolsCoverage}%)`);
            const missingTools = jdRequirements.tools.filter(tool =>
                !matchedTools.some(m => m.name === tool.name)
            ).slice(0, 3);
            if (missingTools.length > 0) {
                analysis.weaknesses.push(`Tool da aggiungere: ${missingTools.map(t => t.name).join(', ')}`);
                analysis.positioning.push(`Mention transferable skills for ${missingTools[0].name}`);
            }
        } else {
            analysis.weaknesses.push(`Gap tool significativo (${analysis.toolsCoverage}%)`);
            analysis.positioning.push('Focus on core competencies and learning agility');
        }
    } else {
        analysis.toolsCoverage = 70;
    }
    
    analysis.industryFit = 75;
    if (cvProfile.industries && cvProfile.industries.length > 0) {
        analysis.strengths.push(`Esperienza industry: ${cvProfile.industries.join(', ')}`);
        analysis.positioning.push('Leverage industry-specific knowledge');
    }
    
    analysis.overallCompetitiveness = Math.round(
        (analysis.experienceGap * 0.3) +
        (analysis.toolsCoverage * 0.4) +
        (analysis.industryFit * 0.3)
    );
    
    return analysis;
}

function getCompetitivenessLevel(score) {
    if (score >= 85) return { level: 'VERY STRONG', color: '#28a745', icon: '🌟' };
    if (score >= 70) return { level: 'COMPETITIVE', color: '#667eea', icon: '✅' };
    if (score >= 55) return { level: 'MODERATE', color: '#ffa500', icon: '⚠️' };
    return { level: 'WEAK', color: '#d32f2f', icon: '❌' };
}

// ============================================
// PDF PARSING (Enhanced)
// ============================================
async function extractTextFromPDF(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    let text = '';
    let buffer = [];
    
    for (let i = 0; i < uint8Array.length; i++) {
        const byte = uint8Array[i];
        
        if (byte >= 32 && byte <= 126) {
            buffer.push(String.fromCharCode(byte));
        } else if (byte === 10 || byte === 13) {
            if (buffer.length > 0) {
                text += buffer.join('') + '\n';
                buffer = [];
            }
        } else if (byte === 32) {
            buffer.push(' ');
        } else if (byte >= 128 && byte <= 255) {
            const char = String.fromCharCode(byte);
            if (/[àèéìòù]/.test(char)) {
                buffer.push(char);
            }
        }
    }
    
    if (buffer.length > 0) {
        text += buffer.join('');
    }
    
    text = text.replace(/\x00/g, '');
    text = text.replace(/[^\x20-\x7E\n\r\tàèéìòù]/g, ' ');
    text = text.replace(/\s{3,}/g, '  ');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/([a-z])([A-Z])/g, '$1 $2');
    text = text.replace(/(\d)([A-Za-z])/g, '$1 $2');
    
    return text.trim();
}

// ============================================
// DETAILED CV SUGGESTIONS (Industry-Adapted)
// ============================================
function generateDetailedCVSuggestions(jdText, reqs, profileSkills, industry) {
    const template = getIndustryTemplate(industry);
    const suggestions = {
        workExperienceBullets: [],
        skillsToHighlight: [],
        skillsToAdd: [],
        atsKeywordChecklist: [],
        predictedScore: ''
    };
    
    const verb = template.verbs[0];
    
    if (/product/i.test(jdText)) {
        suggestions.workExperienceBullets.push(
            `${verb.charAt(0).toUpperCase() + verb.slice(1)} product launch strategies for new digital offerings across automotive and fashion clients`,
            `Conducted competitive analysis and market research to inform product roadmap decisions`,
            `Monitored post-launch KPIs using Power BI dashboards, implementing optimizations that resulted in 25% average improvement`
        );
    } else if (/media/i.test(jdText)) {
        suggestions.workExperienceBullets.push(
            `${template.verbs[0].charAt(0).toUpperCase() + template.verbs[0].slice(1)} end-to-end media strategies across Meta, Google, TikTok for international brands`,
            `${template.verbs[1].charAt(0).toUpperCase() + template.verbs[1].slice(1)} multi-million euro budgets, negotiating with agencies to optimize CPM and CPA`,
            `${template.verbs[2].charAt(0).toUpperCase() + template.verbs[2].slice(1)} integrated measurement framework using GA4 and Power BI`
        );
    } else {
        suggestions.workExperienceBullets.push(
            `${template.verbs[0].charAt(0).toUpperCase() + template.verbs[0].slice(1)} performance marketing campaigns, optimizing towards KPIs including ROAS`,
            `${template.verbs[3].charAt(0).toUpperCase() + template.verbs[3].slice(1)} in-depth analysis using GA4 and Power BI to identify optimization opportunities`,
            `${template.verbs[4].charAt(0).toUpperCase() + template.verbs[4].slice(1)} A/B testing strategies resulting in measurable improvements`
        );
    }
    
    const toolsInProfile = profileSkills.filter(skill => 
        reqs.tools.some(tool => 
            skill.toLowerCase().includes(tool.name.toLowerCase())
        )
    );
    
    if (toolsInProfile.length > 0) {
        suggestions.skillsToHighlight = toolsInProfile.slice(0, 6);
    }
    
    const missingTools = reqs.tools.filter(tool =>
        !profileSkills.some(skill =>
            skill.toLowerCase().includes(tool.name.toLowerCase())
        )
    );
    
    if (missingTools.length > 0) {
        suggestions.skillsToAdd = missingTools.slice(0, 5).map(tool => tool.name);
    }
    
    const keywordCategories = {
        'Role/Function': [],
        'Skills/Competencies': [],
        'Tools/Platforms': [],
        'Soft Skills': []
    };
    
    if (/digital marketing/i.test(jdText)) keywordCategories['Role/Function'].push('Digital marketing');
    if (/product.*management/i.test(jdText)) keywordCategories['Role/Function'].push('Product management');
    if (/media.*planning/i.test(jdText)) keywordCategories['Role/Function'].push('Media planning');
    
    if (reqs.hardSkills.length > 0) {
        keywordCategories['Skills/Competencies'] = reqs.hardSkills.slice(0, 5);
    }
    
    if (reqs.tools.length > 0) {
        keywordCategories['Tools/Platforms'] = reqs.tools.slice(0, 6).map(t => t.name);
    }
    
    if (reqs.softSkills.length > 0) {
        keywordCategories['Soft Skills'] = reqs.softSkills.slice(0, 4);
    }
    
    suggestions.atsKeywordChecklist = keywordCategories;
    
    const toolsMatch = reqs.tools.length > 0 
        ? (toolsInProfile.length / reqs.tools.length) * 100 
        : 100;
    
    if (toolsMatch >= 80) {
        suggestions.predictedScore = "75-85% (molto buono)";
    } else if (toolsMatch >= 60) {
        suggestions.predictedScore = "65-75% (buono)";
    } else {
        suggestions.predictedScore = "55-65% (medio)";
    }
    
    return suggestions;
}

function generateCVAboutSectionMartino(jdText) {
    const reqs = extractRequirements(jdText);
    
    const focusAreas = [];
    if (/media\s+(?:strategy|planning)/i.test(jdText)) focusAreas.push("media strategy and planning");
    if (/performance|roi|kpi/i.test(jdText)) focusAreas.push("performance analysis");
    if (/product/i.test(jdText)) focusAreas.push("product management");
    if (/data|analytics/i.test(jdText)) focusAreas.push("data analysis");
    
    if (focusAreas.length === 0) focusAreas.push("digital strategy", "campaign optimization");
    
    let about = `Digital Media Planner with over ${martinoProfile.yearsExp} years of experience in ${focusAreas.slice(0, 2).join(' and ')} for international brands. `;
    
    if (reqs.tools.length > 0) {
        const toolsToMention = reqs.tools.slice(0, 4).map(t => t.name).join(', ');
        about += `Proficient in ${toolsToMention}, `;
    }
    
    about += `specialized in optimizing omnichannel strategies and leveraging data-driven insights to improve marketing performance.`;
    
    return about.trim();
}

// Extract email from JD
function extractEmailFromJD(jdText) {
    const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = jdText.match(emailPattern);
    
    if (emails && emails.length > 0) {
        const corporateEmails = emails.filter(email => 
            !email.includes('gmail') && 
            !email.includes('yahoo') && 
            !email.includes('hotmail') &&
            !email.includes('outlook')
        );
        
        return corporateEmails[0] || null;
    }
    return null;
}
// Job Application System V4.1 - Part 3
// Cover Letter Generation - BILINGUAL (6 variants: IT + EN)

// ============================================
// COVER LETTER BILINGUE - 6 VARIANTS
// ============================================

function generateCoverLetterVariantsBilingual(jdText, company, role, location, profile, industry) {
    const reqs = extractRequirements(jdText);
    const template = getIndustryTemplate(industry);
    
    return {
        standard_it: generateStandardCoverLetterIT(jdText, company, role, location, profile, reqs),
        bold_it: generateBoldCoverLetterIT(jdText, company, role, location, profile, reqs, template),
        storytelling_it: generateStorytellingCoverLetterIT(jdText, company, role, location, profile, reqs),
        standard_en: generateStandardCoverLetterEN(jdText, company, role, location, profile, reqs),
        bold_en: generateBoldCoverLetterEN(jdText, company, role, location, profile, reqs, template),
        storytelling_en: generateStorytellingCoverLetterEN(jdText, company, role, location, profile, reqs)
    };
}

// ===== ITALIANO =====

function generateStandardCoverLetterIT(jdText, company, role, location, profile, reqs) {
    const isProduct = /product|prodotto|roadmap|launch/i.test(jdText);
    const isMedia = /media\s+(?:strategy|planning|buying)/i.test(jdText);
    
    let letter = `Oggetto: Candidatura per ${role} – ${location}

Gentile Team Selezione ${company},

desidero candidarmi per la posizione di ${role}. Con oltre ${profile.yearsExp} anni di esperienza in digital marketing e gestione di campagne per brand internazionali, ritengo di poter portare un contributo concreto al vostro team.`;
    
    if (isMedia) {
        letter += `

Nel mio ruolo attuale di ${profile.currentRole} presso ${profile.company}, gestisco strategie media end-to-end per brand come ${profile.brandsManaged.slice(0, 3).join(', ')}, coordinando agenzie media e partner digitali. Ho esperienza diretta nella pianificazione e acquisto media su piattaforme Meta, Google, TikTok e programmatic, con focus su ottimizzazione del ROI e analisi delle performance.`;
    } else if (isProduct) {
        letter += `

Nel mio ruolo attuale di ${profile.currentRole} presso ${profile.company}, mi occupo della definizione di strategie digitali annuali e del lancio di nuovi prodotti per clienti automotive, fashion e medical device. Ho esperienza diretta nell'analisi dei trend di mercato, nella collaborazione con team cross-funzionali (IT, Legal, Marketing) per portare prodotti digitali sul mercato.`;
    } else {
        letter += `

Nel mio ruolo attuale di ${profile.currentRole} presso ${profile.company}, gestisco strategie di advertising per brand come ${profile.brandsManaged.slice(0, 3).join(', ')}, con focus su ottimizzazione delle performance e analisi data-driven attraverso strumenti come Google Analytics 4, Power BI e Looker Studio.`;
    }
    
    letter += `

Un aspetto che mi differenzia è l'integrazione di competenze in AI applicata al marketing, certificate attraverso corsi specializzati (${profile.aiCertifications.slice(0, 2).join(', ')}). Sono motivato dalla possibilità di contribuire agli obiettivi di ${company} e mettere a disposizione un approccio analitico e orientato ai risultati.

Resto a disposizione per un colloquio conoscitivo.

Cordiali saluti,

${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}

function generateBoldCoverLetterIT(jdText, company, role, location, profile, reqs, template) {
    let letter = `Oggetto: ${role} – Risultati dal primo giorno

Buongiorno Team ${company},

Mi candido per la posizione di ${role}. Ecco cosa porto:

📊 I NUMERI:
• ${profile.yearsExp}+ anni gestendo campagne digitali per ${profile.brandsManaged.slice(0, 2).join(' & ')}
• +20% miglioramento medio ROI campagne attraverso ottimizzazione data-driven
• €2M+ budget media annuale gestito su Meta, Google, TikTok e programmatic

🎯 COSA FAREI PER VOI:`;
    
    if (/media/i.test(jdText)) {
        letter += `
• Costruire strategie media end-to-end allineate agli obiettivi business
• Ottimizzare campagne usando GA4, Power BI e dashboard custom
• Coordinare agenzie e partner per campagne integrate`;
    } else if (/product/i.test(jdText)) {
        letter += `
• Guidare lanci prodotto con team cross-funzionali (IT, Legal, Marketing)
• Usare analisi mercato e competitive intelligence per roadmap
• Tracciare KPI post-lancio e iterare basandosi su feedback utenti`;
    } else {
        letter += `
• Gestire campagne performance multi-canale con KPI chiari
• Implementare strategie A/B testing per massimizzare conversioni
• Presentare insight agli stakeholder con data visualization`;
    }
    
    letter += `

💡 IL MIO VANTAGGIO:
Approccio marketing AI-powered (certificato da Fastweb Digital Academy) applicato a progetti reali inclusi sviluppo web e tool automazione.

Mi piacerebbe discutere come la mia esperienza con ${profile.brandsManaged[0]} e ${profile.brandsManaged[1]} si traduce in risultati per ${company}.

Disponibile per una call.

Cordiali saluti,
${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}

function generateStorytellingCoverLetterIT(jdText, company, role, location, profile, reqs) {
    let letter = `Oggetto: Candidatura per ${role} – ${company}

Gentile Team ${company},

Quando ho iniziato a lavorare sulle campagne digitali Honda ${profile.yearsExp} anni fa, ho capito subito che il grande marketing non riguarda solo piattaforme e metriche—riguarda comprendere le persone e creare connessioni significative su larga scala.

Questa intuizione ha plasmato la mia carriera. Oggi, come ${profile.currentRole} presso ${profile.company}, combino il rigore analitico delle decisioni data-driven con il pensiero creativo necessario per emergere nel rumore.

Per ${company}, vedo un'opportunità per portare lo stesso approccio nel ruolo di ${role}. `;
    
    if (/product/i.test(jdText)) {
        letter += `Il vostro focus sull'innovazione di prodotto risuona con la mia esperienza nel lanciare offerte digitali in automotive e fashion—progetti dove precisione tecnica incontra storytelling creativo per generare impatto business reale.`;
    } else if (/media/i.test(jdText)) {
        letter += `Il vostro approccio integrato ai media si allinea perfettamente con come ho gestito campagne su Meta, Google, TikTok e programmatic—sempre cercando le sinergie che fanno 1+1=3.`;
    } else {
        letter += `Il vostro impegno verso l'eccellenza data-driven corrisponde al mio: credo che i migliori insight derivino dalla combinazione di analisi quantitativa e comprensione qualitativa del mercato.`;
    }
    
    letter += `

Cosa mi distingue? Oltre ai ${profile.yearsExp} anni di esperienza e al toolkit tecnico (${profile.coreSkills.slice(0, 4).join(', ')}), porto genuina curiosità verso le tecnologie emergenti. Le mie certificazioni AI non sono solo righe sul CV—sono strumenti che uso attivamente per risolvere problemi più efficientemente.

Sarei felice di discutere come il mio background potrebbe contribuire agli obiettivi di ${company}.

In attesa di connetterci,

${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}

// ===== ENGLISH =====

function generateStandardCoverLetterEN(jdText, company, role, location, profile, reqs) {
    const isProduct = /product|roadmap|launch/i.test(jdText);
    const isMedia = /media\s+(?:strategy|planning|buying)/i.test(jdText);
    
    let letter = `Subject: Application for ${role} – ${location}

Dear ${company} Hiring Team,

I am writing to apply for the ${role} position. With over ${profile.yearsExp} years of experience in digital marketing and campaign management for international brands, I believe I can make a meaningful contribution to your team.`;
    
    if (isMedia) {
        letter += `

In my current role as ${profile.currentRole} at ${profile.company}, I manage end-to-end media strategies for brands including ${profile.brandsManaged.slice(0, 3).join(', ')}, coordinating with media agencies and digital partners. I have hands-on experience in media planning and buying across Meta, Google, TikTok, and programmatic platforms, with a focus on ROI optimization and performance analysis.`;
    } else if (isProduct) {
        letter += `

In my current role as ${profile.currentRole} at ${profile.company}, I define annual digital strategies and lead product launches for automotive, fashion, and medical device clients. I have direct experience in market trend analysis and cross-functional collaboration (IT, Legal, Marketing) to bring digital products to market.`;
    } else {
        letter += `

In my current role as ${profile.currentRole} at ${profile.company}, I manage advertising strategies for brands like ${profile.brandsManaged.slice(0, 3).join(', ')}, focusing on performance optimization and data-driven analysis through tools like Google Analytics 4, Power BI, and Looker Studio.`;
    }
    
    letter += `

What sets me apart is my integration of AI skills into marketing, certified through specialized courses (${profile.aiCertifications.slice(0, 2).join(', ')}). I'm motivated by the opportunity to contribute to ${company}'s objectives with an analytical, results-oriented approach.

I would welcome the chance to discuss this opportunity further.

Best regards,

${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}

function generateBoldCoverLetterEN(jdText, company, role, location, profile, reqs, template) {
    let letter = `Subject: ${role} – Delivering Results from Day One

Hi ${company} Team,

I'm reaching out about the ${role} position. Here's what I bring:

📊 THE NUMBERS:
• ${profile.yearsExp}+ years managing digital campaigns for ${profile.brandsManaged.slice(0, 2).join(' & ')}
• 20%+ average improvement in campaign ROI through data-driven optimization
• €2M+ in annual media budget managed across Meta, Google, TikTok, and programmatic

🎯 WHAT I'D DO FOR YOU:`;
    
    if (/media/i.test(jdText)) {
        letter += `
• Build end-to-end media strategies aligned with business goals
• Optimize campaigns using GA4, Power BI, and custom dashboards
• Coordinate agencies and partners to deliver integrated campaigns`;
    } else if (/product/i.test(jdText)) {
        letter += `
• Lead product launches with cross-functional teams (IT, Legal, Marketing)
• Use market analysis and competitive intelligence to inform roadmap
• Track post-launch KPIs and iterate based on user feedback`;
    } else {
        letter += `
• Run performance campaigns across channels with clear KPIs
• Implement A/B testing strategies to maximize conversion rates
• Present insights to stakeholders using data visualization tools`;
    }
    
    letter += `

💡 MY EDGE:
AI-powered marketing approach (certified by Fastweb Digital Academy) applied to real projects including web development and automation tools.

I'd love to discuss how my experience with ${profile.brandsManaged[0]} and ${profile.brandsManaged[1]} translates to driving results for ${company}.

Available for a chat anytime.

Best,
${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}

function generateStorytellingCoverLetterEN(jdText, company, role, location, profile, reqs) {
    let letter = `Subject: Application for ${role} – ${company}

Dear ${company} Team,

When I first started working on Honda's digital campaigns ${profile.yearsExp} years ago, I quickly learned that great marketing isn't just about platforms and metrics—it's about understanding people and creating meaningful connections at scale.

That realization has shaped my career. Today, as a ${profile.currentRole} at ${profile.company}, I combine the analytical rigor of data-driven decision making with the creative thinking needed to break through the noise.

For ${company}, I see an opportunity to bring this same approach to ${role}. `;
    
    if (/product/i.test(jdText)) {
        letter += `Your focus on product innovation resonates with my experience launching digital offerings across automotive and fashion—projects where technical precision met creative storytelling to deliver real business impact.`;
    } else if (/media/i.test(jdText)) {
        letter += `Your integrated media approach aligns perfectly with how I've managed campaigns across Meta, Google, TikTok, and programmatic channels—always looking for the synergies that make 1+1=3.`;
    } else {
        letter += `Your commitment to data-driven excellence matches my own: I believe the best insights come from combining quantitative analysis with qualitative understanding of the market.`;
    }
    
    letter += `

What sets me apart? Beyond the ${profile.yearsExp} years of experience and the technical toolkit (${profile.coreSkills.slice(0, 4).join(', ')}), I bring genuine curiosity about emerging technologies. My AI certifications aren't just lines on a resume—they're tools I actively use to solve problems more efficiently.

I'd welcome the chance to discuss how my background could contribute to ${company}'s goals.

Looking forward to connecting,

${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}
// Job Application System V4.1 - Part 4
// Email System (Mailto Fixed), Document Generation, Display Functions

// ============================================
// EMAIL PREVIEW & SEND - MAILTO VERSION (FIXED)
// ============================================

async function previewEmail(analysisId, company, role) {
    const recipientEmail = document.getElementById('recipientEmail').value.trim();
    const coverLetter = document.getElementById('editableCoverLetter').value.trim();
    
    if (!recipientEmail || !coverLetter) {
        alert('⚠️ Campi obbligatori: Email destinatario e Cover Letter');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
        alert('⚠️ Formato email non valido');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'emailPreviewModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px; position: relative;">
            <button onclick="document.getElementById('emailPreviewModal').remove()" 
                    style="position: absolute; top: 15px; right: 15px; border: none; background: #f5f5f5; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
            
            <h2 style="margin: 0 0 20px 0;">📧 Preview Email</h2>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ff9800;">
                <p style="margin: 0; font-size: 13px;">
                    <strong>💡 Come funziona:</strong><br>
                    1. Si aprirà Gmail con email pre-compilata<br>
                    2. Aggiungi manualmente CV e Portfolio<br>
                    3. Verifica e invia<br>
                    4. Installa <a href="https://mailtrack.io" target="_blank" style="color: #667eea;">Mailtrack</a> per tracking aperture
                </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 5px 0;"><strong>Da:</strong> martino.cicerani@gmail.com (Gmail nativo)</p>
                <p style="margin: 5px 0;"><strong>A:</strong> ${recipientEmail}</p>
                <p style="margin: 5px 0;"><strong>Oggetto:</strong> Candidatura ${role} - Martino Cicerani</p>
                <p style="margin: 5px 0;"><strong>Allegati:</strong> Da aggiungere manualmente in Gmail</p>
            </div>
            
            <div style="border: 2px solid #ddd; padding: 20px; border-radius: 8px; background: white; max-height: 400px; overflow-y: auto;">
                <pre style="white-space: pre-wrap; font-family: Arial; font-size: 13px; margin: 0; line-height: 1.6;">${coverLetter}</pre>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button id="confirmSendEmailBtn" 
                        class="primary" 
                        style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600;">
                    📧 Apri in Gmail
                </button>
                <button onclick="document.getElementById('emailPreviewModal').remove()" 
                        class="secondary" 
                        style="flex: 1; padding: 12px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 15px;">
                    ✏️ Modifica
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('confirmSendEmailBtn').addEventListener('click', () => {
        approveAndSendEmail(analysisId, recipientEmail, coverLetter, role);
    });
}

async function approveAndSendEmail(analysisId, recipientEmail, coverLetter, role) {
    const modal = document.getElementById('emailPreviewModal');
    if (modal) modal.remove();
    
    try {
        const result = await sendApplicationEmail({
            analysisId,
            recipientEmail,
            coverLetter,
            role: role
        });
        
        if (result.success) {
            showSuccessModal(`✅ Gmail aperto con email pre-compilata!

Prossimi step:
1. Allega CV manualmente
2. Allega Portfolio (se necessario)
3. Verifica email e invia

💡 Se hai Mailtrack installato, riceverai notifica quando l'email viene aperta.

📊 Ricordati di aggiornare il risultato entro 15 giorni.`);
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        alert('❌ Errore apertura Gmail: ' + error.message);
        console.error(error);
    }
}

async function sendApplicationEmail(emailData) {
    try {
        const subject = encodeURIComponent(`Candidatura ${emailData.role} - Martino Cicerani`);
        const body = encodeURIComponent(emailData.coverLetter);
        const mailto = `mailto:${emailData.recipientEmail}?subject=${subject}&body=${body}`;
        
        const gmailWindow = window.open(mailto, '_blank');
        
        if (!gmailWindow || gmailWindow.closed || typeof gmailWindow.closed === 'undefined') {
            throw new Error('Popup bloccato. Abilita i popup per questo sito.');
        }
        
        StorageManager.markAsSent(emailData.analysisId, {
            recipientEmail: emailData.recipientEmail,
            attachments: ['CV e Portfolio da allegare manualmente'],
            sentAt: new Date().toISOString()
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Send email error:', error);
        return { success: false, error: error.message };
    }
}

function showSuccessModal(message) {
    const modal = document.createElement('div');
    modal.id = 'successModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; max-width: 500px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
            <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
            <pre style="white-space: pre-wrap; font-family: Arial; font-size: 14px; text-align: left; line-height: 1.8; margin: 0;">${message}</pre>
            <button onclick="document.getElementById('successModal').remove()" 
                    class="primary" 
                    style="margin-top: 30px; padding: 12px 40px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600;">
                OK
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

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
// MARTINO SECTION - GENERATE & DISPLAY
// ============================================
function generateDocumentsMartino() {
    const company = document.getElementById('company').value.trim();
    const role = document.getElementById('role').value.trim();
    const location = document.getElementById('location').value.trim() || 'Roma';
    const jd = document.getElementById('jd').value.trim();
    
    if (!company || !role || !jd) {
        alert('Compila tutti i campi obbligatori (*)');
        return;
    }
    
    document.getElementById('loading-martino').classList.add('show');
    document.getElementById('results-martino').classList.remove('show');
    
    setTimeout(async () => {
        const industry = detectIndustry(jd);
        const keywords = await extractKeywordsAdvanced(jd, 15);
        const reqs = extractRequirements(jd);
        
        const variants = generateCoverLetterVariantsBilingual(jd, company, role, location, martinoProfile, industry);
        const aboutMe = generateCVAboutSectionMartino(jd);
        const detailedSuggestions = generateDetailedCVSuggestions(jd, reqs, martinoProfile.coreSkills, industry);
        const competitiveAnalysis = generateCompetitiveAnalysis(martinoProfile, reqs);
        
        const combinedText = variants.standard_it + ' ' + aboutMe;
        const atsScore = calculateATSScore(combinedText, keywords);
        
        const results = {
            atsScore,
            coverLetter: variants.standard_it,
            aboutMe,
            detailedSuggestions,
            keywords,
            variants,
            competitiveAnalysis,
            industry,
            selectedStyle: 'standard_it'
        };
        
        currentAnalysisResults = results;
        const analysisId = StorageManager.saveAnalysis(company, role, results, 'martino');
        
        displayResultsMartino(atsScore, variants.standard_it, aboutMe, detailedSuggestions, company, role, keywords, variants, competitiveAnalysis, industry, analysisId);
        
        document.getElementById('loading-martino').classList.remove('show');
        document.getElementById('results-martino').classList.add('show');
        document.getElementById('results-martino').scrollIntoView({ behavior: 'smooth' });
    }, 15000);
}

function displayResultsMartino(atsScore, coverLetter, aboutMe, detailedSuggestions, company, role, keywords, variants, competitiveAnalysis, industry, analysisId) {
    let interpretation = '';
    if (atsScore.score >= 70) interpretation = '✅ Ottimo match! Alta probabilità di passare i filtri ATS';
    else if (atsScore.score >= 50) interpretation = '⚠️ Buon match, considera di aggiungere keyword mancanti';
    else interpretation = '❌ Match basso. Rivedi i documenti';
    
    const compLevel = getCompetitivenessLevel(competitiveAnalysis.overallCompetitiveness);
    
    const detectedEmail = extractEmailFromJD(document.getElementById('jd').value);
    
    const resultsHTML = `
        <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0;">📊 Analisi Salvata</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Industry: ${industry.toUpperCase()} | ${new Date().toLocaleDateString('it-IT')}</p>
                </div>
                <button onclick="showHistory()" class="copy-btn" style="background: white; color: #667eea;">📋 Cronologia</button>
            </div>
        </div>
        
        <div class="card">
            <h3 style="color: #667eea;">${compLevel.icon} COMPETITIVE ANALYSIS</h3>
            <div style="background: linear-gradient(135deg, ${compLevel.color}22, ${compLevel.color}11); padding: 20px; border-radius: 8px; border-left: 4px solid ${compLevel.color};">
                <h4 style="color: ${compLevel.color}; margin: 0 0 15px 0;">Overall: ${competitiveAnalysis.overallCompetitiveness}% - ${compLevel.level}</h4>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: ${compLevel.color};">${competitiveAnalysis.experienceGap}%</div>
                        <div style="font-size: 12px; color: #666;">Experience Match</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: ${compLevel.color};">${competitiveAnalysis.toolsCoverage}%</div>
                        <div style="font-size: 12px; color: #666;">Tools Coverage</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: ${compLevel.color};">${competitiveAnalysis.industryFit}%</div>
                        <div style="font-size: 12px; color: #666;">Industry Fit</div>
                    </div>
                </div>
                
                ${competitiveAnalysis.strengths.length > 0 ? `
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #28a745;">✅ Strengths:</p>
                        <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                            ${competitiveAnalysis.strengths.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${competitiveAnalysis.weaknesses.length > 0 ? `
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #ff9800;">⚠️ Areas to Address:</p>
                        <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                            ${competitiveAnalysis.weaknesses.map(w => `<li>${w}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <div>
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #667eea;">🎯 Positioning:</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                        ${competitiveAnalysis.positioning.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
        
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
            <h3 style="margin-bottom: 15px;">📄 Cover Letter - Scegli Stile & Lingua</h3>
            <div style="margin-bottom: 20px;">
                <select id="coverLetterStyle" onchange="switchCoverLetterVariant()" style="width: 100%; padding: 10px; border: 2px solid #667eea; border-radius: 8px; font-size: 14px;">
                    <option value="standard_it">🇮🇹 Standard (Corporate/Finance)</option>
                    <option value="bold_it">🇮🇹 Bold (Startup/Tech)</option>
                    <option value="storytelling_it">🇮🇹 Storytelling (Creative)</option>
                    <option value="standard_en">🇬🇧 Standard (Corporate/Finance)</option>
                    <option value="bold_en">🇬🇧 Bold (Startup/Tech)</option>
                    <option value="storytelling_en">🇬🇧 Storytelling (Creative)</option>
                </select>
            </div>
            <div class="document-output">
                <textarea id="editableCoverLetter" rows="20" style="width: 100%; padding: 10px; font-family: monospace; font-size: 13px; border: 2px solid #ddd; border-radius: 8px;">${variants.standard_it}</textarea>
                <small style="color: #666;">💡 Modifica la cover letter secondo i suggerimenti prima di inviare</small>
                <div class="download-section" style="margin-top: 15px;">
                    <button class="copy-btn" onclick="copyToClipboard('editableCoverLetter')">📋 Copia</button>
                    <button class="download-btn" onclick="downloadCoverLetter()">📥 Download DOCX</button>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="document-output">
                <h3>👤 About Me CV</h3>
                <pre id="aboutMeOutput">${aboutMe}</pre>
                <button class="copy-btn" onclick="copyToClipboard('aboutMeOutput')">📋 Copia</button>
            </div>
        </div>
        
        <div class="card">
            <h3>💡 Suggerimenti CV (${industry.toUpperCase()} style)</h3>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                <h4 style="color: #667eea; margin: 0 0 15px 0;">👔 WORK EXPERIENCE:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    ${detailedSuggestions.workExperienceBullets.map(bullet => 
                        `<li style="margin-bottom: 10px; font-size: 13px; line-height: 1.6;">${bullet}</li>`
                    ).join('')}
                </ul>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
                <h4 style="color: #28a745; margin: 0 0 15px 0;">🔧 SKILLS:</h4>
                ${detailedSuggestions.skillsToHighlight.length > 0 ? `
                    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Evidenzia:</strong></p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">
                        ${detailedSuggestions.skillsToHighlight.map(skill => 
                            `<span style="background: #d4edda; color: #155724; padding: 6px 12px; border-radius: 4px; font-size: 12px;">${skill}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                ${detailedSuggestions.skillsToAdd.length > 0 ? `
                    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>⚠️ Aggiungi:</strong></p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${detailedSuggestions.skillsToAdd.map(skill => 
                            `<span style="background: #fff3cd; color: #856404; padding: 6px 12px; border-radius: 4px; font-size: 12px;">${skill}</span>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50;">
                <h4 style="color: #2e7d32; margin: 0 0 15px 0;">✅ ATS Keyword Checklist</h4>
                ${Object.entries(detailedSuggestions.atsKeywordChecklist).map(([category, items]) => 
                    items.length > 0 ? `
                        <div style="margin-bottom: 12px;">
                            <p style="margin: 0 0 6px 0; font-weight: 600; font-size: 12px;">✓ ${category}:</p>
                            <p style="margin: 0; font-size: 12px; line-height: 1.6;">${items.join(', ')}</p>
                        </div>
                    ` : ''
                ).join('')}
            </div>
        </div>
        
        <div class="card" id="emailSection">
            <h3>📧 Invia Candidatura via Email</h3>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ff9800;">
                <p style="margin: 0; font-size: 13px;">
                    <strong>⚠️ Prima di inviare:</strong> Modifica la cover letter sopra secondo i suggerimenti, 
                    aggiorna il tuo CV e preparalo per l'upload.
                </p>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="font-weight: 600; margin-bottom: 8px; display: block;">Email Destinatario *</label>
                <input type="email" id="recipientEmail" 
                       value="${detectedEmail || ''}"
                       placeholder="es: jobs@company.com, hr@company.com" 
                       style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                ${detectedEmail ? '<small style="color: #28a745;">✅ Email rilevata automaticamente dalla JD</small>' : '<small style="color: #666;">Cerca l\'email su LinkedIn o sito aziendale se non presente nella JD</small>'}
            </div>
            
            <button id="previewEmailBtn" 
                    class="primary" 
                    style="width: 100%; padding: 15px; font-size: 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                👁️ Preview & Invia Email
            </button>
        </div>
    `;
    
    document.getElementById('results-martino').innerHTML = resultsHTML;
    
    window.currentCoverLetterVariants = variants;
    window.currentCompany = company;
    window.currentRole = role;
    
    const emailBtn = document.getElementById('previewEmailBtn');
    if (emailBtn) {
        emailBtn.addEventListener('click', () => {
            previewEmail(analysisId, company, role);
        });
    }
}

function switchCoverLetterVariant() {
    const style = document.getElementById('coverLetterStyle').value;
    const variants = window.currentCoverLetterVariants;
    
    const selectedLetter = variants[style] || variants.standard_it;
    
    document.getElementById('editableCoverLetter').value = selectedLetter;
    
    if (currentAnalysisResults) {
        currentAnalysisResults.selectedStyle = style;
    }
}
// Job Application System V4.1 - Part 5
// History, Feedback System, Export/Import, Generic CV Functions, Utilities

// ============================================
// HISTORY & FEEDBACK MANAGEMENT
// ============================================

function showHistory() {
    const history = StorageManager.getHistory();
    
    if (history.length === 0) {
        alert('Nessuna analisi salvata');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'historyModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    const statusBadge = (status) => {
        const badges = {
            'draft': '📝 Bozza',
            'sent': '📤 Inviata',
            'pending': '⏳ In attesa',
            'auto-ghosted': '👻 Auto-ghosted',
            'completed': '✅ Completed'
        };
        const colors = {
            'draft': '#6c757d',
            'sent': '#667eea',
            'pending': '#ffc107',
            'auto-ghosted': '#dc3545',
            'completed': '#28a745'
        };
        return `<span style="background: ${colors[status]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${badges[status]}</span>`;
    };
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px; position: relative;">
            <button onclick="document.getElementById('historyModal').remove()" 
                    style="position: absolute; top: 15px; right: 15px; border: none; background: #f5f5f5; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
            
            <h2 style="margin: 0 0 20px 0;">📋 Cronologia Candidature (${history.length})</h2>
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button onclick="StorageManager.exportData()" class="primary" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    📤 Esporta Dati
                </button>
                <button onclick="showImportDialog()" class="secondary" style="padding: 10px 20px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    📥 Importa Dati
                </button>
                <button onclick="showLearningStats()" class="secondary" style="padding: 10px 20px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    📊 Statistiche
                </button>
            </div>
            
            <div style="display: grid; gap: 15px;">
                ${history.map(entry => `
                    <div style="border: 2px solid #e0e0e0; padding: 15px; border-radius: 8px; background: #fafafa;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                            <div>
                                <h4 style="margin: 0 0 5px 0; color: #333;">${entry.company} - ${entry.role}</h4>
                                <small style="color: #666;">${new Date(entry.date).toLocaleDateString('it-IT')} | ATS: ${entry.atsScore}%${entry.emailSent ? ` | Inviata a: ${entry.recipientEmail}` : ''}</small>
                            </div>
                            ${statusBadge(entry.status)}
                        </div>
                        
                        ${entry.feedbackCompleted ? `
                            <div style="background: #e8f5e9; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 13px;">
                                <strong>Outcome:</strong> ${entry.outcome} ${entry.interviewType ? `(${entry.interviewType})` : ''}<br>
                                <strong>Response time:</strong> ${entry.responseTime} giorni<br>
                                ${entry.feedbackNotes ? `<strong>Note:</strong> ${entry.feedbackNotes}` : ''}
                            </div>
                        ` : entry.status === 'sent' || entry.status === 'auto-ghosted' ? `
                            <div style="margin-top: 10px;">
                                <button onclick="showFeedbackForm(${entry.id})" class="secondary" style="padding: 8px 15px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                                    📊 Aggiungi Feedback
                                </button>
                            </div>
                        ` : ''}
                        
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <button onclick="reloadAnalysis(${entry.id})" class="secondary" style="flex: 1; padding: 8px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 13px;">
                                📂 Ricarica
                            </button>
                            <button onclick="deleteAnalysis(${entry.id})" class="secondary" style="flex: 1; padding: 8px; background: #fff; border: 1px solid #dc3545; color: #dc3545; border-radius: 6px; cursor: pointer; font-size: 13px;">
                                🗑️ Elimina
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function reloadAnalysis(id) {
    const entry = StorageManager.getAnalysis(id);
    if (!entry) {
        alert('Analisi non trovata');
        return;
    }
    
    document.getElementById('company').value = entry.company;
    document.getElementById('role').value = entry.role;
    
    if (entry.fullResults) {
        currentAnalysisResults = entry.fullResults;
        
        const results = entry.fullResults;
        displayResultsMartino(
            results.atsScore,
            results.coverLetter,
            results.aboutMe,
            results.detailedSuggestions,
            entry.company,
            entry.role,
            results.keywords,
            results.variants,
            results.competitiveAnalysis,
            results.industry,
            id
        );
        
        switchTab('martino');
        document.getElementById('results-martino').classList.add('show');
        document.getElementById('results-martino').scrollIntoView({ behavior: 'smooth' });
    }
    
    const modal = document.getElementById('historyModal');
    if (modal) modal.remove();
}

function deleteAnalysis(id) {
    if (confirm('Eliminare questa analisi?')) {
        StorageManager.deleteAnalysis(id);
        showHistory();
    }
}

function showFeedbackForm(id) {
    const entry = StorageManager.getAnalysis(id);
    if (!entry) return;
    
    const modal = document.createElement('div');
    modal.id = 'feedbackModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 500px; width: 100%; padding: 30px; position: relative;">
            <button onclick="document.getElementById('feedbackModal').remove()" 
                    style="position: absolute; top: 15px; right: 15px; border: none; background: #f5f5f5; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
            
            <h3 style="margin: 0 0 20px 0;">📊 Feedback - ${entry.company}</h3>
            
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Outcome *</label>
                <select id="feedbackOutcome" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    <option value="">-- Seleziona --</option>
                    <option value="interview">✅ Colloquio fissato</option>
                    <option value="rejection">❌ Rifiutato</option>
                    <option value="ghosted">👻 Nessuna risposta (ghosting)</option>
                </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Giorni di risposta</label>
                <input type="number" id="feedbackResponseTime" placeholder="es: 7" min="0" max="90" 
                       style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
            </div>
            
            <div class="form-group" id="interviewTypeContainer" style="margin-bottom: 15px; display: none;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Tipo colloquio</label>
                <select id="feedbackInterviewType" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    <option value="">-- Seleziona --</option>
                    <option value="phone">📞 Telefonico</option>
                    <option value="video">📹 Video call</option>
                    <option value="in-person">🏢 Di persona</option>
                    <option value="technical">💻 Tecnico</option>
                </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Note</label>
                <textarea id="feedbackNotes" rows="3" placeholder="Eventuali note..." 
                          style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;"></textarea>
            </div>
            
            <button onclick="submitFeedback(${id})" class="primary" style="width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600;">
                💾 Salva Feedback
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('feedbackOutcome').addEventListener('change', (e) => {
        const container = document.getElementById('interviewTypeContainer');
        if (e.target.value === 'interview') {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    });
}

function submitFeedback(id) {
    const outcome = document.getElementById('feedbackOutcome').value;
    const responseTime = parseInt(document.getElementById('feedbackResponseTime').value) || 0;
    const interviewType = document.getElementById('feedbackInterviewType').value;
    const notes = document.getElementById('feedbackNotes').value;
    
    if (!outcome) {
        alert('Seleziona un outcome');
        return;
    }
    
    const feedbackData = {
        outcome,
        responseTime,
        interviewType: outcome === 'interview' ? interviewType : null,
        feedbackNotes: notes
    };
    
    StorageManager.updateFeedback(id, feedbackData);
    
    const modal = document.getElementById('feedbackModal');
    if (modal) modal.remove();
    
    showHistory();
}

function showFeedbackReminder(app) {
    const banner = document.createElement('div');
    banner.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #fff3cd; border: 2px solid #ff9800; border-radius: 8px; padding: 15px; max-width: 350px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);';
    banner.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #856404;">⏰ Reminder Feedback</h4>
        <p style="margin: 0 0 10px 0; font-size: 13px;">Sono passati 15 giorni dalla candidatura a <strong>${app.company}</strong>. Aggiungi feedback!</p>
        <button onclick="showFeedbackForm(${app.id}); this.parentElement.remove();" style="width: 100%; padding: 8px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; margin-bottom: 5px;">
            📊 Aggiungi Ora
        </button>
        <button onclick="this.parentElement.remove();" style="width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 13px;">
            Ricordamelo dopo
        </button>
    `;
    document.body.appendChild(banner);
    
    setTimeout(() => banner.remove(), 15000);
}

// ============================================
// LEARNING STATS DISPLAY
// ============================================

function showLearningStats() {
    const learning = StorageManager.getLearningData();
    
    const modal = document.createElement('div');
    modal.id = 'statsModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    let industryStatsHTML = '<p style="color: #666;">Nessun dato disponibile</p>';
    if (Object.keys(learning.industryStats).length > 0) {
        industryStatsHTML = Object.entries(learning.industryStats).map(([industry, stats]) => {
            const successRate = stats.applications > 0 ? Math.round((stats.interviews / stats.applications) * 100) : 0;
            return `
                <div style="border: 2px solid #e0e0e0; padding: 15px; border-radius: 8px; background: #fafafa; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 10px 0; color: #667eea; text-transform: capitalize;">${industry}</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 13px;">
                        <div>
                            <strong>Applications:</strong> ${stats.applications}
                        </div>
                        <div>
                            <strong>Interviews:</strong> ${stats.interviews}
                        </div>
                        <div>
                            <strong>Success Rate:</strong> ${successRate}%
                        </div>
                    </div>
                    <div style="margin-top: 10px; font-size: 13px;">
                        <strong>Avg ATS Score:</strong> ${stats.avgAtsScore}%
                    </div>
                </div>
            `;
        }).join('');
    }
    
    let styleStatsHTML = '<p style="color: #666;">Nessun dato disponibile</p>';
    if (Object.keys(learning.styleEffectiveness).length > 0) {
        styleStatsHTML = Object.entries(learning.styleEffectiveness).map(([style, stats]) => {
            const styleNames = {
                'standard_it': '🇮🇹 Standard',
                'bold_it': '🇮🇹 Bold',
                'storytelling_it': '🇮🇹 Storytelling',
                'standard_en': '🇬🇧 Standard',
                'bold_en': '🇬🇧 Bold',
                'storytelling_en': '🇬🇧 Storytelling'
            };
            return `
                <div style="border: 2px solid #e0e0e0; padding: 12px; border-radius: 8px; background: #fafafa; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: #333;">${styleNames[style] || style}</strong>
                        <span style="background: ${stats.successRate >= 50 ? '#28a745' : '#ffc107'}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                            ${stats.successRate}% success
                        </span>
                    </div>
                    <div style="margin-top: 8px; font-size: 12px; color: #666;">
                        Used: ${stats.used}x | Interviews: ${stats.interviews}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px; position: relative;">
            <button onclick="document.getElementById('statsModal').remove()" 
                    style="position: absolute; top: 15px; right: 15px; border: none; background: #f5f5f5; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
            
            <h2 style="margin: 0 0 20px 0;">📊 Learning Statistics</h2>
            
            <div style="margin-bottom: 30px;">
                <h3 style="color: #667eea; margin-bottom: 15px;">📈 Industry Performance</h3>
                ${industryStatsHTML}
            </div>
            
            <div>
                <h3 style="color: #667eea; margin-bottom: 15px;">✍️ Cover Letter Style Effectiveness</h3>
                ${styleStatsHTML}
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #2196f3;">
                <p style="margin: 0; font-size: 13px; color: #0d47a1;">
                    💡 <strong>Tip:</strong> Usa questi dati per ottimizzare la tua strategia di candidatura. 
                    Focus sulle industry con migliori success rate e usa gli stili cover letter più efficaci.
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ============================================
// EXPORT/IMPORT HELPERS
// ============================================

function showExportInstructions() {
    const modal = document.createElement('div');
    modal.id = 'exportInstructionsModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
            <h3 style="margin: 0 0 15px 0; color: #667eea;">✅ Backup Salvato!</h3>
            <p style="margin: 0 0 15px 0; font-size: 14px;">Il file JSON è stato scaricato sul tuo computer.</p>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2196f3;">
                <h4 style="margin: 0 0 10px 0; color: #0d47a1;">📂 Carica su Google Drive:</h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
                    <li>Vai su <a href="https://drive.google.com" target="_blank" style="color: #2196f3;">drive.google.com</a></li>
                    <li>Click "Nuovo" → "Caricamento file"</li>
                    <li>Seleziona il file JSON appena scaricato</li>
                    <li>Il file sarà disponibile su tutti i tuoi dispositivi</li>
                </ol>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                <p style="margin: 0; font-size: 13px; color: #856404;">
                    💡 <strong>Tip:</strong> Fai backup regolari (ogni 10 candidature) per non perdere i tuoi dati.
                </p>
            </div>
            
            <button onclick="document.getElementById('exportInstructionsModal').remove()" 
                    class="primary" 
                    style="margin-top: 20px; width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px;">
                OK, Capito!
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function showImportDialog() {
    const modal = document.createElement('div');
    modal.id = 'importModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10001; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 500px; width: 100%; padding: 30px; position: relative;">
            <button onclick="document.getElementById('importModal').remove()" 
                    style="position: absolute; top: 15px; right: 15px; border: none; background: #f5f5f5; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
            
            <h3 style="margin: 0 0 20px 0;">📥 Importa Dati</h3>
            
            <div style="border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; background: #f8f9fa; margin-bottom: 15px;" 
                 id="dropZone"
                 ondragover="event.preventDefault(); this.style.background='#e3f2fd';"
                 ondragleave="this.style.background='#f8f9fa';"
                 ondrop="handleFileDrop(event)">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">📁 Trascina il file JSON qui</p>
                <p style="margin: 0; font-size: 12px; color: #999;">oppure</p>
                <input type="file" id="importFileInput" accept=".json" style="display: none;" onchange="handleFileSelect(event)">
                <button onclick="document.getElementById('importFileInput').click()" 
                        style="margin-top: 10px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                    Seleziona File
                </button>
            </div>
            
            <div style="background: #fff3cd; padding: 12px; border-radius: 8px; border-left: 4px solid #ff9800;">
                <p style="margin: 0; font-size: 12px; color: #856404;">
                    ⚠️ Potrai scegliere se unire o sovrascrivere i dati esistenti dopo aver selezionato il file.
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.style.background = '#f8f9fa';
    
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
        processImportFile(file);
    } else {
        alert('File non valido. Seleziona un file JSON.');
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processImportFile(file);
    }
}

function processImportFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            StorageManager.importData(data);
            
            const modal = document.getElementById('importModal');
            if (modal) modal.remove();
            
        } catch (error) {
            alert('Errore lettura file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// ============================================
// GENERIC CV FUNCTIONS
// ============================================

function generateDocumentsGeneric() {
    const cvText = document.getElementById('generic-cv').value.trim();
    const jd = document.getElementById('generic-jd').value.trim();
    
    if (!cvText || !jd) {
        alert('Compila tutti i campi obbligatori');
        return;
    }
    
    document.getElementById('loading-generic').classList.add('show');
    document.getElementById('results-generic').classList.remove('show');
    
    setTimeout(async () => {
        const keywords = await extractKeywordsAdvanced(jd, 15);
        const atsScore = calculateATSScore(cvText, keywords);
        
        displayResultsGeneric(atsScore, keywords);
        
        document.getElementById('loading-generic').classList.remove('show');
        document.getElementById('results-generic').classList.add('show');
        document.getElementById('results-generic').scrollIntoView({ behavior: 'smooth' });
    }, 15000);
}

function displayResultsGeneric(atsScore, keywords) {
    let interpretation = '';
    if (atsScore.score >= 70) interpretation = '✅ Ottimo match!';
    else if (atsScore.score >= 50) interpretation = '⚠️ Buon match';
    else interpretation = '❌ Match basso';
    
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
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #2196f3;">
                <p style="margin: 0; font-size: 13px; color: #0d47a1;">
                    💡 <strong>Suggerimento:</strong> Aggiungi le keyword mancanti nel tuo CV per aumentare lo score ATS.
                </p>
            </div>
        </div>
    `;
    
    document.getElementById('results-generic').innerHTML = resultsHTML;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' 
        ? element.value 
        : element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copiato!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        alert('Errore copia: ' + err);
    });
}

function downloadCoverLetter() {
    const coverLetter = document.getElementById('editableCoverLetter').value;
    const company = window.currentCompany || 'Company';
    const role = window.currentRole || 'Role';
    
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CoverLetter_${company}_${role}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleCVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    uploadedFileName = file.name;
    
    const reader = new FileReader();
    
    if (file.type === 'application/pdf') {
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            uploadedCVText = await extractTextFromPDF(arrayBuffer);
            
            if (uploadedCVText.trim().length > 50) {
                alert(`✅ PDF caricato: ${file.name}\n\n${uploadedCVText.length} caratteri estratti`);
            } else {
                alert('⚠️ Testo estratto troppo breve. Prova con DOCX o copia/incolla manualmente.');
            }
        };
        reader.readAsArrayBuffer(file);
        
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        alert('⚠️ Upload DOCX non supportato direttamente. Copia/incolla il testo del CV nella textarea.');
        
    } else {
        reader.onload = (e) => {
            uploadedCVText = e.target.result;
            alert(`✅ File caricato: ${file.name}`);
        };
        reader.readAsText(file);
    }
}

// ============================================
// QUEUE MODE (Chrome Extension Integration)
// ============================================

function loadQueueMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'queue') {
        const queueData = urlParams.get('data');
        if (queueData) {
            try {
                const queue = JSON.parse(decodeURIComponent(queueData));
                displayQueueJobs(queue);
            } catch (error) {
                console.error('Error loading queue:', error);
            }
        }
    }
}

function displayQueueJobs(queue) {
    if (queue.length === 0) return;
    
    const modal = document.createElement('div');
    modal.id = 'queueModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px;">
            <h2 style="margin: 0 0 20px 0;">📂 Job Queue (${queue.length})</h2>
            <p style="margin: 0 0 20px 0; color: #666;">Seleziona i job da processare:</p>
            
            <div style="display: grid; gap: 15px; margin-bottom: 20px;">
                ${queue.map((job, index) => `
                    <div style="border: 2px solid #e0e0e0; padding: 15px; border-radius: 8px; background: #fafafa;">
                        <input type="checkbox" id="job_${index}" checked style="margin-right: 10px;">
                        <label for="job_${index}" style="font-weight: 600;">${job.company} - ${job.role}</label>
                        <p style="margin: 10px 0 0 25px; font-size: 13px; color: #666;">${job.description.substring(0, 150)}...</p>
                    </div>
                `).join('')}
            </div>
            
            <button onclick="processQueueJobs(${JSON.stringify(queue).replace(/"/g, '&quot;')})" class="primary" style="width: 100%; padding: 15px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
                🚀 Processa Selezionati
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function processQueueJobs(queue) {
    const selectedJobs = queue.filter((job, index) => 
        document.getElementById(`job_${index}`).checked
    );
    
    if (selectedJobs.length === 0) {
        alert('Seleziona almeno un job');
        return;
    }
    
    const modal = document.getElementById('queueModal');
    if (modal) modal.remove();
    
    alert(`Processando ${selectedJobs.length} job. Questa feature sarà implementata nella V5!`);
}

// ============================================
// INITIALIZATION
// ============================================

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        checkFeedbackStatus();
        loadQueueMode();
    });
}
