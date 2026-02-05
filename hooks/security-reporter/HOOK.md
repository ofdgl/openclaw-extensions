---
name: security-reporter
description: "Daily security audit and critical alerts"
metadata: { "openclaw": { "emoji": "🔒", "events": ["heartbeat:security_audit"] } }
---

# Security Reporter Hook

Generates daily security reports and critical alerts.

## Report Sections

1. **Fail2ban Stats**: SSH attack attempts blocked
2. **Unauthorized Access**: Tool calls blocked by gatekeeper
3. **Token Usage**: Daily spending per agent
4. **Agent Health**: Uptime and error counts
5. **Secret Detections**: Redactions by secret-guard

## Schedule

Triggered by heartbeat at 17:00 daily (configured in `heartbeat.yaml`).

## Critical Alerts

Immediate WhatsApp alerts for:
- Multiple unauthorized `/o` attempts
- Daily budget exceeded
- Agent crash/restart
- Unusual token spike

## Output

Report sent via WhatsApp to admin numbers from `contacts.yaml`.
