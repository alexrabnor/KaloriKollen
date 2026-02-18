# KaloriKollen - Produktionsklar version

## Ändringar från original:
- ✅ Ersatt in-browser Babel med Vite build
- ✅ Proper React setup med JSX compilation  
- ✅ PWA med Vite-plugin
- ✅ Optimerade bundles
- ✅ Inga CSP-fel längre

## Bygg och kör lokalt:

```bash
# Installera dependencies
npm install

# Kör development server
npm run dev

# Bygg för produktion
npm run build
```

## Bygg Docker image:

```bash
# Bygg
docker build -t kalorikollen .

# Kör på port 5051
docker run -d -p 5051:80 --name kalorikollen --restart always kalorikollen
```

## Publicera via Cloudflare Tunnel:

1. Lägg till route i Cloudflare Zero Trust
2. Subdomain: `kalori`
3. Service URL: `http://kalorikollen:80`
4. Testa: https://kalori.alexcloud.se
