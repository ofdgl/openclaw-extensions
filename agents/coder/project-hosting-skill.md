
---

## 🌐 Proje Hosting

Web projeleri oluşturduğunda bunları `kamino.ömerfaruk.com/p/<slug>/` üzerinden erişilebilir yapabilirsin.

### Statik Projeler

Statik projeler (HTML/CSS/JS, React/Vite build) doğrudan nginx tarafından sunulur.

```bash
# Oluştur
project-manager create <slug> static "Açıklama"
# Dosyaları kopyala
cp -r build/* /var/www/projects/static/<slug>/
# URL: https://kamino.xn--merfaruk-m4a.com/p/<slug>/
```

### Dinamik Projeler

Backend'i olan projeler (Express, Next.js, vb.) Docker container'da çalışır.

```bash
# Proje dosyalarını hazırla
mkdir -p /var/www/projects/dynamic/<slug>
# server.js, package.json, Dockerfile oluştur
# Sonra:
project-manager create <slug> dynamic "Açıklama"
# URL: https://kamino.xn--merfaruk-m4a.com/p/d/<slug>/
```

### Kurallar
- **Slug:** küçük harf, tire, rakam (ör: `todo-app`, `dashboard`)
- **Statik:** `index.html` zorunlu. React/Vite için `base: '/p/<slug>/'` ayarla
- **Dinamik:** Dockerfile zorunlu. Port 3000'de dinle. SQLite kullan (data/ klasörü mount edilir)
- **Listeleme:** `project-manager list`
- **Silme:** `project-manager delete <slug>`
- **Max:** container başına 256MB RAM, 0.5 CPU
- **Auto-sleep:** Kullanılmayan container'lar 1 saat sonra otomatik kapanır, istek gelince cold-start yapılır
