# soul-for-extensions.md — openclaw-extensions Proje Bilgisi

Bu dosyayı openclaw-extensions üzerinde çalışırken oku.

## Proje Genel Bakış

**openclaw-extensions** (diğer adı: Kamino), OpenClaw Gateway üzerine inşa edilmiş hook sistemi, multi-agent koordinasyonu ve Mission Control UI'dan oluşan bir extension platformu.

## Dizin Yapısı

```
openclaw-extensions/
├── api/                    # Kamino Mission Control API (Hono, port 9347)
│   ├── index.ts            # Entry point (serve)
│   ├── server.ts           # Hono app, CORS, auth middleware, route mounting
│   ├── routes/             # API endpoint'leri
│   │   ├── agents.ts       # Agent listesi, SOUL durumu, model değiştirme
│   │   ├── billing.ts      # Maliyet takibi
│   │   ├── contacts.ts     # Kişi yönetimi
│   │   ├── costs.ts        # Maliyet analizi
│   │   ├── cron.ts         # Cron job yönetimi
│   │   ├── dashboard.ts    # Dashboard istatistikleri
│   │   ├── hooks.ts        # Hook yönetimi
│   │   ├── logviewer.ts    # Log okuma
│   │   ├── logs.ts         # Token log'ları (enriched: content, role, tokens)
│   │   ├── memory.ts       # Agent hafıza yönetimi
│   │   ├── routing.ts      # Mesaj yönlendirme
│   │   ├── security.ts     # Güvenlik raporları
│   │   ├── sessions.ts     # Session yönetimi
│   │   └── terminal.ts     # Terminal erişimi
│   └── services/
│       └── billing.ts      # BillingEntry parsing, token hesaplama
│
├── hooks/                  # OpenClaw hook'ları (20 adet)
│   ├── router-guard/       # Mesaj yönlendirme
│   ├── rate-limiter/       # Mesaj limit
│   ├── secret-guard/       # Gizli bilgi koruması
│   ├── task-lock-manager/  # Görev kilitleme
│   └── ...                 # Diğer hook'lar
│
├── ui/mission-control/     # Kamino Dashboard (React + Vite + TailwindCSS)
│   ├── src/
│   │   ├── App.tsx         # Ana sayfa, sidebar navigation
│   │   ├── config/api.ts   # API URL ve key config
│   │   └── components/     # UI bileşenleri
│   │       ├── AgentManager.tsx    # Agent listesi, SOUL durumu, model seçimi
│   │       ├── TokenLogs.tsx       # Token log'ları + detay modal
│   │       ├── SessionManager.tsx  # Session listesi + arama + mesaj görüntüleme
│   │       ├── Dashboard.tsx       # Ana dashboard
│   │       └── ...                 # Diğer bileşenler
│   └── dist/               # Build output (VPS'te serve edilir)
│
├── docs/                   # Proje dokümantasyonu (13 .md dosya)
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT-GUIDE.md
│   ├── MULTI-AGENT-GUIDE.md
│   └── ...
│
└── agents/                 # Agent dosyaları (VPS: ~/.openclaw/agents/)
    ├── coder/              # Bu agent'ın dosyaları
    └── ...
```

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| API | Hono (Node.js), TypeScript, tsx |
| UI | React, Vite, TailwindCSS |
| Serve | `npx serve` (UI), `npx tsx` (API) |
| Gateway | OpenClaw Gateway (port 18789 WS) |
| Deploy | Git push → SSH pull → build → systemd restart |
| Auth | X-API-Key header, localStorage |

## VPS Yapısı

```
/root/.openclaw/
├── agents/
│   ├── main/sessions/      # Ana agent oturumları
│   ├── admin/SOUL.md       # Kowalski (admin)
│   ├── demo/SOUL.md        # Demo agent (8 mesaj limit)
│   ├── guest/SOUL.md       # Guest agent (sandbox)
│   ├── security/SOUL.md    # Security agent (raporlar)
│   ├── intern/SOUL.md      # Intern agent (backup, cleanup)
│   └── coder/SOUL.md       # Coder agent (bu sen)
├── workspace/SOUL.md       # Ana workspace SOUL
├── hooks/                  # Aktif hook'lar (symlink)
├── openclaw.json           # Gateway config
└── .env.kamino             # API key ve environment vars
```

## API Auth

- Middleware: `server.ts` → `/api/*` route'larında `X-API-Key` header kontrolü
- Key: `process.env.API_SECRET_KEY` (`.env.kamino`'dan)
- Health check (`/health`) auth gerektirmez

## Önemli Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `api/server.ts` | Tüm route'lar, CORS, auth middleware |
| `api/services/billing.ts` | Token hesaplama, BillingEntry interface |
| `ui/src/config/api.ts` | Frontend API ayarları |
| `docs/ARCHITECTURE.md` | Sistem mimarisi |
| `docs/DEPLOYMENT-GUIDE.md` | Deploy adımları |

## Değişiklik Yaparken

1. Kodu düzenle (Claude Code ile)
2. Lokal test: `npm run dev` (UI), `npx tsx api/index.ts` (API)
3. Git commit + push
4. VPS'e SSH: `git pull` → `npm run build` → `systemctl restart kamino-api`
