---
name: rate-limiter
description: "Enforces daily token limits per user"
metadata: { "openclaw": { "emoji": "🚦", "events": ["agent:bootstrap"] } }
---

# Rate Limiter Hook

Enforces daily token usage limits to control costs.

## Configuration

Limits defined in `workspace/memory/contacts.yaml`:

```yaml
contacts:
  "+905357874261":
    max_tokens_per_day: 500000  # Admin (high limit)
  
  unknown:
    max_tokens_per_day: 20000  # Guest (low limit)
```

## Behavior

1. Check user's daily token usage (from `billing.jsonl`)
2. Compare to `max_tokens_per_day` from contacts
3. If exceeded → Block request, send notification
4. Reset at midnight UTC

## Notification

```
⚠️ Günlük token limitine ulaştın (20,000). Yarın tekrar dene.
```
