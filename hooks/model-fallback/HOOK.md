---
name: model-fallback
description: "OpenRouter free tier with fallback chain"
metadata: { "openclaw": { "emoji": "🔄", "events": ["agent:model_request"] } }
---

# Model Fallback Hook

Provides cost-optimized model selection with fallback chain.

## Fallback Chain

```
1. OpenRouter Free Tier (meta-llama/llama-3.1-8b-instruct:free)
2. Claude 3.5 Haiku ($0.25/$1.25 per MTok)
3. Gemini 2.0 Flash ($0.075/$0.30 per MTok)
```

## Triggers

- Heartbeat tasks with `model: openrouter_free`
- Background analysis tasks
- Non-critical automations

## Error Handling

- Quota exceeded → Next in chain
- Rate limit → Wait + retry once
- API error → Skip to next model
- All failed → Log error, notify admin
