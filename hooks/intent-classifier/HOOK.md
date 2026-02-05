---
name: intent-classifier
description: "Classifies message intent for context window optimization"
metadata: { "openclaw": { "emoji": "🎯", "events": ["agent:bootstrap"] } }
---

# Intent Classifier Hook

Classifies message intent to optimize context window size and loop timeouts.

## Intent Categories

| Intent | History Size | Use Case |
|--------|--------------|----------|
| greeting | 3 msgs | "merhaba", "nasılsın" |
| question | 10 msgs | Short queries |
| task | 20 msgs | Normal tasks |
| coding | 50 msgs | Code generation/debugging |
| research | 100 msgs | Complex research |

## Classification Strategy

### 1. Heuristic (Zero-Token)
- `/` prefix → command (bypass)
- Message < 20 chars → reuse previous intent
- Keywords (kod, script, function, class, def, import) → coding
- Greeting list (merhaba, selam, günaydın) → greeting

### 2. Model Self-Report (Fallback)
- Cannot determine? → Ask model
- Append system prompt: "At end, add: [intent: greeting|question|task|coding|research]"
- Extract from response: `[intent: coding]`
- Clean tag before delivery

## Storage

Intent stored in session metadata for reuse.
