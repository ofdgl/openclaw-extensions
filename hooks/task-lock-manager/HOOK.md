---
name: task-lock-manager
description: "Cloudflare KV-based distributed task locking"
metadata: { "openclaw": { "emoji": "🔐", "events": ["task:start", "task:complete"] } }
---

# Task Lock Manager Hook

Distributed task locking using Cloudflare KV.

## Purpose

Prevents multiple agents from working on the same task simultaneously.

## Flow

1. Agent starts task → Set lock in KV
2. Another agent checks → Sees lock, waits or skips
3. Task completes → Release lock
4. Lock expires → Auto-release after 10 minutes

## Fallback

If Cloudflare Workers unavailable → Local file-based locking

## Configuration

Requires Cloudflare API credentials:
```env
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_NAMESPACE_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
```
