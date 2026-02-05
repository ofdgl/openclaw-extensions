---
name: router-guard
description: "Routes messages based on country code (+90 only) and contact list"
metadata: { "openclaw": { "emoji": "🛡️", "events": ["agent:bootstrap"] } }
---

# Router Guard Hook

Pre-filters incoming messages before AI processing.

## Behavior

| Sender | Action |
|--------|--------|
| Non-+90 number | **BLOCK** - silent, no AI cost |
| Blocked contact | **BLOCK** - silent, no AI cost |
| Admin/Trusted | Route to main workspace |
| Unknown +90 | Route to guest workspace (sandbox) |

## Configuration

Contacts stored in `workspace/memory/contacts.yaml`:

```yaml
admin:
  - "+905357874261"  # Ömer

trusted:
  - "+905551234567"  # Family
  - "+905559876543"  # Friend

blocked:
  - "+905559999999"  # Spam
```

## How It Works

1. Intercepts `agent:bootstrap` event
2. Checks sender's phone number prefix
3. Loads contacts from workspace
4. For guests: injects limited bootstrap files
5. For blocked: clears bootstrap files (aborts agent)
