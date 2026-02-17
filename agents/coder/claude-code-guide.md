# Claude Code Hızlı Başlangıç Rehberi
*Openclaw Agent için hazırlanmıştır*

## 📊 Plan Limitleri (Güncel - Şubat 2026)

### Pro Plan - $20/ay
- **5 saatlik pencereler:** ~10-40 prompt per pencere
- **Token limiti:** ~44,000 token/5 saat
- **Model erişimi:** Sonnet 4.5 (ana), sınırlı Opus 4.6
- **Haftalık limit:** 40-80 saat Sonnet 4
- **Kullanım sıfırlama:** Her 5 saatte bir

### Max 5x Plan - $100/ay  
- **5 saatlik pencereler:** ~50-200 prompt/pencere
- **Token limiti:** ~88,000 token/5 saat
- **Haftalık limit:** 140-280 saat Sonnet 4 + 15-35 saat Opus 4
- Pro'nun 5 katı kapasite

### Max 20x Plan - $200/ay
- **5 saatlik pencereler:** ~200-800 prompt/pencere
- **Token limiti:** ~220,000 token/5 saat  
- **Haftalık limit:** 240-480 saat Sonnet 4 + 24-40 saat Opus 4
- Pro'nun 20 katı kapasite
- Günlük yoğun development için ideal

**Not:** Limit aşımında "extra usage" özelliğiyle API fiyatlarından kullanmaya devam edebilirsiniz.

---

## 🚀 Kurulum & İlk Adımlar

### Kurulum
```bash
# Kurulum (önerilen)
curl -fsSL https://downloads.claude.com/install.sh | sh

# npm ile (deprecated ama hala çalışıyor)
npm install -g @anthropic-ai/claude-code
```

### İlk Çalıştırma
```bash
# Proje klasörüne git
cd /path/to/your/project

# Claude Code'u başlat
claude

# İlk seferinde authentication yapacak
# Pro/Max aboneliğinle ya da API key ile login
```

### Durum Kontrolü
```bash
/status          # Kullanım durumunu göster
/stats           # Detaylı istatistikler ve geçmiş
```

---

## 📚 Güncel Dokümantasyona Erişim

### Resmi Kaynaklar
- **Ana Docs:** https://code.claude.com/docs/en/overview
- **API Docs:** https://docs.claude.com/en/docs/claude-code/overview  
- **Support:** https://support.claude.com
- **npm Package:** https://www.npmjs.com/package/@anthropic-ai/claude-code

### Topluluk Kaynakları
- **Reddit:** r/ClaudeAI - 450k+ üye, aktif tartışmalar
- **GitHub:** https://github.com/anthropics/claude-code
- **Awesome Claude Code:** https://github.com/hesreallyhim/awesome-claude-code
- **ClaudeLog:** https://claudelog.com - Detaylı best practices

---

## 💡 Kritik İpuçları & Best Practices

### 1. Context Window Yönetimi (EN ÖNEMLİ!)
```bash
/clear           # Yeni task başlarken - context'i temizle
/compact         # Uzun sessionlarda - context'i sıkıştır
/context         # Context durumunu debug et (v1.0.86+)
```

**Neden önemli:** Context dolunca Claude performansı düşer ve hata yapar. Her yeni, ilgisiz task için `/clear` kullan!

### 2. Plan Mode - Başarı Anahtarı
```bash
# Plan Mode'a geç: Shift+Tab (iki kez)
# Normal Mode'a dön: Shift+Tab
```

**İş Akışı:**
1. 📋 **Plan Mode'da başla** - Kod yazmadan önce plan yap
2. 🔍 **Codebase'i incele** - "Explain the codebase" 
3. 📝 **Detaylı plan iste** - "Create implementation plan with 3 milestones"
4. ✅ **Planı onayla** - Sonra Normal Mode'a geç
5. 🚀 **Implement et** - Claude kodu yazsın

**Altın kural:** Kompleks tasklar için plan yazarken geçirdiğin zaman, debug için kaydedeceğin zamandır.

### 3. CLAUDE.md - Projen için Constitution
Repo root'unda `CLAUDE.md` oluştur:

```markdown
# Proje Adı

## Tech Stack
- Backend: Node.js + Express
- Frontend: React + TypeScript
- Database: PostgreSQL

## Code Style
- Always use TypeScript strict mode
- Prefer async/await over promises
- Use functional components in React

## Testing
- Run `npm test` before commits
- Write tests in __tests__ folder

## Common Mistakes
- Never commit .env files
- Always validate user input
- Use prepared statements for SQL

## Build & Run
\`\`\`bash
npm install
npm run dev
\`\`\`
```

**Pratik:** Her düzeltmeden sonra: "Update CLAUDE.md so you don't make this mistake again"

### 4. Slash Commands (Sık Kullanılanlar)
```bash
/resume     # Eski session'ı devam ettir
/rename              # Session'a anlamlı isim ver
/permissions         # Dosya/komut izinlerini yönet
/compact             # Token kullanımını azalt
/clear               # Yeni başla
/output-style        # Explanatory/learning mode
```

### 5. Verimli Prompt Yazma
❌ **Kötü:**
```
Add authentication
```

✅ **İyi:**
```
Add JWT-based authentication to /api routes:
1. Use existing User model in src/models/user.js
2. Store tokens in httpOnly cookies
3. Add middleware in src/middleware/auth.js
4. Follow error handling pattern from src/utils/errors.js
5. Write tests similar to src/__tests__/api.test.js

Requirements:
- 15 min token expiry
- Refresh token mechanism
- Rate limiting on login endpoint
```

### 6. Model Seçimi
```bash
# Default davranış iyi - Opus %50'ye kadar, sonra Sonnet
# Manuel değiştirme: Settings'den model seç

# Opus 4.6 kullan:
# - Kompleks mimari kararlar
# - UI/Frontend (tasarım anlıyor)
# - Büyük refactoring

# Sonnet 4.5 kullan:
# - Bug fix'ler
# - Küçük feature'lar  
# - Routine tasks
```

### 7. Paralel Çalışma
```bash
# Git worktrees kullan - 3-5 paralel session
git worktree add ../feature-auth feature/auth
git worktree add ../feature-api feature/api

# Her birinde ayrı claude instance çalıştır
cd ../feature-auth && claude
cd ../feature-api && claude
```

### 8. Token Optimizasyonu
```bash
# Dosya taglerken dikkatli ol
@filename.js          # ✅ Sadece gerekeni tag'le
@src/**/*             # ❌ Tüm klasörü tag'leme

# Long conversations'ı böl
# Her 10-15 prompt'ta /clear yap

# Plan mode'da explorasyon yap
# Normal mode'da implementation
```

### 9. Verification Setup
```bash
# Test suite ile doğrula
"After implementation, run: npm test"

# Linter ile check et  
"Before committing, run: npm run lint"

# Claude in Chrome ile UI test
"Open in browser and verify the UI works"
```

### 10. Reddit'ten Pratik Trickler

**Voice Input Kullan:**
```bash
# Ses ile daha hızlı prompt ver
# Kulaklıkla fısıldayarak bile çalışır
# Özellikle uzun promptlar için ideal
```

**URL'leri Paste Et:**
```bash
# Claude erişemediği siteleri (Reddit vs)
# Manuel copy-paste ile ekle
# Ctrl+A, Ctrl+C, paste to Claude
```

**Shift Drag:**
```bash
# Normal drag: Dosya açar
# Shift + drag: Dosyayı reference eder
```

**Keyboard Shortcuts:**
```bash
Escape           # Claude'u durdur (Ctrl+C exit yapar!)
Escape x2        # Önceki mesajlar listesi
Shift+Enter      # Yeni satır (/terminal-setup gerekebilir)
Control+V        # Image paste (Command+V çalışmaz!)
```

### 11. Session Yönetimi
```bash
# Session kaydetme
/rename epic-refactor

# Daha sonra devam
/resume epic-refactor

# Tüm session'ları gör
/stats

# Session'lar 5 saat sürer
# İntensive work'ü reset cycle'a göre planla
```

### 12. Skills & Subagents
```bash
# ~/.claude/skills/ klasörüne custom skill ekle
# Markdown tabanlı - doğal dil ile tetiklenir

# Subagent örnek:
# ~/.claude/agents/reviewer.md
---
name: code-reviewer
description: Security and performance review
model: sonnet
---
Focus on security vulnerabilities and performance issues.
Be concise, only report actual bugs.
```

---

## ⚠️ Sık Yapılan Hatalar

1. **Context dolunca zorlamak** → /clear veya /compact kullan
2. **Plan yapmadan code yazdırmak** → Her zaman plan mode'dan başla
3. **CLAUDE.md güncellemeden ilerlemek** → Her hata düzeltme sonrası güncelle
4. **Tüm codebase'i tag'lemek** → Sadece ilgili dosyaları ekle
5. **Uzun conversation'ları devam ettirmek** → Yeni task = yeni session
6. **Opus'u her şey için kullanmak** → Sonnet genelde yeterli, Opus pahalı

---

## 🎯 Örnek Workflow

```bash
# 1. Proje başlat
cd my-project
claude

# 2. Plan mode'a geç
[Shift+Tab x2]

# 3. Explore
"Analyze the codebase structure"
"I want to add user authentication. Explore 3 solutions, simplest first."

# 4. Plan oluştur
"Create a spec.md with requirements, tech stack, and 3 milestones"
"Create detailed todo list for milestone 1"

# 5. Normal mode'a dön, implement
[Shift+Tab]
"Implement milestone 1 from todo list"

# 6. Test et
"Run tests and fix any failures"

# 7. Commit
"Commit with descriptive message and create PR"

# 8. Review
/install-github-app  # Auto PR review setup

# 9. Yeni task için temizle
/clear
```

---

## 📈 Performans Takibi

```bash
# Usage monitoring
/status              # Kalan token/limit
/stats               # Detailed usage stats

# Custom status line (advanced)
# ~/.bashrc veya ~/.zshrc'ye ekle
export PS1='$(claude-status) '$PS1

# Token usage scripts
# ~/.claude/projects// altında loglar
```

---

## 🔥 Pro Tips

1. **Browser Integration:** Claude in Chrome extension ile UI test et
2. **Multiple Models:** Gemini CLI fallback olarak kullan (web scraping için)
3. **Container Sandbox:** Docker'da Claude Code çalıştırarak risky operations test et
4. **Hooks:** Pre/post tool use hooks ile custom automation
5. **Templates:** Sık kullanılan workflow'lar için template'ler oluştur
6. **Analytics:** Session loglarını analiz et, pattern'leri bul

---

## 🆘 Problem Çözme

**"Usage limit reached":**
- Extra usage aç (Settings > Usage)
- Max plana upgrade et
- API credits kullan
- 5 saat reset bekle

**"Context window full":**
- `/clear` - Yeni başla
- `/compact` - Sıkıştır
- Daha az dosya tag'le

**"Claude yapıyor ama yanlış":**
- Plan mode'a dön
- CLAUDE.md'yi güncelle
- Daha spesifik prompt yaz
- Örnek kod göster

**"Çok yavaş":**
- Gereksiz context'i temizle
- Küçük dosyalara böl
- Parallel sessions kullan

---

## 📖 Daha Fazla Kaynak

- **Shipyard Cheatsheet:** https://shipyard.build/blog/claude-code-cheat-sheet/
- **YK's 45 Tips:** https://github.com/ykdojo/claude-code-tips
- **Builder.io Guide:** https://www.builder.io/blog/claude-code
- **r/ClaudeAI:** Reddit'te güncel tartışmalar ve sorun çözümleri

---

## 🎬 Son Notlar

**Agent İçin Öneriler:**
1. Her session başında CLAUDE.md'yi oku
2. Kompleks tasklar için Plan Mode zorunlu
3. Token limitlerini sürekli takip et (`/status`)
4. Hata loglarını kaydet ve CLAUDE.md'yi güncelle
5. Paralel task'lar için worktree kullan
6. Doğrulama adımlarını atla (test/lint)

**Remember:** Claude Code bir tool değil, bir team member. Ona context ver, planını paylaş, feedback ver. Ne kadar iyi eğitirsen o kadar iyi çalışır.

---

*Son güncelleme: Şubat 2026*
*Claude 4.5 Sonnet & Opus 4.6 güncel bilgiler*