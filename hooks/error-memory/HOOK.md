---
name: error-memory
description: "Coder agent learning loop - remember error solutions"
metadata: { "openclaw": { "emoji": "🧠", "events": ["agent:error"] } }
---

# Error Memory Hook

Coder agent learning system that remembers error solutions.

## Flow

1. Agent encounters error
2. Search `memory/error_log/` for similar errors
3. Found? → Apply stored solution
4. Not found? → Research online, solve, store solution
5. Update `memory/error_log/index.json` for fast lookup

## Storage Structure

```
workspace/memory/error_log/
├── index.json          # Fast lookup index
├── npm_install_001.md  # Solution for npm install EACCES
├── typescript_002.md   # Solution for TS2307 module not found
└── ...
```

## Example Entry

```json
{
  "id": "npm_install_001",
  "error_pattern": "EACCES.*npm install",
  "solution": "Run: sudo chown -R $(whoami) ~/.npm",
  "occurrences": 3,
  "last_seen": 1707156789000
}
```
