---
name: mention-notifier
description: "Agent-to-agent @mention notification system"
metadata: { "openclaw": { "emoji": "📢", "events": ["agent:message"] } }
---

# Mention Notifier Hook

Enables agent-to-agent communication via @mentions.

## Usage

```
@security görev tamamlandı, raporu kontrol et
```

Mentions the security agent.

## Flow

1. Extract @agentId from message
2. Create notification in Mission Control DB
3. Attempt immediate delivery
4. If agent offline → Mark undelivered
5. Agent heartbeat picks up undelivered notifications

## Notification Record

```json
{
  "id": "notif_123",
  "from_agent": "admin",
  "to_agent": "security",
  "message": "görev tamamlandı",
  "delivered": false,
  "created_at": 1707156789000
}
```
