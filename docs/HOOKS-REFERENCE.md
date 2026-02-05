# Hooks Reference

Complete reference for all 20 OpenClaw hooks.

---

## Security Hooks

### router-guard
**Event**: `agent:bootstrap`  
**Purpose**: Contact-based routing with +90 filtering

**Features**:
- Checks `contacts.yaml` for admin/trusted/blocked
- Routes +90 unknown numbers to demo agent (sandbox)
- Blocks numbers in blocked list
- Loads `routing.yaml` for dynamic rules

**Config**: `config/routing.yaml`, `config/contacts.yaml`

---

### secret-guard
**Event**: `agent:response`  
**Purpose**: Redact API keys from responses

**Patterns** (9):
- OpenAI: `sk-...`
- Anthropic: `sk-ant-...`
- Google: `AIza...`
- GitHub

: `ghp_...`, `gho_...`
- AWS: `AKIA...`
- Stripe: `sk_live_...`
- Tailscale: `tskey-...`

---

### rate-limiter
**Event**: `agent:bootstrap`  
**Purpose**: Daily token quotas per user

**Limits** (`contacts.yaml`):
- Admin: unlimited
- Trusted: 200,000 tokens/day
- Unknown: 50,000 tokens/day

**Notifications**: WhatsApp message at 80%, hard stop at 100%

---

### emergency-bypass
**Event**: `command`  
**Purpose**: Admin-only `/o` command for direct Opus access

**Usage**: `/o your prompt here`

**Security**:
- Admin-only (checks `contacts.yaml`)
- All tools enabled
- Logged in `security.jsonl`

---

## Analytics Hooks

### billing-tracker
**Event**: `agent:response`  
**Purpose**: Log token usage

**Storage**: `~/.openclaw/logs/billing.jsonl`

**Fields**:
```json
{
  "timestamp": "2025-01-01T12:00:00Z",
  "sender_id": "+905357874261",
  "agent": "admin",
  "model": "claude-sonnet-4",
  "input_tokens": 1200,
  "output_tokens": 300,
  "cost_usd": 0.015
}
```

---

### intent-classifier
**Event**: `agent:bootstrap`  
**Purpose**: Classify message intent

**Intents**: greeting, question, task, coding, research

**Strategy**:
1. Heuristics (keywords, length, prefix)
2. Model self-report (fallback)

**Storage**: Session metadata

---

### context-optimizer
**Event**: `agent:bootstrap`  
**Purpose**: Optimize context window

**History limits**:
- Greeting: 3 messages
- Question: 10 messages
- Task: 20 messages
- Coding: 50 messages + workspace files
- Research: full history

**Anthropic caching**: Enabled for SOUL + workspace files

---

## Safety Hooks

### loop-detector
**Event**: `agent:bootstrap`, `agent:response`  
**Purpose**: Timeout protection

**Timeouts**:
- Greeting: 30s
- Question: 2m
- Task: 5m
- Coding: 10m
- Research: 15m

**Action**: Log to `security.jsonl`, kill process

---

### handoff-manager
**Event**: `agent:response`  
**Purpose**: Model escalation

**Chain**: Haiku → Sonnet → Opus

**Triggers**:
- Tool call: `request_upgrade`
- Tool call: `escalate_to_opus`

**Storage**: `workspace/memory/handoff/active.json`

---

## Automation Hooks

### heartbeat-scheduler
**Event**: `gateway:startup`, periodic (internal)  
**Purpose**: Cron task automation

**Config**: `config/heartbeat.yaml`

**Handlers**:
- `ai`: Send prompt to agent
- `command`: Execute shell command

**Features**:
- Active hours check
- Night mode (skip/allow/queue)

---

### backup-automator
**Event**: `heartbeat:github_backup`  
**Purpose**: Automated git backup

**Schedule**: Every 6 hours

**Commands**:
```bash
cd ~/.openclaw
git add .
git commit -m "Auto backup"
git push
```

**Error handling**: Detects merge conflicts, missing upstream

---

### error-memory
**Event**: `agent:error`  
**Purpose**: Coder learning loop

**Storage**: `workspace/memory/error_log/`

**Flow**:
1. Search for similar error
2. Found → Apply stored solution
3. Not found → Research, solve, store

---

## Intelligence Hooks

### image-processor
**Event**: `agent:bootstrap`  
**Purpose**: Gemini Flash vision analysis

**Models**: `gemini-3-flash-preview` → `gemini-2.5-flash`

**Features**:
- Process image attachments
- Add descriptions to context
- Fallback on quota errors

**Env**: `GEMINI_API_KEY`

---

### model-fallback
**Event**: `agent:model_request`  
**Purpose**: Cost optimization

**Chain**: OpenRouter free → Haiku → Gemini Flash

**Usage**: Set `model: "openrouter_free"` in config

---

## Coordination Hooks

### mention-notifier
**Event**: `agent:response`  
**Purpose**: Agent @mentions

**Usage**: `"Daily summary için @security"`

**Storage**: `~/.openclaw/data/notifications.jsonl`

**Delivery**: Attempted immediately, queued for heartbeat pickup

---

### task-lock-manager
**Event**: `task:start`, `task:complete`  
**Purpose**: Distributed task locking

**Storage**: Cloudflare KV (primary), local `.locks/` (fallback)

**Expiry**: 10 minutes

---

### contact-enricher
**Event**: `agent:message`  
**Purpose**: Extract WhatsApp profile names

**Storage**: `storage/contacts/`

**Fields**: id, name, category, phone, created_at, last_seen, message_count

---

## Monitoring Hooks

### security-reporter
**Event**: `heartbeat:security_report`  
**Purpose**: Daily security audit

**Schedule**: 09:00 daily

**Sections**:
- Security events (critical/warning/info)
- Token usage stats
- Agent health

**Output**: WhatsApp message to admin

---

## VPS Hooks

### vps-mode-switch
**Event**: `command`  
**Purpose**: Switch between Original and Kamino modes

**Commands**:
- `/vps original` - Strict admin-only
- `/vps kamino` - Enhanced (20 hooks)
- `/vps status` - Show active mode

**Security**: Admin-only

**Persistence**: Systemd service restores mode on reboot

---

## Hook Development

### Creating Custom Hooks

1. **Create directory**: `hooks/my-hook/`
2. **Add HOOK.md**:
```markdown
---
name: my-hook
description: "What it does"
metadata: { "openclaw": { "emoji": "🎯", "events": ["agent:bootstrap"] } }
---
```
3. **Add handler.ts**:
```typescript
const handler = async (event: HookEvent): Promise<void> => {
  // Your logic
};
export default handler;
```
4. **Enable**: Add to `openclaw.json` hooks.internal.entries

### Best Practices

- ✅ Filter events early (return if not relevant)
- ✅ Handle errors gracefully
- ✅ Keep handlers fast (< 100ms)
- ✅ Log to appropriate files
- ⚠️ Never block the event loop
- ⚠️ Avoid heavy I/O in agent:bootstrap

---

## Event Reference

| Event | When | Context |
|-------|------|---------|
| `agent:bootstrap` | Before bootstrap files injected | `context.bootstrapFiles` (mutable) |
| `agent:response` | After agent response | `context.response`, `context.tokens` |
| `command` | Slash command | `context.text` |
| `gateway:startup` | Gateway starts | - |
| `heartbeat:<task>` | Cron task fires | `context.taskName` |
| `agent:error` | Agent error | `context.error` |
| `task:start` | Task begins | `context.taskId` |
| `task:complete` | Task ends | `context.taskId` |

---

## Troubleshooting

### Hook not discovered
```bash
# Check hook structure
ls hooks/my-hook/
# Should show: HOOK.md, handler.ts

# Check discovery
openclaw hooks list | grep my-hook
```

### Hook not executing
```bash
# Check enabled status
openclaw hooks list
# Should show: ✓ next to enabled hooks

# Check logs
tail -f ~/.openclaw/logs/gateway.log | grep my-hook
```

### Handler errors
Check `gateway.log` for stack traces. Common issues:
- Missing await on async calls
- Unhandled promise rejections
- File I/O errors
