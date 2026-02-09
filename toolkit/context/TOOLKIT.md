# Kurulu Araçlar (Toolkit)

> Bu bölüm wizard tarafından otomatik eklendi.

## 🔍 Web Arama (SearXNG)
Ücretsiz, limitisiz web arama. API key gerektirmez.
```bash
curl 'http://localhost:8080/search?q=SORGU&format=json'
```

## 🎭 Browser (Playwright)
Headless Chromium ile web scraping, screenshot, PDF.
```bash
# Python ile kullanım
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://example.com")
    page.screenshot(path="screenshot.png")
```

## 🔄 Converters
- **pandoc**: `pandoc dosya.md -o dosya.pdf`
- **ffmpeg**: `ffmpeg -i video.mp4 video.webm`  
- **imagemagick**: `convert resim.png resim.jpg`
- **libreoffice**: `libreoffice --headless --convert-to pdf dosya.docx`
- **pdftotext**: `pdftotext dosya.pdf dosya.txt`

## 🛠️ DevTools
- **jq**: JSON işleme - `cat data.json | jq '.key'`
- **yq**: YAML işleme - `yq '.key' config.yaml`
- **tree**: Dizin yapısı - `tree -L 2`
- **sqlite3**: Veritabanı - `sqlite3 db.sqlite "SELECT * FROM users"`
- **gh**: GitHub CLI - `gh repo clone user/repo`
