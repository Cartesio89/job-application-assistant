# Job Application Assistant - Chrome Extension

Estrai job posting da LinkedIn/Indeed/Glassdoor con 1 click.

## 🚀 INSTALLAZIONE

### 1. Download Extension

Scarica questi file in una cartella locale:
- manifest.json
- content.js
- popup.html
- popup.js
- icons/ (cartella con icone)

### 2. Installa in Chrome

1. Apri Chrome
2. Vai a `chrome://extensions/`
3. Attiva **Developer mode** (toggle in alto a destra)
4. Click **Load unpacked**
5. Seleziona la cartella con i file extension
6. Extension installata! ✅

### 3. Pin Extension

- Click icona puzzle (Extensions) nella toolbar
- Trova "Job Application Assistant Extractor"
- Click pin 📌

---

## 📋 USO

### Extract Job Posting

**Su LinkedIn:**
1. Apri job posting su LinkedIn
2. Click icona extension
3. Click "🔍 Extract Job Posting"
4. Dati salvati in queue ✅

**Su Indeed/Glassdoor:**
- Stesso processo

### View Queue

1. Click icona extension
2. Click "📂 View Queue (N)"
3. Si apre tool con tutti job estratti
4. Seleziona quali analizzare
5. Genera documenti

### Clear Queue

- Click "🗑️ Clear Queue" per svuotare

---

## ⚙️ CONFIGURAZIONE

### Update Tool URL

**File:** `popup.js` (riga ~50)

```javascript
const toolUrl = `https://your-tool.netlify.app/?mode=queue&data=...`;
```

**Sostituisci con:**
```javascript
const toolUrl = `https://[tuo-sito].netlify.app/?mode=queue&data=...`;
```

---

## 🎯 SHORTCUT KEYBOARD

- **Ctrl/Cmd + E** = Extract job
- **Ctrl/Cmd + Q** = View queue

---

## 🐛 TROUBLESHOOTING

### Extension non estrae

**Check:**
1. Sei su pagina job posting (non lista)?
2. Extension ha permission per sito?
3. Developer mode ON?

**Fix:**
- Reload pagina (F5)
- Re-click Extract
- Check console errors (F12)

### Icone mancanti

**Fix:**
Crea file PNG 16x16, 48x48, 128x128 con icona app
O usa placeholder:
```
icons/
  icon16.png
  icon48.png  
  icon128.png
```

### Queue non si apre

**Check:**
- Tool URL configurata correttamente in popup.js?
- Tool deployato e funzionante?

---

## 📊 SUPPORTO SITI

✅ **LinkedIn Jobs**
- linkedin.com/jobs/*

✅ **Indeed**
- indeed.com/viewjob*

✅ **Glassdoor**
- glassdoor.com/job-listing/*

---

## 🔄 UPDATE EXTENSION

1. Modifica file
2. Vai a `chrome://extensions/`
3. Click reload icon su extension
4. Done

---

## 🎨 ICONS

### Crea Icone

Usa tool online (es: favicon.io) per generare:
- 16x16 px
- 48x48 px
- 128x128 px

**Colore:** Gradient #667eea → #764ba2

---

## 📝 CHANGELOG

**v1.0.0**
- Extract da LinkedIn/Indeed/Glassdoor
- Queue management
- Keyboard shortcuts
- Visual indicator

---

© 2024 Martino Cicerani
