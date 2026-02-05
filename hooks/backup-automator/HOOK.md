---
name: backup-automator
description: "Automated GitHub backup via git commit/push"
metadata: { "openclaw": { "emoji": "💾", "events": ["heartbeat:github_backup"] } }
---

# Backup Automator Hook

Automates GitHub backups with git commit and push.

## Triggered By

Heartbeat scheduler every 6 hours:

```yaml
- name: github_backup
  schedule: "0 */6 * * *"
  handler: command
  command: "git -C ~/.openclaw add . && git commit -m 'Auto backup' && git push"
```

## Features

- Auto-detect changes in workspace
- Commit with timestamp
- Respect `.gitignore`
- Push to configured remote
- Handle merge conflicts (manual resolution required)

## Configuration

Requires git remote configured:
```bash
cd ~/.openclaw
git remote add origin git@github.com:user/kowalski-config.git
```
