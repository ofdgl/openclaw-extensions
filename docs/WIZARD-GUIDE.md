# VPS Toolkit Setup Wizard

OpenClaw Extensions için unified setup wizard kullanım kılavuzu.

## Hızlı Başlangıç

```bash
cd ~/openclaw-extensions
./wizard.sh
```

## Wizard Aşamaları

### Phase 1: Kurulum Tespiti
- Mevcut Kamino kurulumu kontrol edilir
- OpenClaw versiyonu doğrulanır
- Aktif mod belirlenir (original/kamino/none)

### Phase 2: Mod Seçimi
**Kamino kuruluysa:**
- Mevcut modda kal veya değiştir

**Kamino kurulu değilse:**
- Yeni kurulum için onay ister
- Admin telefon numarası sorulur (opsiyonel)

### Phase 3: Toolkit Kurulumu
Üç seçenek:
1. **Tam kurulum** - Tüm modüller (~1.6GB)
2. **Modül seç** - İstediğin araçları seç
3. **Atla** - Toolkit kurulmaz

#### Toolkit Modülleri

| Modül | Boyut | İçerik |
|-------|-------|--------|
| DevTools | ~50MB | jq, yq, tree, sqlite3, gh |
| Playwright | ~300MB | Headless Chromium browser |
| SearXNG | ~500MB | Ücretsiz web arama (Docker) |
| Converters | ~800MB | pandoc, ffmpeg, imagemagick, libreoffice |

### Phase 4: Finalizasyon
- Mod bilgisi SOUL.md'ye eklenir
- Toolkit bilgisi TOOLS.md'ye eklenir
- Gateway restart edilir

## Mod Değiştirme

Wizard dışında manuel mod değiştirmek için:

```bash
# Original moda geç (maksimum güvenlik)
~/openclaw-extensions/scripts/mode-switch.sh original

# Kamino moduna geç (custom hooks aktif)
~/openclaw-extensions/scripts/mode-switch.sh kamino

# Mevcut durumu gör
~/openclaw-extensions/scripts/mode-switch.sh status
```

## Toolkit Komutları

### SearXNG (Web Arama)
```bash
# Arama yap
curl 'http://localhost:8080/search?q=query&format=json'

# Container durumu
docker ps | grep searxng
```

### Playwright (Browser)
```bash
# Screenshot al
playwright screenshot https://example.com screenshot.png

# PDF oluştur
playwright pdf https://example.com page.pdf
```

### Converters
```bash
# Markdown → PDF
pandoc README.md -o README.pdf

# Video dönüştür
ffmpeg -i video.mp4 video.webm

# Resim dönüştür
convert image.png image.jpg
```

## Troubleshooting

### SearXNG başlamıyor
```bash
# Docker çalışıyor mu?
sudo systemctl status docker

# Container logları
docker logs searxng
```

### Playwright hata veriyor
```bash
# Dependencies kur
playwright install-deps chromium
```

### Wizard permission hatası
```bash
chmod +x ~/openclaw-extensions/wizard.sh
chmod +x ~/openclaw-extensions/toolkit/modules/*.sh
```
