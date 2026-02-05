---
name: daily-standup
description: "Daily agent activity summary sent to admin"
metadata:
  openclaw:
    emoji: "📊"
    events: ["heartbeat:daily_standup"]
---

# Daily Standup Hook

Sends a comprehensive daily summary of all agent activity to the admin via WhatsApp.

## Trigger

Event: `heartbeat:daily_standup`  
Schedule: Daily at 23:30 IST (via `heartbeat.yaml`)

## What It Tracks

- **Completed Tasks**: Tasks moved to "done" status
- **In Progress**: Active tasks per agent
- **Blocked Tasks**: Tasks stuck waiting for something
- **Token Usage**: Daily consumption and cost
- **Security Events**: Critical alerts
- **Agent Health**: Last seen, current status

## Output Format

```
📊 DAILY STANDUP — Feb 5, 2026

✅ COMPLETED TODAY
• Admin: VPS deployment (3 tasks)
• Security: Code review for rate-limiter

🔄 IN PROGRESS
• Admin: Documentation updates
• Demo: Testing sandbox restrictions

🚫 BLOCKED
• None

💰 TOKEN USAGE
• Admin: 45,231 tokens ($0.68)
• Security: 12,405 tokens ($0.19)
• Demo: 8,192 tokens ($0.12)
• Total: 65,828 tokens ($0.99)

🔒 SECURITY
• 0 critical events
• 2 warnings (rate limit approached)
• 15 info events

👥 AGENT HEALTH
✅ Admin - Active (last seen: 23:25)
✅ Security - Active (last seen: 23:20)
✅ Demo - Idle (last seen: 19:30)
✅ Intern - Idle (last seen: 14:15)
```

## Data Sources

- `logs/billing.jsonl` - Token usage
- `logs/security.jsonl` - Security events
- `workspace/memory/*/WORKING.md` - Current tasks
- `data/activity.jsonl` - Agent actions (if exists)

## Configuration

Add to `heartbeat.yaml`:

```yaml
tasks:
  - name: daily_standup
    schedule: "30 23 * * *"  # 23:30 daily
    handler: ai
    prompt: "Generate daily standup summary"
    agent: admin
```

## Usage

The hook runs automatically. No manual intervention needed.

Check logs if summary not received:
```bash
tail -f ~/.openclaw/logs/gateway.log | grep daily-standup
```
