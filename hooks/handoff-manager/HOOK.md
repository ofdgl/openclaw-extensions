---
name: handoff-manager
description: "Model escalation: Haiku → Sonnet → Opus"
metadata: { "openclaw": { "emoji": "🔄", "events": ["tool:request_upgrade", "tool:escalate_to_opus"] } }
---

# Handoff Manager Hook

Manages model escalation for cost-optimized AI quality.

## Escalation Flow

```
User Request
    ↓
Haiku (default, cheap)
    ↓ [too complex?]
request_upgrade tool
    ↓
Sonnet (analysis)
    ↓ [can solve?]
YES → Solve + downgrade to Haiku
NO → escalate_to_opus tool
    ↓
Opus (execute)
    ↓
Downgrade to Haiku
```

## Handoff Storage

Active handoff: `workspace/memory/handoff/active.json`

```json
{
  "from_model": "sonnet",
  "to_model": "opus",
  "refined_prompt": "...",
  "context": {...},
  "created_at": 1707156789000
}
```

## Stale Detection

Handoffs older than 1 hour are discarded.

## Notifications (Optional)

```
🔄 Handoff: Haiku → Sonnet (analyzing complexity)
🔄 Handoff: Sonnet → Opus (executing)
✅ Downgrade: Opus → Haiku
```
