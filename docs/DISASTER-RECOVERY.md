# Disaster Recovery Guide

How to restore your OpenClaw installation if VPS dies.

## What to Backup (Private Repo)

Create a **private** Git repo with these files:

```
openclaw-backup/
├── credentials/
│   ├── telegram-allowFrom.json
│   ├── whatsapp-allowFrom.json
│   └── whatsapp/default/  (WhatsApp session)
├── storage/
│   └── contacts/  (your contact database)
├── agents/
│   └── main/soul/  (SOUL personality files)
├── boot.md
└── openclaw.json (with secrets removed - add manually)
```

## Backup Commands

```bash
# On VPS - create backup
cd ~ && mkdir -p openclaw-backup
cp -r ~/.openclaw/credentials openclaw-backup/
cp -r ~/.openclaw/storage openclaw-backup/
cp -r ~/.openclaw/agents openclaw-backup/
cp ~/.openclaw/boot.md openclaw-backup/
# Don't backup openclaw.json directly - contains secrets

# Push to private repo
cd openclaw-backup && git add -A && git commit -m "backup" && git push
```

## Restore Steps

### 1. Fresh VPS Setup
```bash
# Install OpenClaw
npm i -g openclaw

# Clone your repos
git clone https://github.com/YOUR/openclaw-extensions.git
git clone https://github.com/YOUR/openclaw-backup.git  # private

# Setup OpenClaw
openclaw init
```

### 2. Restore Credentials
```bash
cp -r openclaw-backup/credentials ~/.openclaw/
cp -r openclaw-backup/storage ~/.openclaw/
cp -r openclaw-backup/agents ~/.openclaw/
cp openclaw-backup/boot.md ~/.openclaw/
```

### 3. Restore Hooks
```bash
cp -r openclaw-extensions/hooks ~/.openclaw/hooks/
openclaw hooks check
```

### 4. Re-add Secrets Manually
```bash
# Edit openclaw.json and add:
# - Telegram bot token
# - API keys
# - Any other secrets
nano ~/.openclaw/openclaw.json
```

### 5. Start Gateway
```bash
openclaw gateway start
openclaw gateway health
```

## Security Notes

- **NEVER** push secrets to public repos
- Backup repo should be **private**
- API keys should be stored in password manager, not Git
- Consider using environment variables for secrets
