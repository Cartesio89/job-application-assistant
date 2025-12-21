// Job Application System V4.2 - PRODUCTION READY
// Complete rewrite with intelligent filtering + all fixes
// Part 1: Core Data, Storage, Advanced Keywords (NO API needed)

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

let uploadedCVText = '';
let uploadedFileName = '';
let currentAnalysisResults = null;

// ============================================
// STORAGE MANAGER
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
            feedbackCompleted: false,
            outcome: null,
            status: 'draft'
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
        return this.getHistory().find(entry => entry.id === parseInt(id));
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
            status: 'sent',
            feedbackDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        });
    },
    
    updateFeedback(id, feedbackData) {
        this.updateAnalysis(id, {
            feedbackCompleted: true,
            outcome: feedbackData.outcome,
            status: 'completed',
            feedbackDate: new Date().toISOString()
        });
    },
    
    deleteAnalysis(id) {
        const history = this.getHistory().filter(entry => entry.id !== parseInt(id));
        localStorage.setItem('job_app_history', JSON.stringify(history));
    },
    
    exportData() {
        const data = {
            profile: martinoProfile,
            history: this.getHistory(),
            exportedAt: new Date().toISOString(),
            version: '4.2'
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
    }
};

// ============================================
// KEYWORD EXTRACTION - INTELLIGENT LOCAL FILTERS
// ============================================

const stopwords = new Set([
    'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
    'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'uno',
    'al', 'allo', 'alla', 'ai', 'agli', 'alle',
    'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
    'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
    'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
    'del', 'dello', 'della', 'dei', 'degli', 'delle',
    'e', 'ed', 'o', 'ma', 'però', 'perché', 'quindi',
    'che', 'chi', 'cui', 'quale', 'quanto',
    'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro',
    'questo', 'questa', 'quello', 'quella',
    'è', 'sono', 'sei', 'era', 'erano',
    'avere', 'ha', 'hanno', 'hai', 'ho',
    'può', 'possono', 'deve', 'devono',
    'vuole', 'vogliono', 'fare', 'fa', 'fanno',
    'non', 'più', 'molto', 'poco', 'sempre', 'mai',
    'come', 'dove', 'quando', 'così',
    'lavoro', 'offerta', 'posizione', 'ricerca',
    'cerchiamo', 'stiamo', 'candidato', 'azienda',
    'team', 'ambiente', 'dinamico', 'importante',
    'the', 'a', 'an', 'of', 'to', 'in', 'for', 'on', 'at', 'with',
    'and', 'or', 'but', 'as', 'if', 'than', 'that',
    'you', 'we', 'they', 'it', 'this', 'these', 'those',
    'are', 'is', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'can', 'could', 'may', 'might',
    'do', 'does', 'did', 'make', 'get', 'go',
    'not', 'no', 'yes', 'very', 'too', 'also', 'just',
    'job', 'position', 'role', 'work', 'looking', 'seeking'
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

function calculateTFIDF(term, text) {
    const termLower = term.toLowerCase();
    const textLower = text.toLowerCase();
    
    const termCount = (textLower.match(new RegExp(`\\b${termLower.replace(/\s+/g, '\\s+')}\\b`, 'g')) || []).length;
    const totalWords = textLower.split(/\s+/).length;
    const tf = termCount / totalWords;
    const idf = Math.log(100 / (termCount + 1));
    
    return tf * idf;
}

function getDomainBoost(term) {
    const boostMap = {
        // Marketing
        'crm': 3.0,
        'customer relationship': 2.8,
        'customer base': 2.8,
        'segmentation': 2.8,
        'clustering': 2.5,
        'retention': 2.8,
        'acquisition': 2.8,
        'engagement': 2.5,
        'loyalty': 2.5,
        'vip management': 2.8,
        'digital marketing': 2.5,
        'performance marketing': 2.5,
        'media planning': 2.5,
        'campaign optimization': 2.5,
        'b2b marketing': 3.0,
        'demand generation': 2.8,
        'lead generation': 2.5,
        
        // Tools
        'power bi': 2.5,
        'tableau': 2.5,
        'looker studio': 2.3,
        'google analytics': 2.5,
        'ga4': 2.5,
        'meta ads': 2.3,
        'google ads': 2.3,
        'facebook ads': 2.0,
        'tiktok': 2.0,
        'programmatic': 2.3,
        'salesforce': 2.5,
        'hubspot': 2.5,
        
        // Skills
        'kpi': 2.0,
        'roi': 2.0,
        'roas': 2.0,
        'data analysis': 2.5,
        'business intelligence': 2.5,
        'stakeholder management': 2.0,
        
        // Industry
        'automotive': 1.8,
        'fashion': 1.8,
        'gaming': 2.0,
        'betting': 2.0,
        'saas': 2.0
    };
    
    return boostMap[term.toLowerCase()] || 1.0;
}

function applyIntelligentFilters(keywords, jdText) {
    const jdLower = jdText.toLowerCase();
    
    const marketingPatterns = [
        /\b(crm|customer\s+relationship|customer\s+base|segmentation|clustering)\b/i,
        /\b(acquisition|retention|engagement|loyalty|fidelizzazione)\b/i,
        /\b(kpi|performance|roi|roas|ctr|conversion)\b/i,
        /\b(campaign|marketing|promotional)\b/i,
        /\b(stakeholder|cross.selling|up.selling|vip)\b/i,
        /\b(data\s+analysis|analytics|bi|business\s+intelligence)\b/i
    ];
    
    const toolPatterns = [
        /\b(power\s+bi|tableau|looker|ga4|google\s+analytics)\b/i,
        /\b(salesforce|hubspot|marketo|mailchimp)\b/i,
        /\b(meta\s+ads|google\s+ads|facebook|tiktok)\b/i,
        /\b(excel|sql|python)\b/i
    ];
    
    const allPatterns = [...marketingPatterns, ...toolPatterns];
    
    return keywords.filter(kw => {
        const word = kw.word.toLowerCase();
        
        if (kw.count >= 3) return true;
        if (kw.score > 0.8) return true;
        if (allPatterns.some(p => p.test(word))) return true;
        if (word.includes(' ') && word.split(' ').every(w => w.length >= 4)) return true;
        if (/^[A-Z]{2,5}$/.test(kw.word)) return true;
        if (getDomainBoost(word) >= 1.8) return true;
        
        return false;
    });
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
    
    const irrelevantPatterns = [
        /\b(offerta|lavoro|posizione|ricerca|candidato)\b/i,
        /\b(azienda|società|team|gruppo)\b/i,
        /\b(cerchiamo|offriamo|ambiente|dinamico)\b/i
    ];
    
    const filtered = scored.filter(kw => {
        return !irrelevantPatterns.some(p => p.test(kw.word));
    });
    
    const intelligent = applyIntelligentFilters(filtered, jdText);
    
    return intelligent
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
}
// Part 2: Industry Detection, Requirements Extraction, Competitive Analysis, About Me

// ============================================
// INDUSTRY DETECTION
// ============================================
function detectIndustry(jdText) {
    const patterns = {
        tech: /\b(software|developer|engineer|code|programming|api|cloud|devops|agile)\b/gi,
        corporate: /\b(consulting|corporate|enterprise|stakeholder|governance|compliance)\b/gi,
        creative: /\b(design|creative|ux|ui|brand|content|visual|graphics)\b/gi,
        finance: /\b(financial|banking|investment|portfolio|trading|fintech)\b/gi,
        marketing: /\b(marketing|advertising|campaign|seo|sem|social media|analytics)\b/gi
    };
    
    const scores = {};
    for (const [industry, pattern] of Object.entries(patterns)) {
        const matches = jdText.match(pattern) || [];
        scores[industry] = matches.length;
    }
    
    const maxScore = Math.max(...Object.values(scores));
    return Object.keys(scores).find(key => scores[key] === maxScore) || 'corporate';
}

function getIndustryTemplate(industry) {
    const templates = {
        tech: {
            tone: 'technical and data-driven',
            verbs: ['implement', 'optimize', 'develop', 'analyze', 'scale'],
            format: 'metrics-focused',
            emphasis: 'quantifiable results and technical depth'
        },
        corporate: {
            tone: 'professional and strategic',
            verbs: ['drive', 'manage', 'coordinate', 'deliver', 'enhance'],
            format: 'achievement-oriented',
            emphasis: 'leadership and cross-functional collaboration'
        },
        creative: {
            tone: 'innovative and collaborative',
            verbs: ['design', 'create', 'conceptualize', 'iterate', 'elevate'],
            format: 'portfolio-focused',
            emphasis: 'creative vision and impact'
        },
        finance: {
            tone: 'analytical and precise',
            verbs: ['analyze', 'forecast', 'optimize', 'assess', 'model'],
            format: 'numbers-driven',
            emphasis: 'ROI and financial impact'
        },
        marketing: {
            tone: 'results-oriented and dynamic',
            verbs: ['launch', 'optimize', 'drive', 'grow', 'engage'],
            format: 'campaign-centric',
            emphasis: 'metrics and audience growth'
        }
    };
    
    return templates[industry] || templates.corporate;
}

// ============================================
// REQUIREMENTS EXTRACTION
// ============================================
function extractRequirements(jdText) {
    const toolPatterns = [
        { category: 'design', tools: ['figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'indesign'] },
        { category: 'analytics', tools: ['google analytics', 'ga4', 'power bi', 'tableau', 'looker', 'mixpanel'] },
        { category: 'social', tools: ['meta ads', 'facebook ads', 'google ads', 'tiktok', 'linkedin ads', 'twitter ads'] },
        { category: 'project', tools: ['jira', 'asana', 'trello', 'monday', 'notion', 'confluence'] },
        { category: 'marketing', tools: ['hubspot', 'salesforce', 'marketo', 'mailchimp', 'crm'] }
    ];
    
    const tools = [];
    toolPatterns.forEach(({ category, tools: toolList }) => {
        toolList.forEach(tool => {
            const regex = new RegExp(`\\b${tool.replace(/\s+/g, '\\s+')}\\b`, 'gi');
            if (regex.test(jdText)) {
                tools.push({ category, name: tool, required: true });
            }
        });
    });
    
    const expMatch = jdText.match(/(\d+)\+?\s*(?:years?|anni)\s+(?:of\s+)?(?:experience|esperienza)/i);
    const experienceYears = expMatch ? parseInt(expMatch[1]) : null;
    
    const hardSkills = [];
    const skillKeywords = ['seo', 'sem', 'ppc', 'crm', 'analytics', 'data analysis', 'project management', 
                          'stakeholder management', 'budget management', 'media planning'];
    
    skillKeywords.forEach(skill => {
        if (new RegExp(`\\b${skill}\\b`, 'i').test(jdText)) {
            hardSkills.push(skill);
        }
    });
    
    const softSkills = [];
    const softKeywords = ['communication', 'leadership', 'team collaboration', 'problem solving', 
                         'analytical thinking', 'creativity', 'adaptability'];
    
    softKeywords.forEach(skill => {
        if (new RegExp(`\\b${skill}\\b`, 'i').test(jdText)) {
            softSkills.push(skill);
        }
    });
    
    return {
        tools,
        experienceYears,
        hardSkills,
        softSkills
    };
}

// ============================================
// COMPETITIVE ANALYSIS
// ============================================
function generateCompetitiveAnalysis(jdText, cvProfile) {
    const reqs = extractRequirements(jdText);
    
    const profileYears = cvProfile.yearsExp || 0;
    const requiredYears = reqs.experienceYears || 0;
    const experienceGap = requiredYears > 0 
        ? Math.min(100, Math.round((profileYears / requiredYears) * 100))
        : 100;
    
    const requiredTools = reqs.tools.map(t => t.name.toLowerCase());
    const profileTools = cvProfile.coreSkills.map(s => s.toLowerCase());
    
    const matchedTools = requiredTools.filter(tool =>
        profileTools.some(skill => skill.includes(tool) || tool.includes(skill))
    );
    
    const toolsCoverage = requiredTools.length > 0
        ? Math.round((matchedTools.length / requiredTools.length) * 100)
        : 100;
    
    const jdLower = jdText.toLowerCase();
    const profileIndustries = cvProfile.industries.map(i => i.toLowerCase());
    
    let industryFit = 0;
    profileIndustries.forEach(industry => {
        if (jdLower.includes(industry)) {
            industryFit += 30;
        }
    });
    industryFit = Math.min(100, industryFit + 40);
    
    const strengths = [];
    const weaknesses = [];
    const positioning = [];
    
    if (experienceGap >= 80) {
        strengths.push(`Experience: ${profileYears}+ years meets/exceeds requirement`);
    } else if (experienceGap >= 60) {
        strengths.push(`Solid ${profileYears} years experience in digital domain`);
    }
    
    if (cvProfile.industries && cvProfile.industries.length > 0) {
        strengths.push(`Industry experience: ${cvProfile.industries.join(', ')}`);
    }
    
    if (toolsCoverage >= 70) {
        strengths.push(`Strong tools coverage (${matchedTools.length}/${requiredTools.length} matched)`);
    } else if (toolsCoverage >= 50) {
        strengths.push(`Partial tools coverage (${matchedTools.length}/${requiredTools.length} matched)`);
        weaknesses.push(`Tool gap: ${requiredTools.length - matchedTools.length} tools to highlight or learn`);
    } else if (requiredTools.length > 0) {
        weaknesses.push(`Significant tool gap (${toolsCoverage}% coverage)`);
        const missingTools = requiredTools.filter(tool => !matchedTools.includes(tool));
        weaknesses.push(`Missing tools: ${missingTools.slice(0, 3).join(', ')}`);
    }
    
    if (industryFit < 60) {
        weaknesses.push('Limited direct industry experience for this role');
        positioning.push('Frame existing experience as transferable skills');
    }
    
    positioning.push('Lead with seniority and proven track record');
    positioning.push('Emphasize data-driven approach and analytical mindset');
    
    if (cvProfile.aiCertifications && cvProfile.aiCertifications.length > 0) {
        positioning.push('Highlight AI/automation skills as competitive differentiator');
    }
    
    const overallScore = Math.round((experienceGap + toolsCoverage + industryFit) / 3);
    
    let competitivenessLevel = '';
    if (overallScore >= 80) {
        competitivenessLevel = 'VERY COMPETITIVE';
    } else if (overallScore >= 70) {
        competitivenessLevel = 'COMPETITIVE';
    } else if (overallScore >= 60) {
        competitivenessLevel = 'MODERATELY COMPETITIVE';
    } else {
        competitivenessLevel = 'CHALLENGING';
    }
    
    return {
        overall: overallScore,
        competitivenessLevel,
        experienceMatch: experienceGap,
        toolsCoverage,
        industryFit,
        strengths,
        weaknesses,
        positioning
    };
}

function getCompetitivenessLevel(score) {
    if (score >= 80) {
        return { label: 'VERY COMPETITIVE', color: '#4caf50', icon: '🎯' };
    } else if (score >= 70) {
        return { label: 'COMPETITIVE', color: '#8bc34a', icon: '✅' };
    } else if (score >= 60) {
        return { label: 'MODERATELY COMPETITIVE', color: '#ff9800', icon: '⚠️' };
    } else {
        return { label: 'CHALLENGING', color: '#f44336', icon: '❌' };
    }
}

// ============================================
// PDF TEXT EXTRACTION
// ============================================
function extractTextFromPDF(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    let text = '';
    
    for (let i = 0; i < uint8Array.length - 1; i++) {
        const char = uint8Array[i];
        if ((char >= 32 && char <= 126) || 
            (char >= 192 && char <= 255) ||
            char === 10 || char === 13) {
            text += String.fromCharCode(char);
        } else {
            text += ' ';
        }
    }
    
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/(.)\1{4,}/g, '$1$1$1');
    
    return text.trim();
}

// ============================================
// ABOUT ME CV SECTION - ENRICHED
// ============================================
function generateCVAboutSectionMartino(jdText, profile) {
    const reqs = extractRequirements(jdText);
    const jdLower = jdText.toLowerCase();
    
    let about = `Digital Media Planner with over ${profile.yearsExp} years of experience `;
    
    const focusAreas = [];
    if (/crm|customer\s+relationship|customer\s+base/i.test(jdText)) focusAreas.push("customer relationship management");
    if (/retention|churn|loyalty|fidelizzazione/i.test(jdText)) focusAreas.push("retention strategies");
    if (/acquisition|lead\s+generation|new\s+customer/i.test(jdText)) focusAreas.push("customer acquisition");
    if (/segmentation|clustering|personalization/i.test(jdText)) focusAreas.push("customer segmentation");
    if (/product.*management|product.*launch|roadmap/i.test(jdText)) focusAreas.push("product management");
    if (/media\s+(?:strategy|planning|buying)/i.test(jdText)) focusAreas.push("media strategy");
    if (/performance|optimization|kpi/i.test(jdText)) focusAreas.push("performance optimization");
    
    if (focusAreas.length === 0) {
        focusAreas.push("digital strategy", "campaign optimization");
    }
    
    about += `in ${focusAreas.slice(0, 2).join(' and ')} for international brands`;
    
    const relevantBrands = profile.brandsManaged.slice(0, 3).join(', ');
    about += ` including ${relevantBrands}. `;
    
    const coreCompetencies = [];
    if (profile.coreSkills.some(s => /data|analytics/i.test(s))) {
        coreCompetencies.push("data-driven decision making");
    }
    if (profile.coreSkills.some(s => /budget|financial/i.test(s))) {
        coreCompetencies.push("budget management");
    }
    if (profile.coreSkills.some(s => /strategy|planning/i.test(s))) {
        coreCompetencies.push("strategic planning");
    }
    
    if (coreCompetencies.length > 0) {
        about += `Skilled in ${coreCompetencies.join(', ')}, `;
    }
    
    const mentionedTools = [];
    if (reqs.tools.length > 0) {
        const matchedTools = reqs.tools.filter(tool =>
            profile.coreSkills.some(skill => 
                skill.toLowerCase().includes(tool.name.toLowerCase()) ||
                tool.name.toLowerCase().includes(skill.toLowerCase())
            )
        );
        if (matchedTools.length > 0) {
            mentionedTools.push(...matchedTools.slice(0, 3).map(t => t.name));
        }
    }
    
    if (mentionedTools.length === 0) {
        const defaultTools = profile.coreSkills.filter(s => 
            /power bi|analytics|excel|looker/i.test(s)
        ).slice(0, 3);
        mentionedTools.push(...defaultTools);
    }
    
    if (mentionedTools.length > 0) {
        about += `utilizing tools such as ${mentionedTools.join(', ')}. `;
    }
    
    if (profile.aiCertifications && profile.aiCertifications.length > 0) {
        about += `Complemented by advanced AI and automation skills to enhance marketing effectiveness.`;
    } else {
        about += `Specialized in leveraging technology to drive measurable business results.`;
    }
    
    return about.trim();
}

// ============================================
// EMAIL EXTRACTION
// ============================================
function extractEmailFromJD(jdText) {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = jdText.match(emailPattern) || [];
    
    const filtered = emails.filter(email => {
        const domain = email.split('@')[1].toLowerCase();
        return !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain);
    });
    
    return filtered[0] || '';
}
// Part 3: Cover Letter Generation (6 variants bilingual) + Detailed CV Suggestions

// ============================================
// COVER LETTER VARIANTS - BILINGUAL
// ============================================
function generateCoverLetterVariantsBilingual(company, role, jdText, profile) {
    return {
        standard_it: generateStandardCoverLetterIT(company, role, jdText, profile),
        bold_it: generateBoldCoverLetterIT(company, role, jdText, profile),
        storytelling_it: generateStorytellingCoverLetterIT(company, role, jdText, profile),
        standard_en: generateStandardCoverLetterEN(company, role, jdText, profile),
        bold_en: generateBoldCoverLetterEN(company, role, jdText, profile),
        storytelling_en: generateStorytellingCoverLetterEN(company, role, jdText, profile)
    };
}

function generateStandardCoverLetterIT(company, role, jdText, profile) {
    const industry = detectIndustry(jdText);
    const isProduct = /product.*management|product.*owner/i.test(role);
    const isMedia = /media|advertising|marketing/i.test(role);
    
    let letter = `Oggetto: Candidatura per ${role} - ${company}

Gentile Team Selezione ${company},

desidero candidarmi per la posizione di ${role}. Con oltre ${profile.yearsExp} anni di esperienza in digital marketing e gestione di campagne per brand internazionali, ritengo di poter portare un contributo concreto al vostro team.

Nel mio ruolo attuale di Digital Consultant presso UM Italia, mi occupo della definizione di strategie digitali annuali e del lancio di nuovi prodotti per clienti automotive, fashion e medical device. L'esperienza diretta nell'analisi dei trend di mercato, nella collaborazione con team cross-funzionali (IT, Legali, Marketing) per portare prodotti digitali sul mercato, nella collaborazione con team cross-funzionali per garantire esecuzione ottimale delle campagne.

Un aspetto che mi differenzia è l'integrazione di competenze in AI applicate al marketing, certificate attraverso corsi specializzati (AI for Marketing, Fastweb Digital Academy). Sono motivato dalla possibilità di contribuire agli obiettivi di ${company} e mettere a disposizione un approccio analitico e orientato ai risultati.

Resto a disposizione per un colloquio conoscitivo.

Cordiali saluti,
${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}

function generateBoldCoverLetterIT(company, role, jdText, profile) {
    let letter = `OGGETTO: ${role} @ ${company} - Candidatura ${profile.name}

📊 NUMERI CHE CONTANO

• ${profile.yearsExp}+ anni ottimizzando campagne per brand internazionali (${profile.brandsManaged.slice(0, 3).join(', ')})
• End-to-end media strategies: dalla strategia annuale al tracking KPI post-lancio
• Data-driven: Power BI dashboards, implementando ottimizzazioni che hanno portato miglioramenti medi del 25%

🎯 COSA FAREI PER ${company.toUpperCase()}

✓ Porterei esperienza diretta in product launch e strategie go-to-market
✓ Analisi continua di trend e metriche per decisioni data-informed
✓ Approccio cross-funzionale già testato in contesti enterprise

💡 IL MIO VANTAGGIO

AI per marketing non è futuro, è presente. Certificato in AI for Marketing (Fastweb Digital Academy), Prompt Engineering, e tool avanzati. Questo significa automation, insights più veloci, decisioni migliori.

Disponibile per call conoscitiva.

Best,
${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}

function generateStorytellingCoverLetterIT(company, role, jdText, profile) {
    let letter = `Oggetto: Candidatura per ${role} - Una storia di dati, creatività e risultati

Gentile team ${company},

quando Honda mi ha chiesto di lanciare la nuova gamma ibrida in Italia, non si trattava solo di media planning. Era costruire una narrativa che connettesse innovazione tecnologica con sostenibilità, traducendo feature tecniche in benefit emozionali, e misurare ogni touchpoint del customer journey.

Sono ${profile.name}, Digital Consultant con ${profile.yearsExp} anni nel mondo delle strategie digitali per brand internazionali. La mia carriera è stata guidata da una curiosità: come trasformare dati complessi in decisioni che muovono i mercati?

In ${company}, vedo l'opportunità di applicare questa stessa filosofia al ruolo di ${role}. L'esperienza in automotive, fashion e medical device mi ha insegnato che ogni settore ha dinamiche uniche, ma il metodo rimane: ascoltare i dati, collaborare cross-functionally, iterare rapidamente.

Ciò che mi distingue? L'integrazione tra marketing tradizionale e AI. Non parlo di buzzword, ma di certificazioni concrete (AI for Marketing, Prompt Engineering) che uso quotidianamente per automazioni, analisi predittive e ottimizzazioni creative.

Resto a disposizione per raccontarvi come posso contribuire agli obiettivi di ${company}.

Cordialmente,
${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}

function generateStandardCoverLetterEN(company, role, jdText, profile) {
    const industry = detectIndustry(jdText);
    
    let letter = `Subject: Application for ${role} - ${company}

Dear ${company} Hiring Team,

I am writing to express my interest in the ${role} position. With over ${profile.yearsExp} years of experience in digital marketing and performance analysis for international brands, I am confident in my ability to contribute meaningfully to your team.

In my current role as Digital Consultant at UM Italia, I develop end-to-end media strategies and manage product launches for automotive, fashion, and medical device clients. My experience includes defining annual digital roadmaps, analyzing market trends, and collaborating with cross-functional teams (IT, Legal, Marketing) to bring digital products to market.

What sets me apart is my integration of AI skills into marketing workflows, certified through specialized courses (AI for Marketing, Fastweb Digital Academy, Prompt Engineering). I am motivated by the opportunity to contribute to ${company}'s objectives with a data-driven, results-oriented approach.

I would welcome the opportunity to discuss how my background aligns with your needs.

Best regards,
${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}

function generateBoldCoverLetterEN(company, role, jdText, profile) {
    let letter = `SUBJECT: ${role} @ ${company} - ${profile.name} Application

📊 NUMBERS THAT MATTER

• ${profile.yearsExp}+ years optimizing campaigns for international brands (${profile.brandsManaged.slice(0, 3).join(', ')})
• End-to-end media strategies: from annual planning to post-launch KPI tracking
• Data-driven: Power BI dashboards, implementing optimizations resulting in 25% average improvement

🎯 WHAT I'D BRING TO ${company.toUpperCase()}

✓ Hands-on product launch and go-to-market strategy experience
✓ Continuous trend and metrics analysis for data-informed decisions
✓ Cross-functional approach tested in enterprise contexts

💡 MY EDGE

AI for marketing isn't future, it's now. Certified in AI for Marketing (Fastweb Digital Academy), Prompt Engineering, and advanced tools. This means automation, faster insights, better decisions.

Available for intro call.

Best,
${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}

function generateStorytellingCoverLetterEN(company, role, jdText, profile) {
    let letter = `Subject: Application for ${role} - A story of data, creativity, and results

Dear ${company} team,

When Honda asked me to launch their new hybrid lineup in Italy, it wasn't just about media planning. It was about building a narrative connecting technological innovation with sustainability, translating technical features into emotional benefits, and measuring every customer journey touchpoint.

I'm ${profile.name}, Digital Consultant with ${profile.yearsExp} years in digital strategy for international brands. My career has been guided by curiosity: how to transform complex data into market-moving decisions?

At ${company}, I see the opportunity to apply this same philosophy to the ${role} position. My experience across automotive, fashion, and medical device has taught me that every sector has unique dynamics, but the method remains: listen to data, collaborate cross-functionally, iterate rapidly.

What sets me apart? The integration of traditional marketing with AI. Not buzzwords, but concrete certifications (AI for Marketing, Prompt Engineering) that I use daily for automation, predictive analytics, and creative optimization.

I'd welcome the chance to discuss how I can contribute to ${company}'s goals.

Best regards,
${profile.name}
${profile.email} | ${profile.phone}`;
    
    return letter;
}
// ============================================
// AI-GENERATED COVER LETTER (API)
// ============================================
async function generateCoverLetterWithAI(company, role, jdText, profile) {
    try {
        console.log('🤖 Generating AI cover letter via Netlify function...');
        
        const prompt = `You are an expert career consultant. Generate a professional cover letter in Italian for this application.

CANDIDATE PROFILE:
- Name: ${profile.name}
- Current Role: ${profile.currentRole} at ${profile.company}
- Years of Experience: ${profile.yearsExp}
- Core Skills: ${profile.coreSkills.slice(0, 10).join(', ')}
- Brands Managed: ${profile.brandsManaged.join(', ')}
- Industries: ${profile.industries.join(', ')}
${profile.aiCertifications ? `- AI Certifications: ${profile.aiCertifications.join(', ')}` : ''}

TARGET POSITION:
- Company: ${company}
- Role: ${role}
- Job Description (first 1500 chars): ${jdText.substring(0, 1500)}

REQUIREMENTS:
1. Write in ITALIAN language
2. Professional corporate tone
3. Length: 250-300 words
4. Structure:
   - Opening: Express interest and mention ${profile.yearsExp}+ years experience
   - Body: Connect candidate's experience to specific JD requirements
   - Highlight transferable skills even if industry different
   - Mention concrete achievements with brands managed
   - Reference AI skills as competitive advantage if relevant to role
   - Closing: Express enthusiasm and availability
5. Be SPECIFIC: Reference actual keywords from JD
6. Avoid generic phrases
7. Show understanding of company's needs based on JD
8. End with: "Cordiali saluti, ${profile.name}, ${profile.email} | ${profile.phone}"

Generate ONLY the cover letter text, no additional commentary.`;

        const response = await fetch('/.netlify/functions/validate-keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                maxTokens: 800
            })
        });
        
        if (!response.ok) {
            console.warn('⚠️ AI cover letter generation failed, using template fallback');
            return null;
        }
        
        const data = await response.json();
        
        if (data.coverLetter && data.coverLetter.length > 100) {
            console.log('✅ AI cover letter generated successfully');
            return data.coverLetter;
        }
        
        console.warn('⚠️ AI response invalid, using template fallback');
        return null;
        
    } catch (error) {
        console.error('❌ AI cover letter error:', error);
        return null;
    }
}
// ============================================
// AI-GENERATED ABOUT ME
// ============================================
async function generateAboutMeWithAI(jdText, profile) {
    try {
        console.log('🤖 Generating AI About Me via Netlify function...');
        
        const prompt = `You are an expert career consultant. Generate a professional "About Me" section for a CV in English.

CANDIDATE PROFILE:
- Name: ${profile.name}
- Current Role: ${profile.currentRole} at ${profile.company}
- Years of Experience: ${profile.yearsExp}
- Core Skills: ${profile.coreSkills.join(', ')}
- Brands Managed: ${profile.brandsManaged.join(', ')}
- Industries: ${profile.industries.join(', ')}
${profile.aiCertifications ? `- AI Certifications: ${profile.aiCertifications.join(', ')}` : ''}

TARGET JOB DESCRIPTION (first 1000 chars):
${jdText.substring(0, 1000)}

REQUIREMENTS:
1. Length: 60-80 words EXACTLY
2. Professional tone, suitable for CV
3. Start with role title and years of experience
4. Mention 2-3 most relevant skills from candidate's profile that match JD requirements
5. Include brands managed (${profile.brandsManaged.slice(0, 3).join(', ')})
6. Reference tools/platforms ONLY if candidate has them AND JD mentions them
7. If JD emphasizes specific areas (CRM, retention, segmentation, etc.) and candidate has related skills, highlight those
8. End with differentiator (AI skills if relevant to JD, or data-driven approach)
9. Write in THIRD PERSON
10. Be SPECIFIC and TRUTHFUL - don't invent skills

Generate ONLY the About Me text, no additional commentary.`;

        const response = await fetch('/.netlify/functions/validate-keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                maxTokens: 200
            })
        });
        
        if (!response.ok) {
            console.warn('⚠️ AI About Me generation failed, using local fallback');
            return null;
        }
        
        const data = await response.json();
        
        if (data.coverLetter && data.coverLetter.length > 50) {
            console.log('✅ AI About Me generated successfully');
            return data.coverLetter;
        }
        
        console.warn('⚠️ AI About Me invalid, using local fallback');
        return null;
        
    } catch (error) {
        console.error('❌ AI About Me error:', error);
        return null;
    }
}

// ============================================
// AI-GENERATED CV SUGGESTIONS
// ============================================
async function generateCVSuggestionsWithAI(jdText, profile, reqs) {
    try {
        console.log('🤖 Generating AI CV Suggestions via Netlify function...');
        
        const prompt = `You are an expert career consultant. Generate specific, actionable CV improvement suggestions.

CANDIDATE PROFILE:
- Years of Experience: ${profile.yearsExp}
- Core Skills: ${profile.coreSkills.join(', ')}
- Brands Managed: ${profile.brandsManaged.join(', ')}
- Industries: ${profile.industries.join(', ')}

JOB REQUIREMENTS:
- Required Tools: ${reqs.tools.map(t => t.name).join(', ')}
- Hard Skills: ${reqs.hardSkills.join(', ')}
- Experience Years: ${reqs.experienceYears || 'Not specified'}

JOB DESCRIPTION (first 1000 chars):
${jdText.substring(0, 1000)}

TASK: Generate 5-7 CONDITIONAL work experience bullet suggestions in Italian.

FORMAT REQUIREMENTS:
1. Use these prefixes:
   - "✏️ Se hai esperienza in [X], aggiungi: \"[bullet point]\""
   - "⚠️ La JD enfatizza [X] - ce l'hai? Se sì, evidenzialo così: \"[bullet point]\""
   - "💡 La tua esperienza in [Y] può essere inquadrata come [X]: \"[bullet point]\""

2. Suggestions should be CONDITIONAL (IF candidate has experience)
3. Match specific JD requirements
4. Reference candidate's actual brands/industries where relevant
5. Include metrics placeholders (X%, Y increase, etc.)
6. Be HONEST - don't suggest fabricating experience

Generate 5-7 bullet suggestions in Italian, one per line, following the format above.`;

        const response = await fetch('/.netlify/functions/validate-keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                maxTokens: 500
            })
        });
        
        if (!response.ok) {
            console.warn('⚠️ AI CV Suggestions failed, using local fallback');
            return null;
        }
        
        const data = await response.json();
        
        if (data.coverLetter && data.coverLetter.length > 50) {
            console.log('✅ AI CV Suggestions generated successfully');
            const bullets = data.coverLetter.split('\n').filter(line => line.trim().length > 0);
            return bullets;
        }
        
        console.warn('⚠️ AI CV Suggestions invalid, using local fallback');
        return null;
        
    } catch (error) {
        console.error('❌ AI CV Suggestions error:', error);
        return null;
    }
}

// ============================================
// AI-GENERATED GAP ANALYSIS
// ============================================
async function generateGapAnalysisWithAI(jdText, profile, competitiveAnalysis) {
    try {
        console.log('🤖 Generating AI Gap Analysis via Netlify function...');
        
        const prompt = `You are an expert career strategist. Analyze skill gaps and provide positioning strategies.

CANDIDATE PROFILE:
- Years of Experience: ${profile.yearsExp}
- Core Skills: ${profile.coreSkills.join(', ')}
- Brands Managed: ${profile.brandsManaged.join(', ')}
- Industries: ${profile.industries.join(', ')}

COMPETITIVE ANALYSIS:
- Overall Score: ${competitiveAnalysis.overall}%
- Experience Match: ${competitiveAnalysis.experienceMatch}%
- Tools Coverage: ${competitiveAnalysis.toolsCoverage}%
- Industry Fit: ${competitiveAnalysis.industryFit}%
- Weaknesses: ${competitiveAnalysis.weaknesses.join('; ')}

JOB DESCRIPTION (first 1000 chars):
${jdText.substring(0, 1000)}

TASK: Identify 2-4 critical skill gaps and provide positioning strategies.

CRITICAL RULES:
1. Output ONLY valid JSON - NO markdown, NO backticks, NO explanations
2. Maximum 3 gaps
3. Write in Italian
4. Keep each field under 150 characters
5. NO line breaks inside strings

Output format (EXACTLY like this, nothing else):
[{"gap":"Skill Name","analysis":"Short analysis","positioning":"Strategy here"}]

Example:
[{"gap":"CRM Platform Management","analysis":"Hai usato tool di customer data? Aggiungilo al CV.","positioning":"Inquadra Power BI come 'CRM data management' - è skill trasferibile"}]

Now generate 2-3 critical gaps for this candidate in the EXACT format above.`;

        const response = await fetch('/.netlify/functions/validate-keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                maxTokens: 600
            })
        });
        
        if (!response.ok) {
            console.warn('⚠️ AI Gap Analysis failed, using local fallback');
            return null;
        }
        
        const data = await response.json();
        
        if (data.coverLetter) {
            try {
                // Aggressive cleanup
                let cleanText = data.coverLetter
                    .replace(/```json|```javascript|```/g, '')  // Remove markdown
                    .replace(/^[^[]*/, '')  // Remove everything before first [
                    .replace(/[^\]]*$/, '')  // Remove everything after last ]
                    .trim();
                
                // Ensure it starts with [ and ends with ]
                if (!cleanText.startsWith('[')) {
                    cleanText = '[' + cleanText;
                }
                if (!cleanText.endsWith(']')) {
                    cleanText = cleanText + ']';
                }
                
                // Log for debugging
                console.log('📋 Attempting to parse:', cleanText.substring(0, 100) + '...');
                
                const gaps = JSON.parse(cleanText);
                
                if (Array.isArray(gaps) && gaps.length > 0 && gaps[0].gap) {
                    console.log('✅ AI Gap Analysis generated successfully:', gaps.length, 'gaps');
                    return gaps;
                } else {
                    console.warn('⚠️ Parsed but invalid structure');
                }
            } catch (parseError) {
                console.error('⚠️ AI Gap Analysis parse error:', parseError.message);
                console.log('Raw response:', data.coverLetter.substring(0, 200));
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ AI Gap Analysis error:', error);
        return null;
    }
}
// ============================================
// DETAILED CV SUGGESTIONS - CONDITIONAL
// ============================================
function generateDetailedCVSuggestions(jdText, reqs, profileSkills, industry, profile) {
    const template = getIndustryTemplate(industry);
    const jdLower = jdText.toLowerCase();
    
    const suggestions = {
        workExperienceBullets: [],
        skillsToHighlight: [],
        skillsToAdd: [],
        keywordSuggestions: {
            highPriority: [],
            mediumPriority: [],
            lowPriority: []
        },
        gapAnalysis: [],
        atsKeywordChecklist: {},
        predictedScore: ''
    };
    
    // CONDITIONAL WORK EXPERIENCE SUGGESTIONS
    if (/crm|customer\s+relationship/i.test(jdText)) {
        suggestions.workExperienceBullets.push(
            "✏️ If you've used CRM platforms, add: \"Managed customer data and segmentation using CRM tools to personalize marketing campaigns\"",
            "⚠️ JD emphasizes CRM - if you have experience with Salesforce, HubSpot, or similar, highlight it"
        );
    }
    
    if (/segmentation|clustering|personalization/i.test(jdText)) {
        suggestions.workExperienceBullets.push(
            "✏️ If you've segmented customers by behavior/demographics, add: \"Developed customer segmentation strategies based on behavioral data, increasing campaign relevance\"",
            "💡 Your Power BI/GA4 experience counts as segmentation work - frame it this way"
        );
    }
    
    if (/vip|high.value|premium/i.test(jdText)) {
        if (profile.brandsManaged.some(b => /levi|acuvue|honda/i.test(b))) {
            suggestions.workExperienceBullets.push(
                `✏️ If you managed premium/high-value clients at ${profile.brandsManaged[0]}, frame as: "Oversaw VIP customer programs with dedicated support and personalized offerings"`
            );
        } else {
            suggestions.workExperienceBullets.push(
                "⚠️ JD requires VIP management - do you have experience with high-value client relationships? Add if relevant."
            );
        }
    }
    
    if (/retention|churn|loyalty/i.test(jdText)) {
        suggestions.workExperienceBullets.push(
            "✏️ If you ran campaigns to reduce churn, add: \"Implemented retention strategies through targeted re-engagement campaigns, reducing churn by X%\"",
            "💡 Your campaign optimization work likely improved retention - quantify the impact"
        );
    }
    
    if (/acquisition|lead.*generation/i.test(jdText)) {
        suggestions.workExperienceBullets.push(
            "✏️ If campaigns drove new customer acquisition, add: \"Designed acquisition campaigns across paid channels, achieving X% increase in new customer sign-ups\"",
            `💡 Your Meta/Google Ads experience (${profile.brandsManaged.join(', ')}) is acquisition work - frame it explicitly`
        );
    }
    
    // Generic bullets if not enough
    if (suggestions.workExperienceBullets.length < 3) {
        suggestions.workExperienceBullets.push(
            `${template.verbs[0].charAt(0).toUpperCase() + template.verbs[0].slice(1)} performance marketing campaigns across Meta, Google, TikTok with clear KPIs and ROI targets`,
            `${template.verbs[3].charAt(0).toUpperCase() + template.verbs[3].slice(1)} in-depth analysis using GA4 and Power BI dashboards to identify optimization opportunities`
        );
    }
    
    // SKILLS TO HIGHLIGHT
    const toolsInProfile = profileSkills.filter(skill => 
        reqs.tools.some(tool => 
            skill.toLowerCase().includes(tool.name.toLowerCase())
        )
    );
    
    if (toolsInProfile.length > 0) {
        suggestions.skillsToHighlight = toolsInProfile.slice(0, 6);
    }
    
    // SKILLS TO ADD
    const missingTools = reqs.tools.filter(tool =>
        !profileSkills.some(skill =>
            skill.toLowerCase().includes(tool.name.toLowerCase())
        )
    );
    
    if (missingTools.length > 0) {
        suggestions.skillsToAdd = missingTools.slice(0, 5).map(tool => ({
            name: tool.name,
            suggestion: "⚠️ JD mentions this - add ONLY if you have genuine experience"
        }));
    }
    
    // KEYWORD SUGGESTIONS
    const allKeywords = extractKeywordsFromJD(jdText);
    
    allKeywords.forEach(kw => {
        const count = kw.count;
        const score = kw.score;
        
        if (count >= 5 || score > 2.0) {
            suggestions.keywordSuggestions.highPriority.push(kw.word);
        } else if (count >= 3 || score > 1.5) {
            suggestions.keywordSuggestions.mediumPriority.push(kw.word);
        } else if (count >= 2) {
            suggestions.keywordSuggestions.lowPriority.push(kw.word);
        }
    });
    
    suggestions.keywordSuggestions.highPriority = suggestions.keywordSuggestions.highPriority.slice(0, 5);
    suggestions.keywordSuggestions.mediumPriority = suggestions.keywordSuggestions.mediumPriority.slice(0, 5);
    suggestions.keywordSuggestions.lowPriority = suggestions.keywordSuggestions.lowPriority.slice(0, 5);
    
    // GAP ANALYSIS
    const criticalGaps = [];
    
    if (/crm/i.test(jdText) && !profileSkills.some(s => /crm/i.test(s))) {
        criticalGaps.push({
            gap: "CRM Platform Management (Salesforce, HubSpot)",
            analysis: "Do you have this? If yes, ADD IT to CV. If no, consider if quickly learnable.",
            positioning: "If you've used any customer database/analytics tool, you can frame as 'CRM data management'"
        });
    }
    
    if (/vip|premium|high.value/i.test(jdText)) {
        criticalGaps.push({
            gap: "VIP/High-Value Customer Management",
            analysis: `Have you managed premium clients at ${profile.brandsManaged.join('/')}?`,
            positioning: "Frame luxury brand experience (Levi's, Honda) as 'premium customer engagement' - transferable skill"
        });
    }
    
    const industryMatch = jdText.match(/\b(gaming|betting|casino|lottery|gambling)\b/gi);
    if (industryMatch && !profile.industries.some(i => /gaming|betting/i.test(i))) {
        criticalGaps.push({
            gap: `${industryMatch[0]} Industry Knowledge`,
            analysis: "You don't have direct industry experience.",
            positioning: `STRATEGY: Position automotive/fashion as "premium consumer engagement" - emphasize transferable skills (data analysis, campaign optimization, customer insights)`
        });
    }
    
    suggestions.gapAnalysis = criticalGaps;
    
    // ATS CHECKLIST
    const keywordCategories = {
        'Role/Function': [],
        'Skills/Competencies': [],
        'Tools/Platforms': [],
        'Soft Skills': []
    };
    
    if (/digital marketing/i.test(jdText)) keywordCategories['Role/Function'].push('Digital Marketing');
    if (/product.*management/i.test(jdText)) keywordCategories['Role/Function'].push('Product Management');
    if (/media.*planning/i.test(jdText)) keywordCategories['Role/Function'].push('Media Planning');
    
    if (reqs.hardSkills.length > 0) {
        keywordCategories['Skills/Competencies'] = reqs.hardSkills.slice(0, 6);
    }
    
    if (reqs.tools.length > 0) {
        keywordCategories['Tools/Platforms'] = reqs.tools.slice(0, 6).map(t => t.name);
    }
    
    if (reqs.softSkills.length > 0) {
        keywordCategories['Soft Skills'] = reqs.softSkills.slice(0, 4);
    }
    
    suggestions.atsKeywordChecklist = keywordCategories;
    
    return suggestions;
}

function extractKeywordsFromJD(jdText) {
    const words = jdText.toLowerCase().match(/\b[a-zàèéìòù]{4,}\b/g) || [];
    const counts = {};
    
    words.forEach(word => {
        if (!stopwords.has(word)) {
            counts[word] = (counts[word] || 0) + 1;
        }
    });
    
    return Object.entries(counts)
        .map(([word, count]) => ({
            word,
            count,
            score: calculateTFIDF(word, jdText)
        }))
        .filter(kw => kw.count >= 2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
}
// Part 4: Email System, ATS Scoring (Fuzzy Match), Main Generation Function

// ============================================
// ATS SCORE CALCULATOR - FUZZY MATCHING
// ============================================
function calculateATSScore(documentText, jdKeywords) {
    const matches = [];
    const missing = [];
    
    jdKeywords.forEach(kw => {
        const word = kw.word.toLowerCase();
        const docLower = documentText.toLowerCase();
        
        // Exact match
        const exactRegex = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'i');
        if (exactRegex.test(docLower)) {
            matches.push(kw.word);
            return;
        }
        
        // Fuzzy match for compound keywords
        if (word.includes(' ')) {
            const parts = word.split(' ').filter(p => p.length > 3);
            const allPartsMatch = parts.every(part => 
                new RegExp(`\\b${part}\\b`, 'i').test(docLower)
            );
            if (allPartsMatch) {
                matches.push(kw.word);
                return;
            }
        }
        
        // Partial match
        if (word.length > 4) {
            const partialRegex = new RegExp(`\\b\\w*${word}\\w*\\b`, 'i');
            if (partialRegex.test(docLower)) {
                matches.push(kw.word);
                return;
            }
        }
        
        missing.push(kw.word);
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
// EMAIL SYSTEM
// ============================================
async function previewEmail(analysisId) {
    const analysis = StorageManager.getAnalysis(analysisId);
    if (!analysis) {
        alert('Analysis not found');
        return;
    }
    
    const recipientEmail = document.getElementById('recipientEmail').value.trim();
    const coverLetter = document.getElementById('editableCoverLetter').value.trim();
    
    if (!recipientEmail) {
        alert('Please enter recipient email address');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
        alert('Please enter a valid email address');
        return;
    }
    
    if (!coverLetter) {
        alert('Cover letter is empty');
        return;
    }
    
    const modalHTML = `
        <div id="emailPreviewModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-top: 0;">📧 Email Preview</h2>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0;"><strong>To:</strong> ${recipientEmail}</p>
                    <p style="margin: 5px 0;"><strong>Subject:</strong> Candidatura per ${analysis.role} - ${martinoProfile.name}</p>
                </div>
                
                <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px; white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6;">
${coverLetter}
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold;">⚠️ Important Instructions:</p>
                    <ol style="margin: 5px 0; padding-left: 20px; font-size: 14px;">
                        <li>Gmail will open - the cover letter will be in the email body</li>
                        <li><strong>YOU MUST MANUALLY ATTACH YOUR CV PDF/DOCX</strong></li>
                        <li>Attach your portfolio if applicable</li>
                        <li>Review everything before clicking Send in Gmail</li>
                        <li>(Optional) Install Mailtrack Chrome extension to track email opens</li>
                    </ol>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button id="confirmSendEmailBtn" style="flex: 1; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        ✅ Open Gmail & Send
                    </button>
                    <button onclick="document.getElementById('emailPreviewModal').remove()" style="flex: 1; padding: 12px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('confirmSendEmailBtn').addEventListener('click', () => {
        document.getElementById('emailPreviewModal').remove();
        approveAndSendEmail(analysisId, recipientEmail, coverLetter, analysis);
    });
}

function approveAndSendEmail(analysisId, recipientEmail, coverLetter, analysis) {
    const result = sendApplicationEmail(recipientEmail, analysis.company, analysis.role, coverLetter);
    
    if (result.success) {
        StorageManager.markAsSent(analysisId, { recipientEmail });
        showSuccessModal(analysis.company);
    } else {
        alert(result.error);
    }
}

function sendApplicationEmail(recipientEmail, company, role, coverLetter) {
    const subject = `Candidatura per ${role} - ${martinoProfile.name}`;
    const body = coverLetter;
    
    const mailtoLink = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    const popup = window.open(mailtoLink, '_blank');
    
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        return {
            success: false,
            error: 'Popup blocked. Please allow popups for this site and try again.'
        };
    }
    
    return { success: true };
}

function showSuccessModal(company) {
    const modal = `
        <div id="successModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                <h2 style="color: #4CAF50; margin-top: 0;">Email Opened in Gmail!</h2>
                <p style="margin: 20px 0;">Remember to:</p>
                <ol style="text-align: left; margin: 20px 0;">
                    <li style="margin-bottom: 10px;">📎 <strong>Attach your CV PDF/DOCX</strong></li>
                    <li style="margin-bottom: 10px;">📂 Attach your portfolio (if applicable)</li>
                    <li style="margin-bottom: 10px;">✉️ Click Send in Gmail</li>
                </ol>
                <p style="font-size: 13px; color: #666; margin-top: 20px;">💡 Tip: Install Mailtrack to see when ${company} opens your email</p>
                <p style="font-size: 13px; color: #666; margin-top: 10px;">⏰ Reminder: Add feedback in 15 days</p>
                <button onclick="document.getElementById('successModal').remove()" style="margin-top: 20px; padding: 12px 30px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Got it!
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// ============================================
// TAB SWITCHING
// ============================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeButton = Array.from(document.querySelectorAll('.tab-button')).find(btn => 
        btn.textContent.toLowerCase().includes(tabName.toLowerCase())
    );
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    const activeContent = document.getElementById(tabName);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

// ============================================
// MAIN GENERATION FUNCTION - MARTINO MODE
// ============================================
async function generateDocumentsMartino() {
    const company = document.getElementById('companyName').value.trim();
    const role = document.getElementById('roleName').value.trim();
    const jd = document.getElementById('jdText').value.trim();
    
    if (!company || !role || !jd) {
        alert('Please fill in all fields');
        return;
    }
    
    const loadingDiv = document.getElementById('loadingMartino');
    const resultsDiv = document.getElementById('resultsMartino');
    
    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    
    setTimeout(async () => {
        try {
            const industry = detectIndustry(jd);
            
            const keywords = await extractKeywordsAdvanced(jd, 15);
            
            const reqs = extractRequirements(jd);
            
            // Try AI-generated cover letter first
            const aiCoverLetter = await generateCoverLetterWithAI(company, role, jd, martinoProfile);
            
            // Generate template variants as fallback
            const coverLetterVariants = generateCoverLetterVariantsBilingual(company, role, jd, martinoProfile);
            
            // Use AI if available, otherwise use standard template
            if (aiCoverLetter) {
                coverLetterVariants.ai_generated_it = aiCoverLetter;
                console.log('✅ Using AI-generated cover letter');
            } else {
                console.log('⚠️ Using template-based cover letter (AI fallback)');
            }
            
            // Generate About Me with AI (parallel with CV suggestions)
            const [aiAboutMe, aiCVSuggestions] = await Promise.all([
                generateAboutMeWithAI(jd, martinoProfile),
                generateCVSuggestionsWithAI(jd, martinoProfile, reqs)
            ]);
            
            // Use AI About Me or fallback to local
            const aboutMe = aiAboutMe || generateCVAboutSectionMartino(jd, martinoProfile);
            
            // Generate local suggestions as base
            const detailedSuggestions = generateDetailedCVSuggestions(jd, reqs, martinoProfile.coreSkills, industry, martinoProfile);
            
            // Override with AI suggestions if available
            if (aiCVSuggestions && aiCVSuggestions.length > 0) {
                detailedSuggestions.workExperienceBullets = aiCVSuggestions;
                console.log('✅ Using AI-generated CV suggestions');
            } else {
                console.log('⚠️ Using template-based CV suggestions (AI fallback)');
            }
            
            const competitiveAnalysis = generateCompetitiveAnalysis(jd, martinoProfile);
            
            // Generate Gap Analysis with AI
            const aiGapAnalysis = await generateGapAnalysisWithAI(jd, martinoProfile, competitiveAnalysis);
            
            // Override local gap analysis if AI succeeded
            if (aiGapAnalysis && aiGapAnalysis.length > 0) {
                detailedSuggestions.gapAnalysis = aiGapAnalysis;
                console.log('✅ Using AI-generated gap analysis');
            } else {
                console.log('⚠️ Using local gap analysis (AI fallback)');
            }
            
            const cvText = `${martinoProfile.name}\n${martinoProfile.coreSkills.join(', ')}\n${aboutMe}`;

            const atsScore = calculateATSScore(cvText, keywords);
            
            const detectedEmail = extractEmailFromJD(jd);
            
            const results = {
                company,
                role,
                industry,
                keywords,
                coverLetterVariants,
                coverLetter: coverLetterVariants.standard_it,
                aboutMe,
                detailedSuggestions,
                competitiveAnalysis,
                atsScore,
                detectedEmail
            };
            
            const analysisId = StorageManager.saveAnalysis(company, role, results, 'martino');
            
            displayResultsMartino(results, analysisId);
            
            loadingDiv.style.display = 'none';
            
        } catch (error) {
            console.error('Generation error:', error);
            loadingDiv.style.display = 'none';
            alert('Error generating documents. Check console for details.');
        }
    }, 60000);
}
// Part 5: Display Results (with Gap Analysis + Keywords), History, Generic Mode, File Handlers

// ============================================
// DISPLAY RESULTS - MARTINO MODE
// ============================================
function displayResultsMartino(results, analysisId) {
    const compLevel = getCompetitivenessLevel(results.competitiveAnalysis.overall);
    
    window.currentCoverLetterVariants = results.coverLetterVariants;
    window.currentCompany = results.company;
    window.currentRole = results.role;
    window.currentAnalysisResults = {
        ...results,
        selectedStyle: 'standard_it',
        analysisId
    };
    
    const resultsHTML = `
        <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <h2 style="margin-top: 0; color: white;">✅ Analysis Complete: ${results.company}</h2>
            <p style="font-size: 18px; margin: 0;">${results.role}</p>
        </div>
        
        <div class="card">
            <h3 style="color: #667eea;">📊 COMPETITIVE ANALYSIS</h3>
            
            <div style="text-align: center; margin: 20px 0;">
                <div style="display: inline-block; background: ${compLevel.color}; color: white; padding: 15px 30px; border-radius: 50px; font-size: 18px; font-weight: bold;">
                    Overall: ${results.competitiveAnalysis.overall}% - ${compLevel.label}
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0;">
                <div style="text-align: center; padding: 15px; background: #f0f4ff; border-radius: 8px;">
                    <div style="font-size: 32px; font-weight: bold; color: #667eea;">${results.competitiveAnalysis.experienceMatch}%</div>
                    <div style="font-size: 14px; color: #666;">Experience Match</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #f0f4ff; border-radius: 8px;">
                    <div style="font-size: 32px; font-weight: bold; color: #667eea;">${results.competitiveAnalysis.toolsCoverage}%</div>
                    <div style="font-size: 14px; color: #666;">Tools Coverage</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #f0f4ff; border-radius: 8px;">
                    <div style="font-size: 32px; font-weight: bold; color: #667eea;">${results.competitiveAnalysis.industryFit}%</div>
                    <div style="font-size: 14px; color: #666;">Industry Fit</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                <div>
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #4caf50;">✅ Strengths:</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                        ${results.competitiveAnalysis.strengths.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
                ${results.competitiveAnalysis.weaknesses.length > 0 ? `
                <div>
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #ff9800;">⚠️ Weaknesses:</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                        ${results.competitiveAnalysis.weaknesses.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            
            <div style="background: #fff9e6; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin-top: 15px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #e65100;">🎯 STRATEGIC POSITIONING:</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
                    ${results.competitiveAnalysis.positioning.map(p => `<li style="margin-bottom: 8px;">${p}</li>`).join('')}
                </ul>
            </div>
        </div>
        
        <div class="card">
            <h3 style="color: #667eea;">${results.atsScore.score >= 70 ? '✅' : results.atsScore.score >= 50 ? '⚠️' : '❌'} ATS Match Score</h3>
            
            <div style="text-align: center; margin: 20px 0;">
                <div style="display: inline-block; font-size: 64px; font-weight: bold; color: ${results.atsScore.score >= 70 ? '#4caf50' : results.atsScore.score >= 50 ? '#ff9800' : '#f44336'};">
                    ${results.atsScore.score}%
                </div>
                <p style="margin: 10px 0 0 0; color: #666;">
                    ${results.atsScore.matchedKeywords} of ${results.atsScore.totalKeywords} keywords matched
                </p>
            </div>
            
            ${results.atsScore.matches.length > 0 ? `
            <div style="margin-bottom: 15px;">
                <p style="font-weight: 600; color: #4caf50; margin-bottom: 8px;">✅ Keyword Matchate (${results.atsScore.matches.length}):</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${results.atsScore.matches.map(kw => 
                        `<span style="background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 4px; font-size: 13px;">${kw}</span>`
                    ).join('')}
                </div>
            </div>
            ` : ''}
            
            ${results.atsScore.missing.length > 0 ? `
            <div>
                <p style="font-weight: 600; color: #ff9800; margin-bottom: 8px;">⚠️ Keyword Mancanti (${results.atsScore.missing.length}):</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${results.atsScore.missing.map(kw => 
                        `<span style="background: #fff3e0; color: #e65100; padding: 6px 12px; border-radius: 4px; font-size: 13px;">${kw}</span>`
                    ).join('')}
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="card">
            <h3 style="color: #667eea;">📝 Cover Letter - Scegli Stile & Lingua</h3>
            
            <select id="coverLetterStyleSelector" onchange="switchCoverLetterVariant()" style="width: 100%; padding: 12px; border: 2px solid #667eea; border-radius: 6px; font-size: 14px; margin-bottom: 15px;">
                ${results.coverLetterVariants.ai_generated_it ? '<option value="ai_generated_it">🤖 AI-Generated (Personalized) ⭐ RECOMMENDED</option>' : ''}
                <option value="standard_it" ${!results.coverLetterVariants.ai_generated_it ? 'selected' : ''}>🇮🇹 Standard (Corporate/Finance)</option>
                <option value="bold_it">🇮🇹 Bold (Startup/Tech)</option>
                <option value="storytelling_it">🇮🇹 Storytelling (Creative)</option>
                <option value="standard_en">🇬🇧 Standard (Corporate/Finance)</option>
                <option value="bold_en">🇬🇧 Bold (Startup/Tech)</option>
                <option value="storytelling_en">🇬🇧 Storytelling (Creative)</option>
            </select>
            
            <textarea id="editableCoverLetter" style="width: 100%; min-height: 400px; padding: 15px; border: 1px solid #ddd; border-radius: 6px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">${results.coverLetterVariants.ai_generated_it || results.coverLetter}</textarea>
            
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button onclick="copyToClipboard('editableCoverLetter')" style="flex: 1; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    📋 Copy
                </button>
                <button onclick="downloadCoverLetter()" style="flex: 1; padding: 12px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    💾 Download
                </button>
            </div>
        </div>
        
        <div class="card">
            <h3 style="color: #667eea;">👤 About Me CV</h3>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin-bottom: 15px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.7;">${results.aboutMe}</p>
            </div>
            <button onclick="copyToClipboard('aboutMeText')" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                📋 Copy
            </button>
            <textarea id="aboutMeText" style="position: absolute; left: -9999px;">${results.aboutMe}</textarea>
        </div>
        
        <div class="card">
            <h3 style="color: #667eea;">💡 Suggerimenti CV</h3>
            
            <h4 style="color: #2196f3; margin-top: 0;">📌 WORK EXPERIENCE</h4>
            <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                ${results.detailedSuggestions.workExperienceBullets.map(bullet => `<li>${bullet}</li>`).join('')}
            </ul>
            
            ${results.detailedSuggestions.skillsToHighlight.length > 0 ? `
            <h4 style="color: #4caf50; margin-top: 20px;">✅ Skills to Highlight (già nel tuo profilo)</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
                ${results.detailedSuggestions.skillsToHighlight.map(skill => 
                    `<span style="background: #e8f5e9; color: #2e7d32; padding: 8px 15px; border-radius: 6px; font-size: 13px;">${skill}</span>`
                ).join('')}
            </div>
            ` : ''}
            
            ${results.detailedSuggestions.atsKeywordChecklist && Object.keys(results.detailedSuggestions.atsKeywordChecklist).length > 0 ? `
            <h4 style="color: #667eea; margin-top: 20px;">✅ ATS Keyword Checklist</h4>
            ${Object.entries(results.detailedSuggestions.atsKeywordChecklist).map(([category, keywords]) => 
                keywords.length > 0 ? `
                <div style="margin-bottom: 15px;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 13px; color: #666;">✓ ${category}:</p>
                    <p style="margin: 0; font-size: 13px; color: #333;">${keywords.join(', ')}</p>
                </div>
                ` : ''
            ).join('')}
            ` : ''}
        </div>
        
        <div class="card">
            <h3 style="color: #ff9800;">⚠️ Skills Gap Analysis</h3>
            
            ${results.detailedSuggestions.gapAnalysis && results.detailedSuggestions.gapAnalysis.length > 0 ? `
                ${results.detailedSuggestions.gapAnalysis.map(gap => `
                    <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ff9800;">
                        <h4 style="margin: 0 0 10px 0; color: #e65100;">❌ Missing: ${gap.gap}</h4>
                        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Analysis:</strong> ${gap.analysis}</p>
                        <p style="margin: 0; font-size: 13px; background: #fffde7; padding: 10px; border-radius: 6px;"><strong>💡 Positioning Strategy:</strong> ${gap.positioning}</p>
                    </div>
                `).join('')}
            ` : '<p style="color: #666;">No critical gaps identified. Your profile aligns well with requirements.</p>'}
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin-top: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #1565c0;">📌 KEYWORD SUGGESTIONS FOR CV</h4>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #666;">Add these to a "Core Competencies" or "Keywords" section in your CV (ONLY if genuinely applicable)</p>
                
                ${results.detailedSuggestions.keywordSuggestions.highPriority.length > 0 ? `
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #d32f2f;">🔴 High Priority (mentioned 5+ times):</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${results.detailedSuggestions.keywordSuggestions.highPriority.map(kw => 
                                `<span style="background: #ffebee; color: #c62828; padding: 6px 12px; border-radius: 4px; font-size: 12px; border: 1px solid #ef9a9a;">${kw}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${results.detailedSuggestions.keywordSuggestions.mediumPriority.length > 0 ? `
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #f57c00;">🟠 Medium Priority (relevant to role):</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${results.detailedSuggestions.keywordSuggestions.mediumPriority.map(kw => 
                                `<span style="background: #fff3e0; color: #e65100; padding: 6px 12px; border-radius: 4px; font-size: 12px; border: 1px solid #ffb74d;">${kw}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${results.detailedSuggestions.keywordSuggestions.lowPriority.length > 0 ? `
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #388e3c;">🟢 Low Priority (nice to have):</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${results.detailedSuggestions.keywordSuggestions.lowPriority.map(kw => 
                                `<span style="background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 4px; font-size: 12px; border: 1px solid #81c784;">${kw}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <p style="margin: 15px 0 0 0; font-size: 12px; color: #d32f2f; font-weight: 600;">⚠️ Add these ONLY if you genuinely have the experience. Don't fabricate skills.</p>
            </div>
        </div>
        
        <div class="card">
            <h3 style="color: #667eea;">📧 Invia Candidatura via Email</h3>
            
            ${results.detectedEmail ? `
            <div style="background: #e8f5e9; padding: 10px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #4caf50;">
                <p style="margin: 0; font-size: 13px;">✅ Email rilevata automaticamente dalla job description</p>
            </div>
            ` : ''}
            
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Email Destinatario:</label>
            <input type="email" id="recipientEmail" value="${results.detectedEmail}" placeholder="hr@company.com" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; margin-bottom: 15px;">
            
            <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 15px;">
                <p style="margin: 0; font-size: 13px;">⚠️ Prima di inviare: Modifica la cover letter sopra secondo i suggerimenti, aggiungi le tue competenze chiave, personalizza!</p>
            </div>
            
            <button id="previewEmailBtn" style="width: 100%; padding: 15px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold;">
                📧 Preview & Send Email
            </button>
        </div>
    `;
    
    const resultsDiv = document.getElementById('resultsMartino');
    resultsDiv.innerHTML = resultsHTML;
    resultsDiv.style.display = 'block';
    
    document.getElementById('previewEmailBtn').addEventListener('click', () => {
        previewEmail(analysisId);
    });
}

// ============================================
// COVER LETTER VARIANT SWITCHER
// ============================================
function switchCoverLetterVariant() {
    const selectedStyle = document.getElementById('coverLetterStyleSelector').value;
    const variants = window.currentCoverLetterVariants;
    
    if (variants && variants[selectedStyle]) {
        document.getElementById('editableCoverLetter').value = variants[selectedStyle];
        
        if (window.currentAnalysisResults) {
            window.currentAnalysisResults.selectedStyle = selectedStyle;
        }
    }
}

// ============================================
// HISTORY & FEEDBACK
// ============================================
function showHistory() {
    const history = StorageManager.getHistory();
    
    const statusBadge = (entry) => {
        if (entry.feedbackCompleted) return '<span style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">✅ Completed</span>';
        if (entry.emailSent) return '<span style="background: #2196f3; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">📧 Sent</span>';
        return '<span style="background: #ff9800; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">📝 Draft</span>';
    };
    
    const modalHTML = `
        <div id="historyModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; overflow-y: auto; padding: 20px;">
            <div style="max-width: 1000px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
                <h2 style="margin-top: 0;">📂 Cronologia Candidature</h2>
                
                ${history.length === 0 ? '<p>Nessuna candidatura salvata.</p>' : `
                <div style="display: grid; gap: 15px;">
                    ${history.map(entry => `
                        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f9f9f9;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                <div>
                                    <h3 style="margin: 0 0 5px 0;">${entry.company} - ${entry.role}</h3>
                                    <p style="margin: 0; font-size: 13px; color: #666;">${new Date(entry.date).toLocaleDateString('it-IT')}</p>
                                </div>
                                ${statusBadge(entry)}
                            </div>
                            
                            <div style="display: flex; gap: 15px; margin-bottom: 10px; font-size: 13px;">
                                <span>ATS Score: <strong>${entry.atsScore}%</strong></span>
                                ${entry.recipientEmail ? `<span>Email: <strong>${entry.recipientEmail}</strong></span>` : ''}
                            </div>
                            
                            ${entry.feedbackCompleted ? `
                                <div style="background: #e8f5e9; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 13px;">
                                    ✅ Feedback: ${entry.outcome}
                                </div>
                            ` : ''}
                            
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button onclick="reloadAnalysis(${entry.id})" style="padding: 8px 15px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                                    🔄 Ricarica
                                </button>
                                <button onclick="if(confirm('Eliminare questa candidatura?')) deleteAnalysis(${entry.id})" style="padding: 8px 15px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                                    🗑️ Elimina
                                </button>
                                ${entry.emailSent && !entry.feedbackCompleted ? `
                                    <button onclick="showFeedbackForm(${entry.id})" style="padding: 8px 15px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                                        ✍️ Aggiungi Feedback
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                `}
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button onclick="StorageManager.exportData()" style="padding: 12px 20px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        💾 Export Backup
                    </button>
                    <button onclick="document.getElementById('historyModal').remove()" style="padding: 12px 20px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function reloadAnalysis(id) {
    const entry = StorageManager.getAnalysis(id);
    if (!entry) return;
    
    document.getElementById('companyName').value = entry.company;
    document.getElementById('roleName').value = entry.role;
    
    const fullResults = entry.fullResults;
    displayResultsMartino(fullResults, id);
    
    switchTab('martino');
    
    document.getElementById('historyModal').remove();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteAnalysis(id) {
    StorageManager.deleteAnalysis(id);
    document.getElementById('historyModal').remove();
    showHistory();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    el.select();
    document.execCommand('copy');
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✅ Copiato!';
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
}

function downloadCoverLetter() {
    const text = document.getElementById('editableCoverLetter').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover_letter_${window.currentCompany}_${window.currentRole}.txt`.replace(/\s+/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// GENERIC MODE (simplified)
// ============================================
async function generateDocumentsGeneric() {
    const jd = document.getElementById('jdTextGeneric').value.trim();
    
    if (!jd) {
        alert('Please paste a job description');
        return;
    }
    
    const loadingDiv = document.getElementById('loadingGeneric');
    const resultsDiv = document.getElementById('resultsGeneric');
    
    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    
    setTimeout(async () => {
        const keywords = await extractKeywordsAdvanced(jd, 15);
        
        const cvText = uploadedCVText || 'No CV uploaded';
        const atsScore = calculateATSScore(cvText, keywords);
        
        const resultsHTML = `
            <div class="card">
                <h3>${atsScore.score >= 70 ? '✅' : '⚠️'} ATS Score: ${atsScore.score}%</h3>
                <p>${atsScore.matchedKeywords} keywords matched out of ${atsScore.totalKeywords}</p>
                
                ${atsScore.matches.length > 0 ? `
                    <h4>Matched Keywords:</h4>
                    <p>${atsScore.matches.join(', ')}</p>
                ` : ''}
                
                ${atsScore.missing.length > 0 ? `
                    <h4>Missing Keywords:</h4>
                    <p>${atsScore.missing.join(', ')}</p>
                ` : ''}
                
                <p style="margin-top: 20px; padding: 15px; background: #f0f4ff; border-radius: 6px;">
                    💡 <strong>Suggestion:</strong> Add missing keywords to your CV where relevant and truthful.
                </p>
            </div>
        `;
        
        resultsDiv.innerHTML = resultsHTML;
        loadingDiv.style.display = 'none';
    }, 60000);
}

function handleCVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    uploadedFileName = file.name;
    
    const reader = new FileReader();
    
    if (file.name.endsWith('.pdf')) {
        reader.onload = (e) => {
            uploadedCVText = extractTextFromPDF(e.target.result);
            alert(`PDF loaded: ${uploadedFileName}`);
        };
        reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.txt')) {
        reader.onload = (e) => {
            uploadedCVText = e.target.result;
            alert(`Text file loaded: ${uploadedFileName}`);
        };
        reader.readAsText(file);
    } else {
        alert('Please upload a PDF or TXT file');
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Job Application System V4.2 loaded');
});
