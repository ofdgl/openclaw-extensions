---
name: secret-guard
description: "Redacts API keys and secrets from AI responses"
metadata: { "openclaw": { "emoji": "🔒", "events": ["agent:response"] } }
---

# Secret Guard Hook

Scans AI responses for API keys and replaces with `[REDACTED]`.

## Detected Patterns

| Provider | Pattern | Example |
|----------|---------|---------|
| Anthropic | `sk-ant-*` | `sk-ant-api03-...` |
| OpenAI | `sk-*` | `sk-proj-...` |
| Google | `AIza*` | `AIzaSyB...` |
| GitHub PAT | `ghp_*` | `ghp_xxxx...` |
| Slack Bot | `xoxb-*` | `xoxb-123-456-abc` |

## Behavior

1. Scans `response.content` for secret patterns
2. Replaces matches with `[REDACTED]`
3. Logs security event if any secrets detected
4. Mutates response in-place before delivery
