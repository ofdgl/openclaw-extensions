---
name: billing-tracker
description: "Logs token usage to SQLite for cost monitoring"
metadata: { "openclaw": { "emoji": "💰", "events": ["agent:response"] } }
---

# Billing Tracker Hook

Logs every AI response's token usage to SQLite database.

## Features

- Input/output token counts per call
- Model tracking (haiku/sonnet/opus)
- Per-user daily aggregation
- 80% budget alert

## Database

Creates `~/.openclaw/data/billing.db` with schema:

```sql
CREATE TABLE token_usage (
  id INTEGER PRIMARY KEY,
  agent_id TEXT,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost REAL,
  timestamp INTEGER,
  session_key TEXT,
  user_id TEXT
);
```

## Model Pricing (per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| Haiku | $1.00 | $5.00 |
| Sonnet | $3.00 | $15.00 |
| Opus | $15.00 | $75.00 |
