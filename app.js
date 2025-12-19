// Job Application System V4 - PRODUCTION READY
// Part 1: Core Data Structures, Storage, Keyword Extraction, Industry Detection

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
            // Email tracking
            emailSent: false,
            sentDate: null,
            recipientEmail: null,
            attachments: [],
            // Feedback tracking
            feedbackCompleted: false,
            outcome: null, // "interview" | "rejection" | "ghosted"
            responseTime: null,
            feedbackNotes: '',
            feedbackDeadline: null,
            status: 'draft', // "draft" | "sent" | "pending" | "auto-ghosted" | "completed"
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
        
        // Update learning data
        this.updateLearningData(id, feedbackData);
    },
    
    updateLearningData(id, feedbackData) {
        const entry = this.getAnalysis(id);
        if (!entry) return;
        
        const learning = this.getLearningData();
        
        // Track by industry
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
        
        // Track cover letter style effectiveness
        const style = entry.fullResults?.selectedStyle || 'standard';
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
        
        // Save
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
            version: '4.0'
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
        
        // Show instructions
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
                // Merge: rimuovi duplicati per ID, mantieni più recenti
                const merged = [...currentHistory];
                data.history.forEach(entry => {
                    const existingIndex = merged.findIndex(e => e.id === entry.id);
                    if (existingIndex === -1) {
                        merged.push(entry);
                    } else {
                        // Keep newer version
                        if (new Date(entry.date) > new Date(merged[existingIndex].date)) {
                            merged[existingIndex] = entry;
                        }
                    }
                });
                
                localStorage.setItem('job_app_history', JSON.stringify(merged));
                alert(`✅ Dati uniti! Totale candidature: ${merged.length}`);
            } else {
                // Overwrite
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
            
            // Reminder at 15 days
            if (daysPassed === 15 && !app.reminderSent) {
                showFeedbackReminder(app);
                StorageManager.updateAnalysis(app.id, { reminderSent: true });
            }
            
            // Auto-ghost after 15 days (but recoverable)
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

// Run check on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', checkFeedbackStatus);
}

// ============================================
// ADVANCED KEYWORD EXTRACTION (TF-IDF + Bigrams)
// ============================================
const stopwords = new Set([
    'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
    'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'uno',
    'e', 'o', 'ma', 'se', 'che', 'chi', 'cui', 'del', 'della',
    'the', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'at', 'with',
    'you', 'your', 'we', 'our', 'will', 'have', 'has', 'who', 'what',
    'are', 'is', 'was', 'were', 'been', 'being', 'can', 'could',
    'looking', 'support', 'work', 'working', 'offer', 'role',
    'contribute', 'tasks', 'environment', 'opportunity', 'join',
    'years', 'experience', 'preferred', 'required'
]);

function extractBigrams(text) {
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
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
    
    const termCount = (textLower.match(new RegExp(`\\b${termLower}\\b`, 'g')) || []).length;
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
        'digital marketing': 2.0,
        'media planning': 2.0,
        'product management': 2.0,
        'data analysis': 2.0,
        'performance marketing': 2.0,
        'campaign optimization': 1.8,
        'budget management': 1.8,
        'stakeholder management': 1.8,
        'google analytics': 1.6,
        'power bi': 1.6,
        'meta ads': 1.6,
        'marketing': 1.3,
        'strategy': 1.3,
        'analysis': 1.3
    };
    
    return boostMap[term.toLowerCase()] || 1.0;
}

function extractKeywordsAdvanced(jdText, topN = 15) {
    const unigrams = jdText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const bigrams = extractBigrams(jdText);
    
    const allTerms = [...new Set([...unigrams, ...bigrams])].filter(term => 
        !stopwords.has(term)
    );
    
    const scored = allTerms.map(term => ({
        word: term,
        score: calculateTFIDF(term, jdText) * getDomainBoost(term),
        count: (jdText.toLowerCase().match(new RegExp(`\\b${term}\\b`, 'g')) || []).length
    }));
    
    const filtered = scored.filter(item => 
        item.count >= 2 || item.word.includes(' ')
    );
    
    return filtered
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
}

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
// Job Application System V4 - Part 2
// Competitive Analysis, Cover Letter Variants, Email System

// ============================================
// COMPETITIVE ANALYSIS
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
    
    // Experience Gap Analysis
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
    
    // Tools Coverage
    if (jdRequirements.tools && jdRequirements.tools.length > 0) {
        const matchedTools = jdRequirements.tools.filter(tool =>
            cvProfile.skills.some(skill =>
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
    
    // Industry Fit
    analysis.industryFit = 75;
    if (cvProfile.industries && cvProfile.industries.length > 0) {
        analysis.strengths.push(`Esperienza industry: ${cvProfile.industries.join(', ')}`);
        analysis.positioning.push('Leverage industry-specific knowledge');
    }
    
    // Overall Competitiveness
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
// COVER LETTER VARIANTS (A/B Testing)
// ============================================
function generateCoverLetterVariants(jdText, company, role, location, profile, industry) {
    const reqs = extractRequirements(jdText);
    const template = getIndustryTemplate(industry);
    
    return {
        standard: generateStandardCoverLetter(jdText, company, role, location, profile, reqs),
        bold: generateBoldCoverLetter(jdText, company, role, location, profile, reqs, template),
        storytelling: generateStorytellingCoverLetter(jdText, company, role, location, profile, reqs)
    };
}

function generateStandardCoverLetter(jdText, company, role, location, profile, reqs) {
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

function generateBoldCoverLetter(jdText, company, role, location, profile, reqs, template) {
    let letter = `Oggetto: ${role} – Delivering Results from Day One

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

function generateStorytellingCoverLetter(jdText, company, role, location, profile, reqs) {
    let letter = `Oggetto: Candidatura per ${role} – ${company}

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

// ============================================
// EMAIL SYSTEM - Send Application
// ============================================
async function sendApplicationEmail(emailData) {
    try {
        // Convert files to base64
        const cvBase64 = await fileToBase64(emailData.cvFile);
        const portfolioBase64 = emailData.portfolioFile ? await fileToBase64(emailData.portfolioFile) : null;
        const extraBase64 = emailData.extraFile ? await fileToBase64(emailData.extraFile) : null;
        
        const attachments = [
            {
                content: cvBase64,
                filename: emailData.cvFile.name,
                type: emailData.cvFile.type,
                disposition: 'attachment'
            }
        ];
        
        if (portfolioBase64) {
            attachments.push({
                content: portfolioBase64,
                filename: emailData.portfolioFile.name,
                type: emailData.portfolioFile.type,
                disposition: 'attachment'
            });
        }
        
        if (extraBase64) {
            attachments.push({
                content: extraBase64,
                filename: emailData.extraFile.name,
                type: emailData.extraFile.type,
                disposition: 'attachment'
            });
        }
        
        // Call Netlify Function
        const response = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: emailData.recipientEmail,
                from: 'martino.cicerani@gmail.com',
                subject: `Candidatura ${emailData.role} - Martino Cicerani`,
                body: emailData.coverLetter,
                attachments: attachments
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        // Mark as sent in storage
        StorageManager.markAsSent(emailData.analysisId, {
            recipientEmail: emailData.recipientEmail,
            attachments: attachments.map(a => a.filename),
            sentAt: new Date().toISOString()
        });
        
        return { success: true, result };
        
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
}

// Helper: File to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
// Job Application System V4 - Part 3
// UI Functions, Event Handlers, Modals, Display Logic

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
    
    setTimeout(() => {
        const industry = detectIndustry(jd);
        const keywords = extractKeywordsAdvanced(jd, 15);
        const reqs = extractRequirements(jd);
        
        const variants = generateCoverLetterVariants(jd, company, role, location, martinoProfile, industry);
        const aboutMe = generateCVAboutSectionMartino(jd);
        const detailedSuggestions = generateDetailedCVSuggestions(jd, reqs, martinoProfile.coreSkills, industry);
        const competitiveAnalysis = generateCompetitiveAnalysis(martinoProfile, reqs);
        
        const combinedText = variants.standard + ' ' + aboutMe;
        const atsScore = calculateATSScore(combinedText, keywords);
        
        const results = {
            atsScore,
            coverLetter: variants.standard,
            aboutMe,
            detailedSuggestions,
            keywords,
            variants,
            competitiveAnalysis,
            industry,
            selectedStyle: 'standard'
        };
        
        currentAnalysisResults = results;
        const analysisId = StorageManager.saveAnalysis(company, role, results, 'martino');
        
        displayResultsMartino(atsScore, variants.standard, aboutMe, detailedSuggestions, company, role, keywords, variants, competitiveAnalysis, industry, analysisId);
        
        document.getElementById('loading-martino').classList.remove('show');
        document.getElementById('results-martino').classList.add('show');
        document.getElementById('results-martino').scrollIntoView({ behavior: 'smooth' });
    }, 1000);
}

function displayResultsMartino(atsScore, coverLetter, aboutMe, detailedSuggestions, company, role, keywords, variants, competitiveAnalysis, industry, analysisId) {
    let interpretation = '';
    if (atsScore.score >= 70) interpretation = '✅ Ottimo match! Alta probabilità di passare i filtri ATS';
    else if (atsScore.score >= 50) interpretation = '⚠️ Buon match, considera di aggiungere keyword mancanti';
    else interpretation = '❌ Match basso. Rivedi i documenti';
    
    const compLevel = getCompetitivenessLevel(competitiveAnalysis.overallCompetitiveness);
    
    // Auto-detect email from JD
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
            <h3 style="margin-bottom: 15px;">📄 Cover Letter - Scegli Stile</h3>
            <div style="margin-bottom: 20px;">
                <select id="coverLetterStyle" onchange="switchCoverLetterVariant()" style="width: 100%; padding: 10px; border: 2px solid #667eea; border-radius: 8px; font-size: 14px;">
                    <option value="standard">Standard (formale) - Consigliato per corporate</option>
                    <option value="bold">Bold (numeri-first) - Consigliato per startup/tech</option>
                    <option value="storytelling">Storytelling (narrativo) - Consigliato per creative</option>
                </select>
            </div>
            <div class="document-output">
                <textarea id="editableCoverLetter" rows="20" style="width: 100%; padding: 10px; font-family: monospace; font-size: 13px; border: 2px solid #ddd; border-radius: 8px;">${variants.standard}</textarea>
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
                       placeholder="es: jobs@enel.com, hr@company.com" 
                       style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                ${detectedEmail ? '<small style="color: #28a745;">✅ Email rilevata automaticamente dalla JD</small>' : '<small style="color: #666;">Cerca l\'email su LinkedIn o sito aziendale se non presente nella JD</small>'}
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="font-weight: 600; margin-bottom: 8px; display: block;">CV Aggiornato * (PDF o DOCX)</label>
                <input type="file" id="cvFile" accept=".pdf,.doc,.docx" 
                       style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                <small style="color: #666;">Carica CV aggiornato secondo i suggerimenti del tool</small>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="font-weight: 600; margin-bottom: 8px; display: block;">📊 Portfolio (opzionale)</label>
                <input type="file" id="portfolioFile" accept=".pdf,.pptx" 
                       style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                <small style="color: #666;">Progetti, presentazioni, case study</small>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="font-weight: 600; margin-bottom: 8px; display: block;">📝 Altri Documenti (opzionale)</label>
                <input type="file" id="extraFile" accept=".pdf,.doc,.docx" 
                       style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                <small style="color: #666;">Certificazioni, referenze, etc.</small>
            </div>
            
            <button onclick="previewEmail(${analysisId}, '${company.replace(/'/g, "\\'")}', '${role.replace(/'/g, "\\'")}'))" 
                    class="primary" 
                    style="width: 100%; padding: 15px; font-size: 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                👁️ Preview & Invia Email
            </button>
        </div>
    `;
    
    document.getElementById('results-martino').innerHTML = resultsHTML;
    
    window.currentCoverLetterVariants = variants;
    window.currentCompany = company;
    window.currentRole = role;
}

function switchCoverLetterVariant() {
    const style = document.getElementById('coverLetterStyle').value;
    const variants = window.currentCoverLetterVariants;
    
    let selectedLetter = variants.standard;
    if (style === 'bold') selectedLetter = variants.bold;
    if (style === 'storytelling') selectedLetter = variants.storytelling;
    
    document.getElementById('editableCoverLetter').value = selectedLetter;
    
    if (currentAnalysisResults) {
        currentAnalysisResults.selectedStyle = style;
    }
}

// ============================================
// EMAIL PREVIEW & SEND
// ============================================
async function previewEmail(analysisId, company, role) {
    const recipientEmail = document.getElementById('recipientEmail').value.trim();
    const coverLetter = document.getElementById('editableCoverLetter').value.trim();
    const cvFile = document.getElementById('cvFile').files[0];
    const portfolioFile = document.getElementById('portfolioFile').files[0];
    const extraFile = document.getElementById('extraFile').files[0];
    
    if (!recipientEmail || !coverLetter || !cvFile) {
        alert('⚠️ Campi obbligatori: Email destinatario e CV');
        return;
    }
    
    const attachments = [
        { name: cvFile.name, size: formatFileSize(cvFile.size) }
    ];
    
    if (portfolioFile) {
        attachments.push({ name: portfolioFile.name, size: formatFileSize(portfolioFile.size) });
    }
    
    if (extraFile) {
        attachments.push({ name: extraFile.name, size: formatFileSize(extraFile.size) });
    }
    
    const modal = document.createElement('div');
    modal.id = 'emailPreviewModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px; position: relative;">
            <button onclick="document.getElementById('emailPreviewModal').remove()" 
                    style="position: absolute; top: 15px; right: 15px; border: none; background: #f5f5f5; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
            
            <h2 style="margin: 0 0 20px 0;">📧 Preview Email</h2><div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 5px 0;"><strong>Da:</strong> martino.cicerani@gmail.com</p>
                <p style="margin: 5px 0;"><strong>A:</strong> ${recipientEmail}</p>
                <p style="margin: 5px 0;"><strong>Oggetto:</strong> Candidatura ${role} - Martino Cicerani</p>
                <p style="margin: 5px 0;"><strong>Allegati (${attachments.length}):</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    ${attachments.map(att => `<li>📎 ${att.name} (${att.size})</li>`).join('')}
                </ul>
            </div>
            
            <div style="border: 2px solid #ddd; padding: 20px; border-radius: 8px; background: white; max-height: 400px; overflow-y: auto;">
                <pre style="white-space: pre-wrap; font-family: Arial; font-size: 13px; margin: 0;">${coverLetter}</pre>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button onclick="approveAndSendEmail(${analysisId})" 
                        class="primary" 
                        style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px;">
                    ✅ Approva & Invia
                </button>
                <button onclick="document.getElementById('emailPreviewModal').remove()" 
                        class="secondary" 
                        style="flex: 1; padding: 12px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; cursor: pointer;">
                    ✏️ Modifica
                </button>
            </div>
            
            <p style="font-size: 12px; color: #666; margin-top: 15px; text-align: center;">
                ⚠️ Verifica attentamente email destinatario e allegati prima di inviare
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function approveAndSendEmail(analysisId) {
    const recipientEmail = document.getElementById('recipientEmail').value.trim();
    const coverLetter = document.getElementById('editableCoverLetter').value.trim();
    const cvFile = document.getElementById('cvFile').files[0];
    const portfolioFile = document.getElementById('portfolioFile').files[0];
    const extraFile = document.getElementById('extraFile').files[0];
    
    document.getElementById('emailPreviewModal').remove();
    
    const loadingModal = showLoadingModal('Invio email in corso...');
    
    try {
        const result = await sendApplicationEmail({
            analysisId,
            recipientEmail,
            coverLetter,
            role: window.currentRole,
            cvFile,
            portfolioFile,
            extraFile
        });
        
        loadingModal.remove();
        
        if (result.success) {
            showSuccessModal(`
                ✅ Email inviata con successo!
                
                Destinatario: ${recipientEmail}
                Allegati: ${cvFile.name}${portfolioFile ? ', ' + portfolioFile.name : ''}${extraFile ? ', ' + extraFile.name : ''}
                
                📊 Ricordati di aggiornare il risultato entro 15 giorni.
            `);
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        loadingModal.remove();
        alert('❌ Errore invio email: ' + error.message + '\n\nVerifica:\n- SendGrid configurato su Netlify\n- Email destinatario valida\n- Allegati < 10MB');
        console.error(error);
    }
}

// ============================================
// HISTORY MODAL
// ============================================
function showHistory() {
    const history = StorageManager.getHistory();
    
    if (history.length === 0) {
        alert('📋 Nessuna analisi salvata');
        return;
    }
    
    let html = '<h3 style="margin: 0 0 20px 0;">📋 Cronologia Candidature (ultime 50)</h3>';
    html += '<div style="max-height: 500px; overflow-y: auto;">';
    
    history.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString('it-IT');
        const badge = entry.type === 'martino' ? '👤 Personale' : '📄 Generico';
        const statusBadge = entry.status === 'sent' ? '📤 Inviata' : 
                           entry.status === 'auto-ghosted' ? '👻 Ghosted' :
                           entry.status === 'completed' ? '✅ Completed' : '📝 Bozza';
        
        html += `
            <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px; background: #f9f9f9;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="margin-bottom: 8px;">
                            <span style="background: #667eea; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; margin-right: 5px;">${badge}</span>
                            <span style="background: ${entry.status === 'sent' ? '#28a745' : entry.status === 'auto-ghosted' ? '#dc3545' : '#ffc107'}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px;">${statusBadge}</span>
                        </div>
                        <strong style="font-size: 15px;">${entry.company} - ${entry.role}</strong>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
                            ${date} | ATS Score: ${entry.atsScore}%
                            ${entry.emailSent ? ` | Inviata a: ${entry.recipientEmail}` : ''}
                        </p>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="copy-btn" onclick="loadHistoryAnalysis(${entry.id})" style="font-size: 12px; padding: 6px 12px;">📂 Ricarica</button>
                        ${entry.emailSent && !entry.feedbackCompleted ? `
                            <button class="primary" onclick="showFeedbackForm(${entry.id})" style="font-size: 12px; padding: 6px 12px; background: #28a745;">📊 Feedback</button>
                        ` : ''}
                        <button class="remove-btn" onclick="deleteHistoryEntry(${entry.id})" style="font-size: 12px; padding: 6px 12px;">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    html += '<div style="margin-top: 20px; display: flex; gap: 10px;">';
    html += '<button class="secondary" onclick="StorageManager.exportData()">📤 Esporta Dati</button>';
    html += '<button class="secondary" onclick="showImportInstructions()">📥 Importa Dati</button>';
    html += '<button class="remove-btn" onclick="clearAllHistory()">🗑️ Cancella Tutto</button>';
    html += '</div>';
    
    showModal(html);
}

function loadHistoryAnalysis(id) {
    const entry = StorageManager.getAnalysis(id);
    if (!entry) return;
    
    closeModal();
    
    if (entry.type === 'martino') {
        switchTab('martino');
        document.getElementById('company').value = entry.company;
        document.getElementById('role').value = entry.role;
        
        if (entry.fullResults) {
            displayResultsMartino(
                entry.fullResults.atsScore,
                entry.fullResults.coverLetter,
                entry.fullResults.aboutMe,
                entry.fullResults.detailedSuggestions,
                entry.company,
                entry.role,
                entry.fullResults.keywords,
                entry.fullResults.variants,
                entry.fullResults.competitiveAnalysis,
                entry.fullResults.industry,
                entry.id
            );
            document.getElementById('results-martino').classList.add('show');
        }
    }
    
    alert('✓ Analisi ricaricata!');
}

function deleteHistoryEntry(id) {
    if (confirm('Eliminare questa analisi?')) {
        StorageManager.deleteAnalysis(id);
        closeModal();
        showHistory();
    }
}

function clearAllHistory() {
    if (confirm('Eliminare tutta la cronologia? (Azione irreversibile)\n\nConsiglio: Esporta i dati prima di cancellare.')) {
        StorageManager.clearHistory();
        closeModal();
        alert('✓ Cronologia cancellata');
    }
}

// ============================================
// FEEDBACK FORM
// ============================================
function showFeedbackForm(id) {
    const entry = StorageManager.getAnalysis(id);
    if (!entry) return;
    
    const sentDate = new Date(entry.sentDate);
    const daysPassed = Math.floor((new Date() - sentDate) / (1000 * 60 * 60 * 24));
    
    const html = `
        <h3>📊 Aggiorna Risultato Candidatura</h3>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong style="font-size: 15px;">${entry.company} - ${entry.role}</strong>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">
                Inviata il ${sentDate.toLocaleDateString('it-IT')} (${daysPassed} giorni fa)
                ${entry.status === 'auto-ghosted' ? '<br><span style="color: #dc3545;">⚠️ Auto-ghosted dopo 15 giorni - Puoi comunque aggiornare</span>' : ''}
            </p>
        </div>
        
        <div style="margin: 20px 0;">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">Hai ricevuto risposta?</label>
            <select id="feedbackOutcome" onchange="toggleResponseDetails()" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                <option value="ghosted">👻 Nessuna risposta (ghosted)</option>
                <option value="interview">✅ Colloquio fissato</option>
                <option value="rejection">❌ Candidatura rifiutata</option>
            </select>
        </div>
        
        <div id="responseDetails" style="display: none; margin: 20px 0;">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">Dopo quanti giorni?</label>
            <input type="number" id="responseTime" value="${daysPassed}" min="1" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; margin-bottom: 15px;">
            
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">Tipo colloquio (opzionale):</label>
            <select id="interviewType" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                <option value="">-- Seleziona --</option>
                <option value="phone">📞 Telefonico</option>
                <option value="video">📹 Video call</option>
                <option value="onsite">🏢 In sede</option>
                <option value="technical">💻 Test tecnico</option>
            </select>
        </div>
        
        <div style="margin: 20px 0;">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">Note/Feedback (opzionale):</label>
            <textarea id="feedbackNotes" rows="4" placeholder="Es: Hanno apprezzato esperienza automotive. Colloquio positivo, in attesa di secondo step..." style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-family: Arial;"></textarea>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button onclick="submitFeedback(${id})" class="primary" style="flex: 1; padding: 12px;">💾 Salva Feedback</button>
            <button onclick="closeModal()" class="secondary" style="flex: 1; padding: 12px;">Annulla</button>
        </div>
    `;
    
    showModal(html);
}

function toggleResponseDetails() {
    const outcome = document.getElementById('feedbackOutcome').value;
    const details = document.getElementById('responseDetails');
    
    if (outcome === 'interview' || outcome === 'rejection') {
        details.style.display = 'block';
    } else {
        details.style.display = 'none';
    }
}

function submitFeedback(id) {
    const outcome = document.getElementById('feedbackOutcome').value;
    const responseTime = parseInt(document.getElementById('responseTime')?.value) || null;
    const interviewType = document.getElementById('interviewType')?.value || null;
    const feedbackNotes = document.getElementById('feedbackNotes').value;
    
    const feedbackData = {
        outcome,
        responseTime,
        interviewType,
        feedbackNotes
    };
    
    StorageManager.updateFeedback(id, feedbackData);
    
    closeModal();
    alert('✅ Feedback salvato! Il sistema ha aggiornato i dati di learning.');
    
    showHistory();
}

// ============================================
// EXPORT/IMPORT UI
// ============================================
function showExportInstructions() {
    const modal = `
        <h3>✅ Dati Esportati!</h3>
        
        <p style="margin: 20px 0;">File <strong>job_app_backup_${new Date().toISOString().split('T')[0]}.json</strong> scaricato.</p>
        
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #2e7d32;">📤 Per salvarlo su Google Drive:</h4>
            <ol style="margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Apri <a href="https://drive.google.com" target="_blank">Google Drive</a></li>
                <li>Click "Nuovo" → "Carica file"</li>
                <li>Seleziona il file JSON appena scaricato</li>
                <li>Salvalo in una cartella dedicata (es: "Job App Backups")</li>
            </ol>
        </div>
        
        <p style="font-size: 13px; color: #666;">
            💡 <strong>Tip:</strong> Esporta i dati ogni settimana per avere un backup aggiornato.
            Usa questo file per sincronizzare dati tra dispositivi diversi.
        </p>
        
        <button onclick="closeModal()" class="primary" style="width: 100%; margin-top: 20px;">OK</button>
    `;
    
    showModal(modal);
}

function showImportInstructions() {
    const modal = `
        <h3>📥 Importa Dati da Backup</h3>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #e65100;">📥 Per importare da Google Drive:</h4>
            <ol style="margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Apri <a href="https://drive.google.com" target="_blank">Google Drive</a></li>
                <li>Trova il file <strong>job_app_backup_YYYY-MM-DD.json</strong></li>
                <li>Click destro → Download</li>
                <li>Torna qui e usa il pulsante sotto</li>
            </ol>
        </div>
        
        <div id="dropZone" style="border: 3px dashed #667eea; padding: 40px; text-align: center; border-radius: 8px; margin: 20px 0; background: #f8f9ff; cursor: pointer;"
             ondragover="event.preventDefault(); this.style.background='#e3e7ff';"
             ondragleave="this.style.background='#f8f9ff';"
             ondrop="handleFileDrop(event)">
            <p style="margin: 0; font-size: 16px; color: #667eea;">📂 Trascina qui il file JSON</p>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">oppure</p>
            <button onclick="document.getElementById('importFileInput').click()" class="secondary" style="margin-top: 10px;">Sfoglia File</button>
            <input type="file" id="importFileInput" accept=".json" style="display: none;" onchange="handleFileImport(event)">
        </div>
        
        <button onclick="closeModal()" class="secondary" style="width: 100%;">Annulla</button>
    `;
    
    showModal(modal);
}

function handleFileDrop(event) {
    event.preventDefault();
    event.target.style.background = '#f8f9ff';
    
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
        readAndImportFile(file);
    } else {
        alert('⚠️ File deve essere .json');
    }
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (file) {
        readAndImportFile(file);
    }
}

function readAndImportFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target.result;
            StorageManager.importData(data);
            closeModal();
        } catch (error) {
            alert('❌ Errore import: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// ============================================
// GENERIC CV SECTION
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
            <button class="remove-btn" onclick="removeFile()">✕</button>
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
        alert('Errore parsing PDF. Prova DOCX o copy/paste.');
        console.error(error);
    }
}

function showCVPreview(text) {
    const preview = text.substring(0, 1000) + (text.length > 1000 ? '...' : '');
    document.getElementById('cvPreview').innerHTML = `
        <div class="cv-preview">
            <h3>📄 Preview (1000 char)</h3>
            <pre>${preview}</pre>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">Verifica correttezza. Parsing potrebbe non essere perfetto per layout complessi.</p>
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

// ============================================
// UTILITY FUNCTIONS
// ============================================
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    let text = element.tagName === 'TEXTAREA' ? element.value : element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        alert('✓ Copiato!');
    }).catch(() => {
        // Fallback
        element.select();
        document.execCommand('copy');
        alert('✓ Copiato!');
    });
}

function downloadCoverLetter() {
    const coverLetter = document.getElementById('editableCoverLetter').value;
    const company = window.currentCompany;
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>body { font-family: Arial; line-height: 1.6; margin: 2cm; }</style>
</head>
<body>
    <pre style="font-family: Arial; white-space: pre-wrap;">${coverLetter}</pre>
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

function showModal(content) {
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px; position: relative;">
            <button onclick="closeModal()" style="position: absolute; top: 15px; right: 15px; border: none; background: #f5f5f5; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
            ${content}
        </div>
    `;
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.getElementById('customModal');
    if (modal) modal.remove();
}

function showLoadingModal(message) {
    const modal = document.createElement('div');
    modal.id = 'loadingModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 12px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 20px;">⏳</div>
            <p style="margin: 0; font-size: 16px;">${message}</p>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function showSuccessModal(message) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; max-width: 500px;">
            <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
            <pre style="white-space: pre-wrap; font-family: Arial; font-size: 14px; text-align: left;">${message}</pre>
            <button onclick="this.closest('div[style*=fixed]').remove()" class="primary" style="margin-top: 20px; padding: 12px 30px;">OK</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function showFeedbackReminder(app) {
    if (Notification.permission === 'granted') {
        new Notification('Job Application Assistant', {
            body: `Hai inviato candidatura a ${app.company} 15 giorni fa. Aggiorna il risultato!`
        });
    }
    
    const banner = document.createElement('div');
    banner.style.cssText = 'position: fixed; top: 20px; right: 20px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9998; max-width: 350px;';
    banner.innerHTML = `
        <h4 style="margin: 0 0 10px 0;">📊 Reminder Feedback</h4>
        <p style="margin: 0 0 15px 0; font-size: 13px;">Hai inviato candidatura a <strong>${app.company}</strong> 15 giorni fa.</p>
        <div style="display: flex; gap: 10px;">
            <button onclick="showFeedbackForm(${app.id}); this.closest('div[style*=fixed]').remove();" class="primary" style="flex: 1; padding: 8px; font-size: 13px;">Aggiorna</button>
            <button onclick="this.closest('div[style*=fixed]').remove();" class="secondary" style="flex: 1; padding: 8px; font-size: 13px;">Dopo</button>
        </div>
    `;
    document.body.appendChild(banner);
    
    setTimeout(() => banner.remove(), 15000);
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    checkFeedbackStatus();
    
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
