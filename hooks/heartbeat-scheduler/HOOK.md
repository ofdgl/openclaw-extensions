---
name: heartbeat-scheduler
description: "Automates scheduled tasks with cron"
metadata: { "openclaw": { "emoji": "⏰", "events": ["system:cron"] } }
---

# Heartbeat Scheduler Hook

Executes automated tasks on cron schedules.

## Configuration

`workspace/heartbeat.yaml`:

```yaml
config:
  active_hours: "08:00-23:00"
  timezone: "Europe/Istanbul"
  stagger_offset: 5

tasks:
  - name: security_audit
    agent: security
    schedule: "0 17 * * *"  # Daily at 17:00
    handler: ai
    model: haiku
    prompt: "Generate daily security report"
    night_mode: skip
  
  - name: github_backup
    agent: intern
    schedule: "0 */6 * * *"  # Every 6 hours
    handler: command
    command: "/backup.sh"
    night_mode: allow
```

## Handlers

- **ai**: Send prompt to specified model
- **command**: Execute shell command

## Night Mode

- `skip`: Skip if outside active_hours
- `allow`: Run regardless of time
