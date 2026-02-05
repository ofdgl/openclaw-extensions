---
name: loop-detector
description: "Dynamic loop timeouts based on message intent"
metadata: { "openclaw": { "emoji": "⏱️", "events": ["agent:bootstrap", "agent:response"] } }
---

# Loop Detector Hook

Prevents infinite loops with intent-based dynamic timeouts.

## Timeout Configuration

| Intent | Timeout |
|--------|---------|
| greeting | 30 seconds |
| question | 2 minutes |
| task | 5 minutes |
| coding | 10 minutes |
| research | 15 minutes |

## How It Works

1. **On `agent:bootstrap`**: Start timer with intent-specific timeout
2. **On `agent:response`**: Cancel timer (task completed)
3. **On timeout**: Notify security agent, terminate task, log event

## Security Integration

Critical events are logged to `~/.openclaw/logs/security.jsonl` for audit.
