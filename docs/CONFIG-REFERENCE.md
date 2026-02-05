# Configuration Reference

Complete reference for all configuration files.

---

## openclaw.json

Main OpenClaw configuration file.

### Original Mode (`openclaw-original.json`)

```json
{
  "gateway": {
    "port": 18789,
    "auth": {
      "token": "${OPENCLAW_GATEWAY_TOKEN}"
    }
  },
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {}  // No custom hooks
    }
  },
  "agents": {
    "defaults": {
      "model": "claude-sonnet-4-20250514",
      "workspace": "~/.openclaw-original/workspace"
    }
  },
  "channels": {
    "whatsapp": {
      "enabled": true,
      "allowList": {
        "mode": "strict",
        "numbers": ["+905357874261"]  // Admin only
      }
    }
  },
  "security": {
    "strictMode": true
  }
}
```

### Kamino Mode (`openclaw-kamino.json`)

```json
{
  "gateway": {
    "port": 18789,
    "reload": {
      "mode": "hybrid"  // Hot-reload configs
    }
  },
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "router-guard": { "enabled": true },
        "billing-tracker": { "enabled": true },
        // ... all 20 hooks
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "claude-3-5-haiku"
    },
    "entries": {
      "admin": {
        "model": "claude-sonnet-4-20250514",
        "soul": "~/.openclaw-kamino/souls/admin.md",
        "tools": "all"
      },
      "security": {
        "model": "claude-3-5-haiku",
        "soul": "~/.openclaw-kamino/souls/security.md",
        "tools": ["read_file", "list_dir", "grep_search", "run_command"]
      },
      "demo": {
        "model": "claude-3-5-haiku",
        "soul": "~/.openclaw-kamino/souls/demo.md",
        "tools": ["read_file", "list_dir", "grep_search"],
        "sandbox": true
      },
      "intern": {
        "model": "claude-3-5-haiku",
        "soul": "~/.openclaw-kamino/souls/intern.md",
        "tools": ["read_file"],
        "sandbox": true
      }
    }
  },
  "channels": {
    "whatsapp": {
      "enabled": true,
      "allowList": {
        "mode": "allow-all",
        "routeUnknown": "demo"  // Unknown → demo agent
      }
    }
  },
  "security": {
    "strictMode": false
  }
}
```

### Key Fields

| Field | Description | Values |
|-------|-------------|--------|
| `gateway.port` | Gateway HTTP port | Default: 18789 |
| `gateway.reload.mode` | Config hot-reload | `hybrid` (recommended) |
| `hooks.internal.enabled` | Enable hook system | `true` / `false` |
| `agents.defaults.model` | Default AI model | Model identifier |
| `agents.entries.<name>` | Agent configuration | See Multi-Agent Guide |
| `channels.<channel>.enabled` | Enable channel | `true` / `false` |
| `channels.<channel>.allowList.mode` | Message filtering | `strict` / `allow-all` |
| `security.strictMode` | Enhanced security | `true` / `false` |

---

## routing.yaml

Dynamic routing rules for message routing.

```yaml
# Default agent for unmatched contacts
default_agent: admin

# Contact-based routing rules
routes:
  - match:
      category: admin
    agent: admin
    priority: 100
    
  - match:
      category: trusted
    agent: security
    priority: 90
    
  - match:
      category: blocked
    action: reject
    message: "Bu numara engellenmiştir."
    priority: 100
    
  - match:
      phone_prefix: "+90"
      category: unknown
    agent: demo
    sandbox: true
    priority: 50
    
  - match:
      category: unknown
    agent: intern
    sandbox: true
    priority: 10

# Agent configurations
agents:
  admin:
    model: claude-sonnet-4-20250514
    tools: all
    rate_limit: none
    
  security:
    model: claude-3-5-haiku
    tools: 
      - read_file
      - list_dir
      - grep_search
      - run_command
    rate_limit: 100000  # tokens/day
    
  demo:
    model: claude-3-5-haiku
    tools:
      - read_file
      - list_dir
      - grep_search
    rate_limit: 50000
    sandbox: true
    
  intern:
    model: claude-3-5-haiku
    tools:
      - read_file
    rate_limit: 20000
    sandbox: true

# Sandbox restrictions
sandbox:
  blocked_tools:
    - run_command
    - write_to_file
    - delete_file
  blocked_paths:
    - ~/.ssh
    - ~/.openclaw/creds
    - /etc
```

### Routing Logic

1. **Priority-based matching**: Highest priority first
2. **Match criteria**: category, phone_prefix, custom fields
3. **Actions**: Route to agent OR reject
4. **Sandbox**: Automatically applied if specified

---

## contacts.yaml

Contact management and access control.

```yaml
# Admin users - full access
admins:
  - "+905357874261"  # Ömer

# Trusted users - elevated access
trusted:
  - "+905551234567"

# Blocked users - completely rejected
blocked:
  - "+901234567890"

# Rate limit overrides (tokens per day)
rate_limits:
  "+905357874261": unlimited
  "+905551234567": 200000
  default: 50000

# Contact metadata (auto-enriched)
metadata:
  "+905357874261":
    name: "Ömer"
    category: admin
    created_at: 2025-01-01
```

### Categories

| Category | Description | Default Agent | Rate Limit |
|----------|-------------|---------------|------------|
| `admin` | Full access | admin | Unlimited |
| `trusted` | Elevated access | security | 200k/day |
| `unknown` | New contacts | demo/intern | 50k/day |
| `blocked` | Spam/malicious | - (rejected) | 0 |

---

## heartbeat.yaml

Scheduled task automation.

```yaml
# Global settings
settings:
  timezone: Europe/Istanbul
  active_hours:
    start: "08:00"
    end: "23:00"
  night_mode: skip  # skip | allow | queue

# Scheduled tasks
tasks:
  # GitHub backup every 6 hours
  - name: github_backup
    schedule: "0 */6 * * *"
    handler: command
    command: "cd ~/.openclaw && git add . && git commit -m 'Auto backup' && git push"
    night_mode: allow
    
  # Security report daily at 09:00
  - name: security_report
    schedule: "0 9 * * *"
    handler: ai
    prompt: |
      Güvenlik raporunu oluştur:
      1. Son 24 saatteki güvenlik olaylarını özetle
      2. Token kullanımı istatistiklerini göster
      3. Kritik uyarıları listele
    agent: security
    
  # Health check every 15 minutes
  - name: health_check
    schedule: "*/15 * * * *"
    handler: command
    command: "openclaw health --json > ~/.openclaw/logs/health-$(date +%H%M).json"
    night_mode: allow
```

### Task Fields

| Field | Description | Values |
|-------|-------------|--------|
| `name` | Unique task identifier | String |
| `schedule` | Cron expression | `"minute hour day month weekday"` |
| `handler` | Task type | `ai` / `command` |
| `prompt` | AI prompt (for `ai` handler) | String |
| `command` | Shell command (for `command` handler) | String |
| `agent` | Target agent (for `ai` handler) | Agent name |
| `night_mode` | Night mode override | `skip` / `allow` / `queue` |

### Cron Examples

```
"*/5 * * * *"     # Every 5 minutes
"0 * * * *"       # Every hour
"0 9 * * *"       # Daily at 09:00
"0 0 * * 0"       # Weekly on Sunday
"0 3 1 * *"       # Monthly on 1st at 03:00
```

---

## Environment Variables

Required environment variables:

```bash
# Required
OPENCLAW_GATEWAY_TOKEN="your-gateway-token"

# Optional (for specific hooks)
GEMINI_API_KEY="your-gemini-key"           # image-processor
OPENROUTER_API_KEY="your-openrouter-key"   # model-fallback
CLOUDFLARE_KV_TOKEN="your-cf-token"        # task-lock-manager
```

### Setting on VPS

```bash
# Add to ~/.bashrc
export OPENCLAW_GATEWAY_TOKEN="xxx"
export GEMINI_API_KEY="yyy"

# Or in /etc/environment (system-wide)
OPENCLAW_GATEWAY_TOKEN=xxx
GEMINI_API_KEY=yyy

# Docker Compose
# Add to docker-compose.yml:
environment:
  - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
  - GEMINI_API_KEY=${GEMINI_API_KEY}
```

---

## SOUL Files

Agent personality definitions (Markdown format).

See [Multi-Agent Guide](MULTI-AGENT-GUIDE.md) for details.

---

## Storage Paths

| Path | Description |
|------|-------------|
| `~/.openclaw/openclaw.json` | Main config |
| `~/.openclaw/config/routing.yaml` | Routing rules |
| `~/.openclaw/config/contacts.yaml` | Contact lists |
| `~/.openclaw/config/heartbeat.yaml` | Scheduled tasks |
| `~/.openclaw/hooks/` | Custom hooks |
| `~/.openclaw/souls/` | Agent personalities |
| `~/.openclaw/logs/security.jsonl` | Security events |
| `~/.openclaw/logs/billing.jsonl` | Token usage |
| `~/.openclaw/data/notifications.jsonl` | @mention queue |
| `~/.openclaw/storage/contacts/` | Contact records |

---

## Hot-Reload

With `gateway.reload.mode: "hybrid"`:

- ✅ `/vps` command triggers reload
- ✅ File changes detected automatically
- ⚠️ `openclaw.json` requires gateway restart
- ⚠️ Hook handler changes require restart

```bash
# Test hot-reload
echo "test: true" >> ~/.openclaw/config/routing.yaml

# Watch logs
tail -f ~/.openclaw/logs/gateway.log | grep reload
```

---

## Validation

### Check Config Syntax

```bash
# JSON
jq . ~/.openclaw/openclaw.json

# YAML
yq . ~/.openclaw/config/routing.yaml
```

### Test Routing

```bash
# Dry-run routing
openclaw test-route --phone "+905357874261"
# Expected: admin

openclaw test-route --phone "+905551234567"
# Expected: demo (if unknown) or security (if trusted)
```
