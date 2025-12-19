# Job Application Assistant V4

Sistema completo AI-powered per candidature lavorative con email sending, learning automatico e Chrome extension.

---

## 🚀 FEATURES

✅ **Document Generation**
- Cover letter (3 stili: Standard/Bold/Storytelling)
- About Me CV section
- Suggerimenti CV dettagliati
- ATS score prediction

✅ **Email Sending**
- Invio diretto con allegati multipli
- Cover letter editabile pre-invio
- Preview completa
- Approval flow

✅ **Learning System**
- Tracking outcomes (interview/rejection/ghost)
- Industry success rates
- Cover letter style effectiveness
- Tool mention effectiveness
- Suggerimenti intelligenti basati su dati storici

✅ **Competitive Analysis**
- Experience gap analysis
- Tools coverage
- Industry fit
- Positioning strategy

✅ **Export/Import**
- Backup JSON dati
- Sync cross-device manuale
- Istruzioni Google Drive integrate

✅ **Chrome Extension**
- Extract job posting da LinkedIn/Indeed/Glassdoor
- Queue management
- Batch processing

---

## 📦 INSTALLAZIONE

### 1. Deploy Web App

**GitHub → Netlify:**
1. Fork/Clone questo repo
2. Connetti a Netlify
3. Deploy automatico

### 2. Setup Email Sending

**SendGrid (gratuito):**
1. Crea account: https://sendgrid.com
2. Get API Key
3. Verifica sender email
4. Aggiungi env var su Netlify:
   - Key: `SENDGRID_API_KEY`
   - Value: [tua_api_key]

### 3. Chrome Extension (opzionale)

Vedi cartella `chrome-extension/` per istruzioni.

---

## 📂 STRUTTURA

```
├── index.html           # UI principale
├── app.js               # Engine completo (1959 righe)
├── package.json         # Dependencies SendGrid
├── netlify/
│   └── functions/
│       └── send-email.js  # Netlify function
└── chrome-extension/    # Extension (cartella separata)
    ├── manifest.json
    ├── content.js
    ├── popup.html
    └── popup.js
```

---

## 🎯 QUICK START

### Primo Utilizzo

1. **Genera Documenti:**
   - Tab "Martino Personale"
   - Compila: Company, Role, Job Description
   - Click "Genera Documenti"

2. **Seleziona Stile Cover Letter:**
   - Standard → Corporate/Finance
   - Bold → Startup/Tech
   - Storytelling → Creative/Marketing

3. **Invia Email (opzionale):**
   - Inserisci email destinatario
   - Carica CV aggiornato
   - Preview → Approva & Invia

4. **Track Feedback:**
   - Dopo 15 giorni → Reminder automatico
   - Aggiungi outcome
   - Sistema aggiorna learning data

---

## 📧 CONFIGURAZIONE EMAIL

### File: `netlify/functions/send-email.js`

Richiede:
- SendGrid account (100 email/giorno gratis)
- API Key configurata in Netlify
- Sender email verificata

**Test Email Function:**
```bash
curl -X POST https://[tuo-sito].netlify.app/.netlify/functions/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@test.com","from":"your@email.com","subject":"Test","body":"Test"}'
```

---

## 💾 EXPORT/IMPORT DATI

### Export (Backup)
1. Click "📤 Esporta Dati"
2. File JSON scaricato
3. Salva su Google Drive

### Import (Restore)
1. Download file da Drive
2. Click "📥 Importa Dati"
3. Drag & drop file JSON
4. Scegli: Unire o Sovrascrivere

### Sync Cross-Device
1. PC Casa → Export
2. Upload su Drive
3. PC Ufficio → Download → Import

---

## 🎨 CHROME EXTENSION

### Installazione

1. Download cartella `chrome-extension/`
2. Chrome → `chrome://extensions/`
3. Developer mode ON
4. Load unpacked → Seleziona cartella
5. Pin extension

### Uso

**Extract Job:**
1. LinkedIn/Indeed job posting
2. Click extension icon
3. Click "Extract"
4. Job salvato in queue

**Batch Processing:**
1. Extract 10 job
2. Click "View Queue"
3. Tool si apre con 10 job
4. Genera documenti per tutti

**Config:**
File `chrome-extension/popup.js` linea ~50:
```javascript
const toolUrl = `https://[tuo-sito].netlify.app/?mode=queue...`;
```

---

## 📊 LEARNING SYSTEM

### Metriche Tracciate

**Per Industry:**
- Total applications
- Interview rate
- Avg ATS score
- Best cover letter style

**Per Cover Letter Style:**
- Times used
- Interview rate
- Success rate

**Per Tool:**
- Times mentioned
- Interview correlation
- Effectiveness score

### Suggerimenti Automatici

Sistema suggerisce automaticamente:
- "Per corporate, Standard ha 65% success rate"
- "Power BI ha 75% interview rate quando menzionato"
- "Evita Bold style per finance (10% success)"

---

## 🐛 TROUBLESHOOTING

### Email non inviata
**Check:**
- SendGrid API key configurata?
- Sender email verified?
- Allegati < 10MB?

**Fix:**
- Netlify → Functions logs
- Verifica env variables
- Test con curl

### PDF parsing fallisce
**Fix:**
- Usa DOCX invece
- Copy/paste testo CV
- Check preview output

### Extension non estrae
**Check:**
- Sei su job posting (non lista)?
- Extension permissions OK?
- Page fully loaded?

**Fix:**
- Reload page (F5)
- Re-click Extract
- Check console (F12)

---

## 📈 ROADMAP

**V4.0 (Current)**
- ✅ Email sending
- ✅ Learning system
- ✅ Chrome extension
- ✅ Export/Import

**V5.0 (Future)**
- [ ] LinkedIn OAuth (auto-import profile)
- [ ] Email tracking (open rates)
- [ ] Advanced analytics dashboard
- [ ] Calendar integration
- [ ] Mobile app

---

## 🔒 PRIVACY

- **LocalStorage:** Tutti dati su browser locale
- **Export/Import:** File JSON sotto tuo controllo
- **SendGrid:** Email transazionale, no tracking
- **No server:** Zero dati su server terzi (tranne SendGrid per email)

---

## 📝 CHANGELOG

**V4.0 (Dec 2024)**
- Email sending multi-attachment
- Cover letter editabile
- Feedback system 15gg auto-ghost
- Learning automatico
- Chrome extension
- Export/Import JSON

**V3.0**
- Competitive analysis
- A/B cover letter variants
- Industry detection
- Advanced keyword extraction

**V2.0**
- Detailed CV suggestions
- LocalStorage persistence

**V1.0**
- Basic document generation
- Dual-mode (Martino/Generic)

---

## 🤝 SUPPORTO

**Issues:** GitHub Issues
**Email:** martino.cicerani@gmail.com
**Docs:** Check README files in subfolders

---

## 📄 LICENSE

MIT License - © 2024 Martino Cicerani

---

## 🎯 STATS

- **~2000 righe** codice JavaScript
- **15+ features** implementate
- **3 stili** cover letter
- **6 industries** rilevate
- **50+ candidature** trackable
- **1 ora** setup completo

---

**DA 3 ORE → 30 MINUTI per 10 candidature** 🚀

Deploy now: [![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify)](https://app.netlify.com/start)
