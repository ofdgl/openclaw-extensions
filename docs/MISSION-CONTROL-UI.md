# Mission Control UI

Web-based dashboard for monitoring and controlling the OpenClaw multi-agent system.

**URL**: `https://kamino.ömerfaruk.com/mc/` (via Cloudflare Worker → nginx → serve)
**Repo**: `openclaw-extensions/ui/mission-control/`

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Browser                                │
│  React + Vite SPA                       │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────┐
│  Cloudflare Worker (kamino-proxy)       │
│  - Landing page at /                   │
│  - Adds X-Kamino-Secret header         │
│  - Proxies /mc/, /api/, /openclaw/     │
└──────────────┬──────────────────────────┘
               │ HTTP (with secret header)
               ▼
┌─────────────────────────────────────────┐
│  nginx (VPS port 80)                   │
│  - Cloudflare IP allowlist             │
│  - X-Kamino-Secret verification        │
│  - /mc/ → serve :7891                  │
│  - /api/ → Hono API :9347             │
│  - /openclaw/ → Gateway :48991        │
└──────┬────────────────┬─────────────────┘
       ▼                ▼
┌──────────────┐ ┌──────────────────────┐
│  npx serve   │ │  Hono API Server     │
│  :7891       │ │  :9347               │
│  Static SPA  │ │  REST endpoints      │
└──────────────┘ │  dotenv auth         │
                 │  Reads OpenClaw data │
                 └──────────────────────┘
```

---

## Authentication

### Two-Layer Auth

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **nginx** | `X-Kamino-Secret` header | Blocks bots/scanners bypassing Cloudflare |
| **API** | `?key=` or `X-API-Key` header | Authenticates UI requests |

### Access Flow

1. User visits `https://kamino.ömerfaruk.com/mc/?key=API_KEY`
2. `api.ts` → `initApiKey()` reads `?key=` → stores in `localStorage` → cleans URL
3. `AccessGuard.tsx` → calls `/api/auth/check` with stored key
4. If valid → shows dashboard. If invalid → shows login form
5. All subsequent API calls include `?key=` query param

### API Key

The API key is stored in `/root/openclaw-extensions/api/.env`:
```
API_SECRET_KEY=kamino_mc_2def0d927d7fc5270bd24d33da454cf39
```

---

## Pages

### Dashboard
Summary cards showing agent count, active sessions, recent token usage, system health.

### Agents
- **Agent cards** in a grid layout (ID, model, status, sessions, SOUL name)
- **Agent Details** panel (opens above grid on click):
  - Info cards: Model, Sessions, SOUL, Tools
  - Action buttons: **View SOUL** → Memory Browser, **View Sessions** → Session Manager, **Browse Workspace** → Memory Browser
- **Model dropdown**: 19 models across Anthropic (Claude 4.6/4.5/4/3.5), Google (Gemini 2.5/2.0), OpenAI (GPT-4.1/o4)

### Sessions
- List of all active/recent sessions with user, agent, model, message count, token usage
- `filterAgent` prop for cross-page filtering (from Agent Details → View Sessions)
- Expandable message history per session

### Memory Browser
- File tree from agent workspaces (`~/.openclaw/workspace-*/memory/`)
- **Source filters**: Main Workspace, per-agent workspaces, hooks
- 3-column layout: source sidebar, file list, content viewer
- `initialPath` prop for cross-page navigation (from Agent Details → View SOUL)

### Token Logs
- Chronological log of all LLM interactions
- Shows role (user/assistant), input/output/cache tokens, model, content preview
- User messages included (even with 0 tokens)

### Cron Tasks
- List of scheduled cron jobs from `~/.openclaw/data/cron/`
- Shows name, schedule (cron expression), target agent, message, timezone, status

### Routing Config
- Agent definitions from `openclaw.json` agents.list
- Routing bindings: channel + peer → agent mapping
- Add/remove bindings with channel, peer type (DM/Group), peer ID, target agent

### Contacts
- Contact directory from `contacts.yaml`
- Admin, trusted, blocked categories

### Hooks
- List of installed hooks from `~/.openclaw/hooks/`
- Enable/disable toggle

### Settings
- Mission Control app settings (auto-refresh interval, etc.)

### Security
- Security event log from `security.jsonl`

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Vanilla CSS (kamino design system) |
| Icons | lucide-react |
| API Server | Hono (Node.js) |
| Static Server | npx serve |
| Reverse Proxy | nginx |
| CDN/Proxy | Cloudflare Workers |
| Auth | API key via query param / localStorage |

---

## API Endpoints

All endpoints require `?key=API_KEY` or `X-API-Key` header.

### Core
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (no auth) |
| `/api/auth/check` | GET | Validate API key |

### Data
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Dashboard summary stats |
| `/api/agents` | GET | Agent list + available models |
| `/api/agents/:id/model` | PUT | Change agent model |
| `/api/sessions` | GET | Session list |
| `/api/sessions/:id` | GET | Session messages |
| `/api/memory` | GET | Memory files (all agents) |
| `/api/memory/file` | GET | Read a specific file |
| `/api/logs/tokens` | GET | Token usage logs |
| `/api/cron/jobs` | GET | Cron job list |
| `/api/contacts` | GET | Contact directory |
| `/api/hooks` | GET | Hook list |

### Config
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/routing` | GET | Routing config (agents + bindings) |
| `/api/routing/agents` | PUT | Update agent list |
| `/api/routing/bindings` | PUT | Update bindings |
| `/api/routing/settings` | GET/PUT | MC settings |

---

## Deployment

### Build & Deploy

```bash
# 1. Build UI (local)
cd openclaw-extensions/ui/mission-control
npm run build

# 2. Deploy to VPS
scp -i ~/.ssh/id_rsa_openclaw dist/* root@VPS:/root/openclaw-extensions/ui/mission-control/dist/
scp -i ~/.ssh/id_rsa_openclaw dist/assets/* root@VPS:/root/openclaw-extensions/ui/mission-control/dist/assets/

# 3. Deploy API changes
scp -i ~/.ssh/id_rsa_openclaw api/server.ts root@VPS:/root/openclaw-extensions/api/server.ts
ssh root@VPS "bash /root/restart-api.sh"

# 4. Deploy nginx config
scp -i ~/.ssh/id_rsa_openclaw kamino-proxy/nginx-kamino.conf root@VPS:/etc/nginx/sites-available/kamino.conf
ssh root@VPS "nginx -t && nginx -s reload"

# 5. Deploy Worker (Cloudflare)
cd kamino-proxy && npx wrangler deploy
```

### VPS Processes

| Process | Port | Command | Serves |
|---------|------|---------|--------|
| `serve` | 7891 | `npx serve -s . -l 7891` | UI static files |
| Hono API | 9347 | `npx tsx api/index.ts` | REST API |
| nginx | 80 | system service | Reverse proxy |
| OpenClaw | 18789 | `openclaw-gateway` | Gateway |

### Restart Commands

```bash
# API restart
bash /root/restart-api.sh

# nginx reload
nginx -t && nginx -s reload

# UI serve (auto-serves new files, no restart needed)
```

---

## Cross-Page Navigation

The `NavState` interface enables deep linking between pages:

```typescript
interface NavState {
    filterAgent?: string   // Filter sessions/logs by agent ID
    openFilePath?: string  // Open a specific file in Memory Browser
}
```

### Navigation Flows
- **Agent Details → View SOUL**: Opens Memory Browser with `openFilePath` to agent's SOUL.md
- **Agent Details → View Sessions**: Opens Session Manager with `filterAgent` to show only that agent's sessions
- **Agent Details → Browse Workspace**: Opens Memory Browser with `openFilePath` to agent's workspace

---

## Security Layers

```
Internet → Cloudflare (DDoS, WAF)
        → Worker (adds X-Kamino-Secret)
        → nginx (IP allowlist + secret check)
        → API (API key validation)
        → UI (AccessGuard → localStorage key)
```

### X-Kamino-Secret
- Worker adds `X-Kamino-Secret: k4m1n0-...` to every proxied request
- nginx verifies at server level — returns 403 if missing/invalid
- Localhost (127.0.0.1) exempted for health checks
- Prevents direct VPS access from bots that bypass Cloudflare
