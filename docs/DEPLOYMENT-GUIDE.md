# VPS Deployment Guide

This guide documents how to deploy openclaw-extensions hooks to a VPS running OpenClaw.

## Prerequisites

- OpenClaw 2026.2.x installed on VPS
- SSH access to VPS
- Git installed on VPS

## Quick Deploy

```bash
# 1. Clone repository on VPS
cd ~ && git clone https://github.com/ofdgl/openclaw-extensions.git

# 2. Copy hooks to OpenClaw hooks directory
mkdir -p ~/.openclaw/hooks
cp -r ~/openclaw-extensions/hooks/* ~/.openclaw/hooks/

# 3. Verify hooks are discovered
openclaw hooks check
# Should show: Total hooks: 20, Ready: 20

# 4. Enable desired hooks
openclaw hooks enable router-guard
openclaw hooks enable rate-limiter
openclaw hooks enable secret-guard
# ... enable other hooks as needed

# 5. Restart gateway
openclaw gateway restart
```

## Hook Categories

### Security Hooks
- `router-guard` - Routes messages based on content/sender rules
- `secret-guard` - Prevents leaking sensitive info
- `emergency-bypass` - Allows bypass on critical keywords
- `security-reporter` - Weekly security reports

### Rate Limiting
- `rate-limiter` - Per-user message limits

### Multi-Agent
- `handoff-manager` - Agent session transfers
- `mention-notifier` - @mention notifications

### Intelligence
- `intent-classifier` - Classifies message intent
- `context-optimizer` - Improves context usage
- `loop-detector` - Prevents agent loops

### Automation
- `backup-automator` - GitHub backup on /new command
- `heartbeat-scheduler` - Scheduled health checks
- `daily-standup` - Daily summary messages

### Media
- `image-processor` - Handles image messages

### Billing
- `billing-tracker` - Token usage tracking

## Updating Hooks

```bash
cd ~/openclaw-extensions
git pull
cp -r hooks/* ~/.openclaw/hooks/
openclaw gateway restart
```

## Verifying Installation

```bash
# Check hook status
openclaw hooks check

# Check gateway health
openclaw gateway health

# View enabled hooks
openclaw hooks list | grep enabled
```

## Troubleshooting

### Hooks not appearing
- Ensure HOOK.md exists in each hook folder
- Check handler.ts exports default function
- Run `openclaw hooks check` for errors

### Gateway won't start
- Run `openclaw doctor --fix`
- Check logs: `journalctl -u openclaw-gateway -n 50`

### Hook not triggering
- Verify hook is enabled: `openclaw hooks enable <hook-name>`
- Check event type in HOOK.md matches expected events
- Restart gateway after enabling
