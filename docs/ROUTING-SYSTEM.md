# Routing System

Per-session routing rules for WhatsApp DMs and group messages.

---

## How It Works

```
WhatsApp Message
       ▼
 ┌──────────────────────────┐
 │  OpenClaw Gateway        │
 │  Session Key:            │
 │  agent:main:whatsapp:    │
 │    group:123@g.us        │
 └────────┬─────────────────┘
          ▼
 ┌──────────────────────────┐
 │  router-guard hook       │
 │                          │
 │  1. Load routing-rules   │
 │  2. Match group/phone    │
 │  3. Override sessionKey  │
 │     agent:main → coder   │
 │  4. Contact-based DM     │
 │     routing (fallback)   │
 └────────┬─────────────────┘
          ▼
 ┌──────────────────────────┐
 │  Coder Agent             │
 │  SOUL: agents/coder/     │
 │  Model: gemini-2.5-flash │
 └──────────────────────────┘
```

---

## Config Files

### routing-rules.json

Location: `openclaw-extensions/config/routing-rules.json`

```json
{
  "rules": [
    {
      "match": { "type": "group", "value": "120363425477689226@g.us" },
      "agentId": "coder",
      "label": "Coder Agent WhatsApp Group",
      "priority": 100
    },
    {
      "match": { "type": "phone", "value": "+905001234567" },
      "agentId": "security",
      "label": "Security Team Lead",
      "priority": 90
    },
    {
      "match": { "type": "phone_prefix", "value": "+90" },
      "agentId": "guest",
      "label": "All Turkey numbers → guest",
      "priority": 10
    }
  ],
  "defaultAgent": "main"
}
```

### Rule Types

| Type | Match Field | Example | Description |
|------|-------------|---------|-------------|
| `group` | WhatsApp Group JID | `120363...@g.us` | Route entire group to agent |
| `phone` | Exact phone number | `+905357874261` | Route specific person |
| `phone_prefix` | Country/area code | `+90` | Route all numbers with prefix |

### Priority

- Higher priority = checked first
- If multiple rules match, highest priority wins
- 100 = highest, 10 = lowest
- If no rule matches → uses `defaultAgent`

---

### contacts.yaml

Location: `~/.openclaw/workspace/memory/contacts.yaml`

Used for DM contact categorization (admin/trusted/blocked). Router-guard falls back to this for DMs after checking routing rules.

```yaml
admin:
  - "+905357874261"

trusted:
  - "+905001234567"

blocked:
  - "+905009999999"
```

---

## Session Key Format

OpenClaw routes messages using session keys:

```
agent:<agentId>:<channel>:<type>:<peerId>
```

| Part | Example | Description |
|------|---------|-------------|
| agentId | `main`, `coder` | Target agent |
| channel | `whatsapp`, `telegram` | Message source |
| type | `dm`, `group` | DM or group |
| peerId | `+905357874261`, `120363...@g.us` | Sender phone or group JID |

### Example Session Keys

```
agent:main:whatsapp:dm:+905357874261      # Admin DM → main agent
agent:coder:whatsapp:group:120363...@g.us # Group → coder agent (after override)
agent:guest:whatsapp:dm:+905001234567     # Unknown → guest (after override)
```

### How Override Works

The router-guard hook modifies the session key's `agentId` portion:

```
Before: agent:main:whatsapp:group:120363425477689226@g.us
After:  agent:coder:whatsapp:group:120363425477689226@g.us
```

This causes OpenClaw to:
1. Load the **coder** agent's SOUL from `~/.openclaw/agents/coder/SOUL.md`
2. Use the **coder** agent's workspace
3. Apply the **coder** agent's model configuration

---

## OpenClaw Configuration

### groupPolicy

In `openclaw.json` → `channels.whatsapp`:

| Value | Behavior |
|-------|----------|
| `"allowlist"` | Only groups in the allowlist receive messages (default) |
| `"open"` | All group messages are received (required for group routing) |
| `"off"` | No group messages at all |

> [!IMPORTANT]
> `groupPolicy` must be `"open"` for the group routing to work. With `"allowlist"`, messages are silently dropped before hooks can process them.

### Agent Directories

Each agent has its own directory at `~/.openclaw/agents/<agentId>/`:

```
~/.openclaw/agents/
├── admin/         # Admin agent
│   └── SOUL.md
├── coder/         # Coder agent (coding tasks)
│   ├── SOUL.md
│   ├── claude-code-guide.md
│   ├── soul-for-extensions.md
│   ├── soul-for-update.md
│   ├── memory/
│   └── sessions/
├── demo/          # Demo agent (sandbox)
│   └── SOUL.md
├── guest/         # Guest agent (limited)
│   └── SOUL.md
├── intern/        # Intern agent (minimal)
│   └── SOUL.md
└── security/      # Security agent (audit)
    └── SOUL.md
```

---

## Adding a New Routing Rule

### Via Config File

1. Edit `openclaw-extensions/config/routing-rules.json`
2. Add a rule to the `rules` array
3. Deploy to VPS:
   ```bash
   scp config/routing-rules.json root@VPS:/root/openclaw-extensions/config/
   ```
4. Router-guard auto-reloads on next message (file change detection)

### Via Mission Control UI

1. Open Routing Config page
2. Click "Add Binding"
3. Select peer type (DM/Group), enter JID/phone, select target agent
4. Save → writes to `openclaw.json` bindings

### Finding Group JIDs

1. Set `groupPolicy: "open"` in `openclaw.json`
2. Send a message in the target group (with @mention)
3. Check session data:
   ```bash
   grep '@g.us' ~/.openclaw/agents/main/sessions/sessions.json
   ```
4. Extract the JID (format: `120363XXXXX@g.us`)

---

## Troubleshooting

### Group messages not received
- Check `groupPolicy` is `"open"` in `openclaw.json`
- Bot must be @mentioned in groups (unless `ackReactionScope` includes groups)

### Group goes to wrong agent
- Check `routing-rules.json` has the correct group JID
- Verify rule priority (higher wins)
- Check VPS logs: `journalctl -u openclaw | grep router-guard`

### Router-guard not loading rules
- Check file exists: `ls /root/openclaw-extensions/config/routing-rules.json`
- Check JSON syntax: `python3 -m json.tool routing-rules.json`
- Check logs for load errors

### Session key not being overridden
- The hook must be enabled in `openclaw.json` → `hooks.internal.entries.router-guard`
- Check the session key format matches expected pattern (`agent:*:whatsapp:group:*@g.us`)
