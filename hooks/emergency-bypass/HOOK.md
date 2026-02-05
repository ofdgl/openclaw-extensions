---
name: emergency-bypass
description: "Admin /o command for direct Opus access"
metadata: { "openclaw": { "emoji": "🚨", "events": ["agent:bootstrap"] } }
---

# Emergency Bypass Hook

Provides admin-only `/o` command for direct Opus access.

## Usage

```
/o analyze this critical security incident
```

Strips `/o ` prefix and routes directly to Claude Opus with full permissions.

## Security

- **Admin-only**: Verified against `contacts.yaml` admin list
- **Non-admin attempt**: Blocked + security log generated
- **All events logged**: Timestamp, user, prompt length

## Fallback

- Opus unavailable? → Sonnet
- Sonnet unavailable? → Error message

## Example

```
User: /o debug production crash
System: [Opus mode activated]
Opus: [detailed analysis]
```
