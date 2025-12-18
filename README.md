# Job Application Assistant - Enhanced Version

Sistema automatico per generare cover letter e CV ottimizzati per ATS con due modalità operative.

## 🎯 DUE MODALITÀ

### 1. **Il Mio Profilo (Martino)**
Sezione personale basata sul CV di Martino Cicerani.

**Output:**
- ✅ Cover letter COMPLETA personalizzata
- ✅ About Me COMPLETO ottimizzato
- ✅ ATS Score preciso
- ✅ Suggerimenti specifici
- ✅ Download DOCX

### 2. **Analizza CV Generico**
Analisi per qualsiasi CV caricato (PDF/DOCX).

**Output:**
- ✅ Suggerimenti tattici
- ✅ Bozza About Me da personalizzare
- ✅ Gap analysis
- ✅ ATS Score
- ⚠️ NON genera cover letter completa

## 🚀 Deploy su Netlify

### Metodo 1: Drag & Drop
1. Vai su https://app.netlify.com/drop
2. Trascina cartella con i 3 file
3. Deploy automatico in 30 secondi

### Metodo 2: GitHub
1. Push file su GitHub
2. Netlify → "Import from Git"
3. Deploy automatico ad ogni commit

## 📁 File Necessari

```
├── index.html    # UI con 2 tab
├── app.js        # Engine completo
└── README.md     # Documentazione
```

## ✨ Features Chiave

**Keyword Filtering Avanzato:**
- Stopwords espanse (100+ termini filtrati)
- Word boundaries per matching accurato
- Minimo 4 lettere per keyword significative

**Tool Detection Migliorato:**
- Pattern matching con regex avanzate
- Rilevamento Excel/PowerPoint affidabile
- Supporto tool marketing/analytics/design

**Analisi Intelligente:**
- Focus automatico (media/product/creative)
- Suggerimenti context-aware
- ATS scoring preciso

## 🎯 Caso d'Uso

**Scenario 1 - Martino:**
1. Tab "Il Mio Profilo"
2. Incolla JD
3. Click "Genera"
4. Download documenti completi

**Scenario 2 - CV Generico:**
1. Tab "Analizza CV Generico"
2. Upload CV (PDF/DOCX)
3. Verifica preview
4. Incolla JD
5. Ricevi suggerimenti

## 🔧 Personalizzazione Profilo

Edita `app.js` → `martinoProfile`:

```javascript
const martinoProfile = {
    name: "Tuo Nome",
    email: "tua@email.com",
    yearsExp: 8,
    coreSkills: [...],
    // etc...
};
```

## ⚠️ Limitazioni PDF Parsing

**Funziona bene:** PDF text-based, layout semplice
**Problemi:** CV grafici, scansioni, layout complessi

**Soluzione:** Preview sempre visibile per verifica

## 📊 Miglioramenti V2

- ✅ Stopwords espanse (you, have, will, etc.)
- ✅ Tool detection con word boundaries
- ✅ Keyword minimo 4 lettere
- ✅ Pattern matching avanzato
- ✅ Focus detection migliorato
- ✅ Suggerimenti più specifici

## 💡 Tips

- Verifica sempre testo estratto da PDF
- Personalizza bozze generate
- Usa Tab Martino per candidature reali
- Tab Generico per quick check

## 🐛 Troubleshooting

**Q: Keyword irrilevanti (you, will, etc.)?**
A: FIXED - Stopwords ora filtrano questi termini

**Q: Excel non rilevato?**
A: FIXED - Word boundaries ora catturano Excel correttamente

**Q: Score troppo basso?**
A: Keyword filtering migliorato, score ora più accurato

## 📝 Licenza

© 2025 Martino Cicerani - Uso personale
