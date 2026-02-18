# ⚡ QUICK START - 5 minuter till mobil-app!

## 🚀 Snabbaste vägen: Vercel

### 1. Installera Vercel CLI (valfritt)
```bash
npm i -g vercel
```

### 2. Deploy direkt från denna mapp
```bash
cd kalorikollen-deploy
vercel
# Följ instruktionerna
# Välj "Yes" för att skapa nytt projekt
```

### 3. KLART! 
Du får en URL: `https://kalorikollen-xxx.vercel.app`

### 4. Öppna på mobilen
- Öppna URL:en i Chrome/Safari
- "Lägg till på hemskärm"
- Nu är det en app! 📱

---

## 🔥 Ännu snabbare: Drag & Drop

1. Gå till [vercel.com](https://vercel.com)
2. Dra hela `kalorikollen-deploy` mappen till Vercel
3. KLART! URL dyker upp direkt

---

## 🖥️ Alternativ: Din Dexter Server

```bash
# 1. Zippa filerna
zip -r kalorikollen.zip *

# 2. Ladda upp via SFTP till /var/www/html/kalorikollen/

# 3. Öppna: http://din-server-ip/kalorikollen/
```

---

## ✅ Testa att det fungerar

1. Öppna URL:en i mobilen
2. Se att appen laddas
3. Tryck "Installera" när prompten dyker upp
4. Nu finns KaloriKollen som app på din hemskärm! 🎉

---

## 💡 Tips

**Testa lokalt först:**
```bash
# Kör från denna mapp
python3 -m http.server 8000

# Öppna i mobilen:
# http://DIN-DATORS-IP:8000
```

**Hitta din dators IP:**
```bash
# Mac/Linux:
ifconfig | grep "inet "

# Windows:
ipconfig
```

---

Det är allt! Super enkelt! 🚀
