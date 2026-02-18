# VPS Deployment Guide

This guide documents how to deploy OpenClaw Extensions (hooks, API, and Mission Control UI) to a VPS.

## Prerequisites

- OpenClaw 2026.2.x installed on VPS (`openclaw-gateway` running)
- SSH access to VPS
- Node.js 20+ on VPS
- Cloudflare Worker deployed (kamino-proxy)
- nginx installed on VPS

---

## Quick Deploy (Full Stack)

### 1. Deploy Hooks

```bash
# Copy hooks to OpenClaw hooks directory
scp -i ~/.ssh/id_rsa_openclaw -r hooks/* root@VPS:/root/.openclaw/hooks/

# Verify on VPS
ssh root@VPS "ls ~/.openclaw/hooks/"
```

### 2. Deploy API

```bash
# Copy API source
scp -i ~/.ssh/id_rsa_openclaw -r api/ root@VPS:/root/openclaw-extensions/api/

# Create .env if first time
ssh root@VPS "echo 'API_SECRET_KEY=your-secret-key' > /root/openclaw-extensions/api/.env"

# Install dependencies
ssh root@VPS "cd /root/openclaw-extensions/api && npm install"

# Start / restart API
ssh root@VPS "bash /root/restart-api.sh"
```

### 3. Deploy Mission Control UI

```bash
# Build locally
cd ui/mission-control && npm run build

# Deploy built files
scp -i ~/.ssh/id_rsa_openclaw dist/index.html root@VPS:/root/openclaw-extensions/ui/mission-control/dist/
scp -i ~/.ssh/id_rsa_openclaw -r dist/assets/* root@VPS:/root/openclaw-extensions/ui/mission-control/dist/assets/
```

### 4. Deploy nginx Config

```bash
scp -i ~/.ssh/id_rsa_openclaw kamino-proxy/nginx-kamino.conf \
    root@VPS:/etc/nginx/sites-available/kamino.conf

ssh root@VPS "ln -sf /etc/nginx/sites-available/kamino.conf /etc/nginx/sites-enabled/"
ssh root@VPS "nginx -t && nginx -s reload"
```

### 5. Deploy Cloudflare Worker

```bash
cd kamino-proxy && npx wrangler deploy
```

---

## VPS Process Table

| Process | Port | PID Check | Start Command |
|---------|------|-----------|---------------|
| `openclaw-gateway` | 18789 | `pidof openclaw-gateway` | systemd / manual |
| Hono API | 9347 | `ss -tlnp \| grep 9347` | `nohup npx tsx api/index.ts &` |
| npx serve (UI) | 7891 | `ss -tlnp \| grep 7891` | `npx serve -s . -l 7891` |
| nginx | 80 | `systemctl status nginx` | `systemctl start nginx` |

---

## nginx Configuration

The nginx config (`nginx-kamino.conf`) does:

1. **Cloudflare IP allowlist** — only Cloudflare IPs + localhost
2. **X-Kamino-Secret verification** — server-level `if` check (not in location blocks due to "if is evil" pattern)
3. **Proxy routing**:
   - `/mc/` → `http://127.0.0.1:7891/` (UI static server)
   - `/api/` → `http://127.0.0.1:9347/` (Hono API)
   - `/openclaw/` → `http://127.0.0.1:48991/` (OpenClaw Gateway)
   - `/health` → `http://127.0.0.1:9347/health` (health check, localhost only)

> [!CAUTION]
> Never use `if` + `proxy_pass` inside the same `location` block in nginx — it silently breaks proxying ("if is evil" pattern). The secret check MUST be at server level.

---

## Hook Categories

### Security Hooks
- `router-guard` — Routes messages based on sender and contact category (contacts.yaml)
- `secret-guard` — Redacts API keys from responses
- `emergency-bypass` — `/o` command bypass for urgent messages
- `security-reporter` — Periodic security audit reports

### Rate Limiting
- `rate-limiter` — Per-user daily token limits

### Multi-Agent
- `handoff-manager` — Agent escalation/handoff (Haiku → Sonnet → Opus)
- `mention-notifier` — @mention notifications between agents

### Intelligence
- `intent-classifier` — Classifies message intent (greeting, coding, etc.)
- `context-optimizer` — Adjusts context window based on intent
- `loop-detector` — Kills stuck agent sessions

### Automation
- `backup-automator` — Git backup on `/new` command
- `heartbeat-scheduler` — Periodic scheduled tasks
- `daily-standup` — Automated daily summary

### Analytics
- `billing-tracker` — Token usage logging to billing.jsonl
- `contact-enricher` — Enriches contact metadata from WhatsApp pushName

---

## Updating Individual Components

### API Only
```bash
scp -i ~/.ssh/id_rsa_openclaw api/server.ts root@VPS:/root/openclaw-extensions/api/server.ts
ssh root@VPS "bash /root/restart-api.sh"
```

### UI Only
```bash
cd ui/mission-control && npm run build
scp -i ~/.ssh/id_rsa_openclaw dist/index.html root@VPS:/root/openclaw-extensions/ui/mission-control/dist/
scp -i ~/.ssh/id_rsa_openclaw -r dist/assets/* root@VPS:/root/openclaw-extensions/ui/mission-control/dist/assets/
```

### Single Hook
```bash
scp -i ~/.ssh/id_rsa_openclaw -r hooks/router-guard/ root@VPS:/root/.openclaw/hooks/router-guard/
```

---

## Restart Scripts

### API Restart (restart-api.sh)
```bash
#!/bin/bash
pkill -f "tsx.*index.ts" 2>/dev/null
cd /root/openclaw-extensions/api
nohup npx tsx index.ts > /tmp/api.log 2>&1 &
echo "API started"
```

### Full Stack Restart
```bash
# Gateway
systemctl restart openclaw 2>/dev/null || openclaw-gateway &

# API
bash /root/restart-api.sh

# UI (auto-restarts if killed)
cd /root/openclaw-extensions/ui/mission-control/dist
npx serve -s . -l 7891 &

# nginx
nginx -s reload
```

---

## Troubleshooting

### MC Shows "Access Denied"
- Browser may have cached old JS. Try **Ctrl+Shift+R** (hard refresh)
- Check API key is correct: `curl http://localhost:9347/api/auth/check?key=YOUR_KEY`
- Ensure `.env` file exists: `cat /root/openclaw-extensions/api/.env`

### nginx Returns 403
- Check `X-Kamino-Secret` header is sent by Worker
- Verify Cloudflare IPs are up-to-date in nginx config
- Check `nginx -t` for syntax errors
- See logs: `tail /var/log/nginx/error.log`

### API Not Responding
- Check if running: `ss -tlnp | grep 9347`
- Check logs: `cat /tmp/api.log`
- Restart: `bash /root/restart-api.sh`

### Hooks Not Triggering
- Check hook exists: `ls ~/.openclaw/hooks/`
- Verify `HOOK.md` and `handler.ts` are present
- Check event type in HOOK.md matches expected events
- Restart gateway after changes

### Group Messages Not Received
- Check `groupPolicy` in `openclaw.json` — must be `"open"` or group in allowlist
- Group JID format: `120363XXXXX@g.us`

---

## Verifying Installation

```bash
# Check processes
ss -tlnp | grep -E '7891|9347|18789|80'

# API health
curl http://localhost:9347/health

# API auth
curl "http://localhost:9347/api/agents?key=YOUR_KEY"

# UI serving
curl -s http://localhost:7891/ | head -1

# Through Cloudflare
curl -s "https://kamino.ömerfaruk.com/api/api/auth/check?key=YOUR_KEY"
```
