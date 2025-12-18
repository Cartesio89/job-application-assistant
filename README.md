# Job Application Assistant V2 - Dual Mode

Sistema automatico per generare cover letter e CV ottimizzati per ATS con due modalità:

## 🎯 DUE MODALITÀ

### 1. **Il Mio Profilo (Martino)**
- CV hardcoded di Martino Cicerani
- Genera documenti COMPLETI
- Cover letter personalizzata
- About Me ottimizzato
- ATS Score
- Suggerimenti specifici

### 2. **Analizza CV Generico**
- Upload qualsiasi CV (PDF/DOCX)
- Parsing automatico contenuto
- Confronto con JD
- **Output:**
  - Suggerimenti tattici
  - Bozza About Me da personalizzare
  - Gap analysis
  - ATS Score
  - NO cover letter completa (solo per Martino)

## 🚀 Deploy su Netlify

### Metodo 1: Drag & Drop
1. Vai su https://app.netlify.com/drop
2. Trascina la cartella `job-app-web-v2`
3. Deploy automatico in 30 secondi

### Metodo 2: GitHub
1. Push su GitHub repo
2. Netlify → "Import from Git"
3. Deploy automatico

## 📁 File Necessari

```
job-app-web-v2/
├── index.html      # UI con 2 tab
├── app-v2.js       # Logic + PDF parsing
└── README.md       # Questo file
```

## ✨ Features V2

**Sezione Martino:**
- ✅ Generazione documenti completi
- ✅ Cover letter personalizzata
- ✅ About Me completo
- ✅ Download DOCX

**Sezione Generica:**
- ✅ Upload CV (PDF/DOCX max 5MB)
- ✅ Preview testo estratto
- ✅ Parsing automatico (best effort)
- ✅ Suggerimenti personalizzati
- ✅ Bozza About Me da adattare
- ✅ Gap analysis (cosa manca)
- ✅ ATS Score

## ⚠️ LIMITAZIONI PDF PARSING

**Funziona bene con:**
- PDF text-based (non scansioni)
- Layout semplice e lineare
- Font standard

**Può avere problemi con:**
- PDF complessi (tabelle, colonne)
- CV grafici/creativi
- Scansioni (immagini)
- Font non standard

**Soluzione:** L'utente vede sempre il testo estratto e può verificare se corretto.

## 🎯 Caso d'Uso

**Scenario 1 - Martino:**
1. Tab "Il Mio Profilo"
2. Incolla JD
3. Click "Genera"
4. Download cover letter + About Me pronto

**Scenario 2 - CV Generico:**
1. Tab "Analizza CV Generico"
2. Upload CV (PDF/DOCX)
3. Verifica preview testo estratto
4. Incolla JD
5. Click "Analizza"
6. Ricevi suggerimenti + bozza da personalizzare

## 🔧 Personalizzazione Profilo Martino

Per aggiornare dati Martino:

Edita `app-v2.js` → oggetto `martinoProfile`:

```javascript
const martinoProfile = {
    name: "Nome Aggiornato",
    yearsExp: 10,  // Aggiorna anni
    // etc...
};
```

## 📊 Output Differences

| Feature | Martino | Generico |
|---------|---------|----------|
| Cover Letter Completa | ✅ | ❌ |
| About Me Completo | ✅ | ⚠️ Bozza |
| ATS Score | ✅ | ✅ |
| Suggerimenti | ✅ | ✅ |
| Download DOCX | ✅ | ❌ |
| Gap Analysis | ✅ | ✅ |

## 💡 Best Practices

**Per sezione Martino:**
- Usa per tue candidature reali
- Download documenti pronti
- Applica suggerimenti al CV

**Per sezione Generica:**
- Usa per quick check altri CV
- Verifica sempre testo estratto
- Personalizza bozze generate
- Non usare documenti così come sono

## 🐛 Troubleshooting

**Parsing PDF fallisce:**
- Prova con DOCX
- O copia/incolla contenuto CV manualmente
- Usa solo per CV text-based

**Testo estratto sbagliato:**
- Normale per CV complessi
- Funzionalità è "best effort"
- Preview serve proprio per verificare

**Bozza About Me troppo generica:**
- È intenzionale
- Utente DEVE personalizzare
- Fornisce struttura base

## 📝 Licenza

© 2025 Martino Cicerani - Uso personale e professionale
