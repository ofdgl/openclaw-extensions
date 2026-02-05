# Agent Integration Guide

How to make your OpenClaw agent aware of Kamino extensions.

## SOUL Addition (Recommended)

Add this to your agent SOUL/personality file:

```markdown
## Mode Awareness

Check `~/openclaw-extensions/config/agent-context.md`:
- File exists → Kamino mode (custom hooks, contacts, multi-agent)
- File missing → Original mode (standard OpenClaw)

If Kamino mode: Read context file for available features.
```

**Why this works:** 
- The file only exists when Kamino extensions are deployed
- Agent can quickly check file existence before reading
- Minimal tokens: ~50 tokens added to SOUL

## Bootstrap File (Alternative)

Create `~/.openclaw/boot.md`:

```markdown
# Boot Context
Mode: kamino
Extensions: ~/openclaw-extensions/
Contacts: ~/.openclaw/storage/contacts/
```

OpenClaw auto-injects boot.md content into agent context.

## Contacts Access

Agent can read contact files:
```
~/.openclaw/storage/contacts/+905551234567.json
{
  "name": "Ahmet",
  "category": "trusted|admin|blocked",
  "message_count": 15
}
```

## Mode Detection Code (for hooks)

```typescript
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const isKaminoMode = () => existsSync(
  join(homedir(), 'openclaw-extensions/config/agent-context.md')
);
```
