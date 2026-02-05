# Multi-Agent Guide

Guide to the 4-agent system with SOUL personalities.

---

## Overview

OpenClaw Extensions implements a **4-agent hierarchy** with specialized roles:

```
┌──────────────────────────────────────────────────┐
│                  Message Router                   │
│           (router-guard hook)                     │
└────────┬─────────────────────────────────────────┘
         │
    ┌────┴───────┬───────────┬──────────┐
    ▼            ▼           ▼          ▼
┌────────┐  ┌─────────┐ ┌───────┐ ┌─────────┐
│ Admin  │  │Security │ │ Demo  │ │ Intern  │
│Sonnet 4│  │ Haiku   │ │ Haiku │ │ Haiku   │
│ FULL   │  │ AUDIT   │ │SANDBOX│ │MINIMAL  │
└────────┘  └─────────┘ └───────┘ └─────────┘
```

---

## Agent Comparison

| Feature | Admin | Security | Demo | Intern |
|---------|-------|----------|------|--------|
| **Model** | Sonnet 4 | Haiku | Haiku | Haiku |
| **Access** | Full | Read + Audit | Read | Read-only |
| **Tools** | All | Selective | Limited | Minimal |
| **Rate Limit** | Unlimited | 100k/day | 50k/day | 20k/day |
| **Workspace** | Private | Private | Shared | Shared |
| **Can Upgrade** | ✅ → Opus | ✅ → Sonnet | ❌ | ❌ |
| **Sandbox** | ❌ | ❌ | ✅ | ✅ |

---

## Admin Agent

### Purpose
Primary assistant with full system access.

### SOUL (`souls/admin.md`)

```markdown
# Admin Agent SOUL

Sen Kowalski'nin birincil AI asistanısın. Tam yetkiye sahipsin.

## Kimlik
- **İsim**: Kowalski-Admin
- **Rol**: Birincil AI asistan
- **Yetki**: Tam yetki (admin)

## Yetenekler
- Tüm dosyaları okuyabilir ve yazabilirsin
- Terminal komutları çalıştırabilirsin
- Diğer agentlara mention atabilirsin (@security, @demo, @intern)
- Sistem konfigürasyonunu değiştirebilirsin

## Davranış Kuralları
1. **Önce güvenlik**: Hassas bilgileri asla açığa çıkarma
2. **Emin ol**: Silme/değiştirme öncesi teyit al
3. **Dokümante et**: Önemli değişiklikleri kaydet
4. **Türkçe**: Tüm yanıtlarını Türkçe ver
```

### Config

```json
{
  "agents": {
    "entries": {
      "admin": {
        "workspace": "~/.openclaw-kamino/workspaces/admin",
        "model": "claude-sonnet-4-20250514",
        "soul": "~/.openclaw-kamino/souls/admin.md",
        "tools": "all"
      }
    }
  }
}
```

### Use Cases
- Complex coding tasks
- System administration
- File management
- Research & analysis

---

## Security Agent

### Purpose
Audit, monitoring, and security reporting.

### SOUL (`souls/security.md`)

```markdown
# Security Agent SOUL

Sen Kowalski sisteminin güvenlik uzmanısın.

## Görevler
1. **Günlük güvenlik raporu** oluştur
2. **Şüpheli aktiviteleri** tespit et ve bildir
3. **Token kullanımını** izle
4. **Erişim loglarını** analiz et

## Raporlama
📊 GÜVENLİK RAPORU - [Tarih]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 Kritik: [sayı]
🟡 Uyarı: [sayı]
🟢 Bilgi: [sayı]
```

### Config

```json
{
  "security": {
    "model": "claude-3-5-haiku",
    "soul": "~/.openclaw-kamino/souls/security.md",
    "tools": ["read_file", "list_dir", "grep_search", "run_command"]
  }
}
```

### Automated Tasks

Via `heartbeat.yaml`:
```yaml
tasks:
  - name: security_report
    schedule: "0 9 * * *"  # Daily at 09:00
    handler: ai
    prompt: "Güvenlik raporunu oluştur"
    agent: security
```

### Use Cases
- Daily security reports
- Log analysis
- Anomaly detection
- Token usage monitoring

---

## Demo Agent

### Purpose
Sandbox environment for new/unknown users.

### SOUL (`souls/demo.md`)

```markdown
# Demo Agent SOUL

Sen bir demo asistanısın. Yeni kullanıcılara OpenClaw'ın 
yeteneklerini gösterirsin.

## Amaç
Potansiyel kullanıcılara zararsız ve eğlenceli bir deneyim sun.

## YAPAMAZSIN
- ❌ Dosya yazma veya değiştirme
- ❌ Terminal komutu çalıştırma
- ❌ Sistem dosyalarına erişim

## Mesaj Limiti
- 5. mesaj: "⚠️ Demo sınırına yaklaşıyorsunuz"
- 8. mesaj: "Demo sonlandı. Devam için: @admin"
```

### Config

```json
{
  "demo": {
    "model": "claude-3-5-haiku",
    "soul": "~/.openclaw-kamino/souls/demo.md",
    "tools": ["read_file", "list_dir", "grep_search"],
    "sandbox": true
  }
}
```

### Sandbox Restrictions

```yaml
# routing.yaml
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

### Use Cases
- New user onboarding
- Unknown +90 numbers
- Public demos
- Safe exploration

---

## Intern Agent

### Purpose
Minimal-permission agent for extremely restricted access.

### SOUL (`souls/intern.md`)

```markdown
# Intern Agent SOUL

Sen bir stajyer asistanısın. Çok sınırlı yetkilerle çalışırsın.

## Yetenekler
- Sadece dosya okuyabilirsin (read_file)

## YAPAMAZSIN
- ❌ Dosya yazma
- ❌ Dizin listeleme
- ❌ Arama yapma
- ❌ Komut çalıştırma

## Rate Limit
Günlük 20.000 token limiti var.
```

### Config

```json
{
  "intern": {
    "model": "claude-3-5-haiku",
    "soul": "~/.openclaw-kamino/souls/intern.md",
    "tools": ["read_file"],
    "sandbox": true
  }
}
```

### Use Cases
- Ultra-restricted access
- Unknown non-TR numbers
- Testing minimal permissions

---

## Routing Logic

### Contact-Based Routing

```yaml
# routing.yaml
routes:
  - match:
      category: admin
    agent: admin          # Admin users → Admin agent
    
  - match:
      category: trusted
    agent: security       # Trusted users → Security agent
    
  - match:
      phone_prefix: "+90"
      category: unknown
    agent: demo           # Unknown TR → Demo agent (sandbox)
    
  - match:
      category: unknown
    agent: intern         # Other unknown → Intern agent
```

### Flow Diagram

```
Message arrives
    ↓
contact-enricher → Extract sender info
    ↓
Check contacts.yaml
    ↓
┌─────────────┬──────────────┬──────────────┬──────────────┐
│  Admin?     │  Trusted?    │  +90?        │  Unknown     │
│  ✓          │  ✓           │  ✓           │  ✓           │
│  → admin    │  → security  │  → demo      │  → intern    │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

---

## Agent Communication

### @Mention System

Agents can communicate via `@mention` syntax:

```
Admin Agent: "Günlük özet için @security"
           ↓
mention-notifier hook
           ↓
notifications.jsonl
           ↓
Security Agent receives notification
```

### Notification Queue

```jsonl
// ~/.openclaw/data/notifications.jsonl
{"from":"admin","to":"security","message":"Günlük özet hazırla","timestamp":"2025-01-01T12:00:00Z"}
```

### Delivery

```yaml
# heartbeat.yaml
tasks:
  - name: check_notifications
    schedule: "*/5 * * * *"
    handler: ai
    prompt: "Bekleyen bildirimleri kontrol et"
    agent: admin
```

---

## Task Coordination

### Distributed Locking

```typescript
// Agent 1 starts task
task-lock-manager hook → Set lock

// Agent 2 tries same task
task-lock-manager hook → Lock exists, reject
```

### Lock Storage

```json
// .locks/deploy.json
{
  "task_id": "deploy",
  "agent": "admin",
  "started_at": "2025-01-01T12:00:00Z",
  "expires_at": "2025-01-01T12:10:00Z"
}
```

---

## Model Escalation

### Handoff Chain

```
Haiku (agents: security/demo/intern)
  ↓ request_upgrade
Sonnet (agent: admin)
  ↓ escalate_to_opus
Opus (temporary upgrade)
```

### Trigger

```typescript
// In agent prompt
"This task is too complex. I need to use request_upgrade."

// handoff-manager hook catches this
// Escalates to next model tier
```

---

## Workspace Isolation

Each agent has its own workspace:

```
~/.openclaw-kamino/workspaces/
├── admin/
│   ├── memory/
│   └── projects/
├── security/
│   └── audit_reports/
├── demo/
│   └── examples/
└── intern/
    └── readonly/
```

**Isolation benefits**:
- Prevent accidental file conflicts
- Clearer context per agent
- Easier debugging

---

## Creating New Agents

### 1. Create SOUL file

```bash
nano ~/.openclaw-kamino/souls/new-agent.md
```

```markdown
# New Agent SOUL
Sen özel bir asistansın...
```

### 2. Add to openclaw.json

```json
{
  "agents": {
    "entries": {
      "new-agent": {
        "workspace": "~/.openclaw-kamino/workspaces/new-agent",
        "model": "claude-3-5-haiku",
        "soul": "~/.openclaw-kamino/souls/new-agent.md",
        "tools": ["read_file"],
        "sandbox": false
      }
    }
  }
}
```

### 3. Add routing rule

```yaml
# routing.yaml
routes:
  - match:
      category: new-category
    agent: new-agent
```

### 4. Create workspace

```bash
mkdir -p ~/.openclaw-kamino/workspaces/new-agent
```

### 5. Restart gateway

```bash
docker restart openclaw
```

---

## Best Practices

1. **Least Privilege**: Start with minimal tools, add as needed
2. **SOUL Clarity**: Make personality and limitations explicit
3. **Workspace Separation**: Never mix agent workspaces
4. **Rate Limits**: Set appropriate limits for cost control
5. **Sandbox First**: Always sandbox untrusted agents

---

## Troubleshooting

### Agent not responding

```bash
# Check agent exists
jq '.agents.entries' ~/.openclaw/openclaw.json

# Check workspace
ls -la ~/.openclaw/workspaces/admin/

# Check SOUL file
cat ~/.openclaw/souls/admin.md
```

### Wrong agent selected

```bash
# Check routing rules
cat ~/.openclaw/config/routing.yaml

# Check contacts.yaml
cat ~/.openclaw/config/contacts.yaml

# Test routing manually
openclaw test-route --phone "+905357874261"
```

### Sandbox not working

```bash
# Check sandbox flag
jq '.agents.entries.demo.sandbox' ~/.openclaw/openclaw.json
# Should return: true

# Check logs
docker logs openclaw | grep sandbox
```
