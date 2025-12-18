# Job Application Assistant - Web App

Sistema automatico per generare cover letter e CV ottimizzati per ATS.

## 🚀 Deploy su Netlify

### Metodo 1: Drag & Drop (più semplice)

1. Vai su https://app.netlify.com/drop
2. Trascina la cartella `job-app-web` nell'area di drop
3. Aspetta il deploy (30 secondi)
4. Ottieni URL tipo: `https://random-name-123.netlify.app`

### Metodo 2: Netlify CLI

```bash
# Installa Netlify CLI
npm install -g netlify-cli

# Vai nella cartella
cd job-app-web

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Metodo 3: GitHub + Netlify

1. Crea repo GitHub con questi file
2. Vai su https://app.netlify.com
3. "Add new site" → "Import from Git"
4. Collega il repo
5. Deploy automatico

## 📁 Struttura File

```
job-app-web/
├── index.html      # UI principale
├── app.js          # Logic JavaScript
└── README.md       # Questo file
```

## ✨ Features

- ✅ Analisi automatica Job Description
- ✅ Generazione cover letter personalizzata
- ✅ Ottimizzazione paragrafo CV "About Me"
- ✅ Calcolo ATS score (% match)
- ✅ Identificazione keyword matchate/mancanti
- ✅ Suggerimenti specifici per CV
- ✅ Download file .doc
- ✅ Copia negli appunti
- ✅ Responsive mobile

## 🎯 Come Usare

1. Apri l'app (URL Netlify)
2. Compila: Nome Azienda, Ruolo, Location
3. Incolla Job Description completa
4. Click "Genera Documenti"
5. Review risultati:
   - ATS Score
   - Cover Letter (copia o download)
   - About Me CV (copia)
   - Suggerimenti modifiche CV

## 📊 ATS Score

- **70%+** = Ottimo match (alta probabilità di passare filtri)
- **50-70%** = Buon match (aggiungi alcune keyword)
- **<50%** = Match basso (valuta se candidarti)

## 🔧 Personalizzazione

Per modificare il profilo (nome, esperienze, skills):

Edita `app.js` → oggetto `profile`:

```javascript
const profile = {
    name: "Tuo Nome",
    email: "tua@email.com",
    currentRole: "Tuo ruolo",
    yearsExp: 5,
    // etc...
};
```

## 🌐 URL Esempio

Una volta deployato, l'app sarà accessibile via URL tipo:
- https://job-application-assistant.netlify.app
- https://martino-cv-generator.netlify.app

Puoi personalizzare il nome del sito nelle impostazioni Netlify.

## 💡 Tips

- Salva il URL nei preferiti per accesso rapido
- Usa su mobile per candidature al volo
- Testa con diverse JD per vedere variazioni
- Review sempre manualmente prima di inviare

## 🐛 Troubleshooting

**App non si apre dopo deploy:**
- Controlla che index.html sia nella root
- Verifica la console browser (F12) per errori

**Download non funziona:**
- Usa "Copia" e incolla in Word
- Il browser potrebbe bloccare download automatici

**Score sempre basso:**
- JD troppo corta o generica
- Aggiungi manualmente keyword rilevanti

## 📝 Licenza

© 2025 Martino Cicerani - Uso personale
