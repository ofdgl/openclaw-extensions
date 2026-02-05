---
name: context-optimizer
description: "Optimizes context window based on intent and caching"
metadata: { "openclaw": { "emoji": "📐", "events": ["agent:bootstrap"] } }
---

# Context Optimizer Hook

Optimizes context window size and enables Anthropic prompt caching.

## Intent-Based History

| Intent | History Size |
|--------|--------------|
| greeting | 3 messages |
| question | 10 messages |
| task | 20 messages |
| coding | 50 messages |
| research | 100 messages |

## Anthropic Caching

Marks static content as cacheable:
- `SOUL.md` personality file
- Workspace files (for coding intent)
- Session metadata

## Tool Filtering

Filters available tools based on user category (admin/trusted/guest).
