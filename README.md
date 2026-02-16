# 📱 KaloriKollen - Deployment Guide

Deploy din kaloriräknar-app till din mobil på 3 olika sätt!

---

## 🚀 ALTERNATIV 1: Vercel (REKOMMENDERAT - Snabbast!)

### Steg 1: Skapa GitHub Repo
```bash
# I din deploy-mapp
git init
git add .
git commit -m "Initial commit - KaloriKollen"
git branch -M main
git remote add origin https://github.com/DITT-ANVÄNDARNAMN/kalorikollen.git
git push -u origin main
```

### Steg 2: Deploy till Vercel
1. Gå till [vercel.com](https://vercel.com)
2. Logga in med GitHub
3. Klicka "New Project"
4. Välj ditt `kalorikollen` repo
5. Klicka "Deploy"
6. **KLART!** Du får en URL typ: `kalorikollen.vercel.app`

### Steg 3: Installera på mobilen
**Android:**
1. Öppna din Vercel-URL i Chrome
2. Tryck på menyn (⋮) → "Installera app" eller "Lägg till på startskärm"
3. Klart! Nu har du en riktig app-ikon

**iPhone:**
1. Öppna URL i Safari
2. Tryck på dela-knappen (↑)
3. "Lägg till på hemskärm"
4. Klart!

---

## 🖥️ ALTERNATIV 2: Din Dexter Server

### Steg 1: Ladda upp filer
```bash
# Via SCP/SFTP
scp -r * user@din-dexter-server:/var/www/kalorikollen/

# Eller via FTP med FileZilla
# Ladda upp alla filer till webbroot
```

### Steg 2: Konfigurera webbserver

**För Nginx:**
```nginx
server {
    listen 80;
    server_name kalorikollen.dindomän.se;
    root /var/www/kalorikollen;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # PWA support
    location /manifest.json {
        add_header Content-Type application/manifest+json;
    }
    
    location /sw.js {
        add_header Cache-Control "no-cache";
        add_header Service-Worker-Allowed "/";
    }
}
```

**För Apache:**
```apache
<VirtualHost *:80>
    ServerName kalorikollen.dindomän.se
    DocumentRoot /var/www/kalorikollen
    
    <Directory /var/www/kalorikollen>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### Steg 3: SSL (viktigt för PWA!)
```bash
# Med Certbot (Let's Encrypt)
sudo certbot --nginx -d kalorikollen.dindomän.se
```

---

## 🔧 ALTERNATIV 3: GitHub Pages (Gratis hosting)

### Steg 1: Skapa repo och push
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DITT-ANVÄNDARNAMN/kalorikollen.git
git push -u origin main
```

### Steg 2: Aktivera GitHub Pages
1. Gå till ditt repo på GitHub
2. Settings → Pages
3. Source: "Deploy from a branch"
4. Branch: "main" → "/ (root)"
5. Save

### Steg 3: Vänta 2-3 minuter
Din app finns nu på: `https://DITT-ANVÄNDARNAMN.github.io/kalorikollen/`

---

## 📋 Filstruktur (alla filer behövs!)

```
kalorikollen/
├── index.html       # Huvudfil
├── app.jsx          # React-app
├── manifest.json    # PWA manifest
├── sw.js           # Service Worker
└── README.md       # Denna fil
```

---

## ✅ CHECKLIST - Testa att allt fungerar

1. **Öppna appen i mobilen** - URL:en du fick
2. **Testa fota mat** - Ta bild och se AI-analys
3. **Installera som app** - "Lägg till på hemskärm"
4. **Testa offline** - Stäng av WiFi, appen ska fungera
5. **Spara data** - Lägg till vikt, se att det sparas
6. **AI Coach** - Tryck på AI Coach-knappen
7. **Streckkod** - Testa med: `7310532100004`

---

## 🐛 Felsökning

**Problem: "Kan inte installera appen"**
- Kontrollera att du har HTTPS (krävs för PWA)
- Vercel och GitHub Pages har HTTPS automatiskt
- För Dexter: Kör `certbot` för SSL

**Problem: "AI fungerar inte"**
- Claude API-nyckeln hanteras automatiskt i artifacts
- Om du hostar själv måste du inte ange någon API-nyckel

**Problem: "Service Worker registrerar inte"**
- Öppna DevTools → Console
- Kolla efter fel
- Se till att `sw.js` är tillgänglig på root-nivå

**Problem: "Data sparas inte"**
- Artifacts-miljön har inbyggd storage
- I produktion används localStorage/IndexedDB automatiskt

---

## 🎯 Rekommendation

**För snabbaste testet:** → Vercel (5 minuter setup)
**För egen kontroll:** → Din Dexter server
**För gratis långsiktig hosting:** → GitHub Pages

**Min rekommendation: Börja med Vercel!** Det tar 5 minuter och fungerar perfekt. Du kan alltid migrera till din egen server senare.

---

## 💡 Extra tips

1. **Custom domän på Vercel:**
   - Settings → Domains → Add
   - Peka din domän till Vercel

2. **Analytics:**
   - Lägg till Vercel Analytics (gratis)
   - Se hur många som använder appen

3. **Updates:**
   ```bash
   git add .
   git commit -m "Update"
   git push
   # Vercel deployas automatiskt!
   ```

4. **Testa lokalt först:**
   ```bash
   python3 -m http.server 8000
   # Öppna localhost:8000 i mobilen via IP
   ```

---

## 📞 Support

Om något krånglar, kolla:
- Vercel logs: Dashboard → din project → Deployments
- Browser console: DevTools → Console
- Service Worker: DevTools → Application → Service Workers

Lycka till! 🚀📱
