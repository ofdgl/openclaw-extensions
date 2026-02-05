# Deployment Guide

Step-by-step guide to deploy OpenClaw Extensions to VPS.

---

## Prerequisites

- ✅ VPS with Ubuntu 22.04+
- ✅ Docker & Docker Compose installed
- ✅ OpenClaw Gateway running
- ✅ SSH access

---

## Deployment Steps

### 1. Prepare Local Repository

```bash
# Clone and verify
git clone https://github.com/kowalski/openclaw-extensions.git
cd openclaw-extensions

# Test hooks locally (optional)
npx tsx test-hooks.ts
npx tsx test-phase2-hooks.ts
npx tsx test-phase3-hooks.ts
npx tsx test-phase4-hooks.ts

# Verify structure
ls -la hooks/    # Should show 20 directories
ls -la config/   # Should show 6 files
ls -la souls/    # Should show 4 .md files
```

---

### 2. VPS: Backup Current State

```bash
# SSH to VPS
ssh kowalski@your-vps-ip

# Backup original OpenClaw
sudo systemctl stop openclaw  # or docker stop openclaw
cp -r ~/.openclaw ~/.openclaw-backup-$(date +%Y%m%d)
tar -czvf openclaw-backup.tar.gz ~/.openclaw-backup-*

# Verify backup
ls -lh openclaw-backup.tar.gz
```

---

### 3. VPS: Create Directory Structure

```bash
# Original mode directory (safe fallback)
cp -r ~/.openclaw ~/.openclaw-original

# Kamino mode directory (enhanced)
mkdir -p ~/.openclaw-kamino/{hooks,souls,workspaces/{admin,security,demo,intern},logs,data,storage/contacts}
```

---

### 4. Deploy from GitHub

```bash
# Clone repository to temporary location
cd ~
git clone https://github.com/kowalski/openclaw-extensions.git temp-extensions

# Copy hooks
cp -r temp-extensions/hooks/* ~/.openclaw-kamino/hooks/

# Copy SOULs
cp -r temp-extensions/souls/* ~/.openclaw-kamino/souls/

# Copy configs
cp temp-extensions/config/openclaw-kamino.json ~/.openclaw-kamino/openclaw.json
cp temp-extensions/config/routing.yaml ~/.openclaw-kamino/config/
cp temp-extensions/config/contacts.yaml ~/.openclaw-kamino/config/
cp temp-extensions/config/heartbeat.yaml ~/.openclaw-kamino/config/

# Copy scripts
cp temp-extensions/scripts/openclaw-switch.sh ~/
chmod +x ~/openclaw-switch.sh

# Cleanup
rm -rf temp-extensions
```

---

### 5. Configure Contacts

Edit `~/.openclaw-kamino/config/contacts.yaml`:

```yaml
admins:
  - "+905357874261"  # Your number

trusted:
  - "+905551234567"  # Add trusted numbers

blocked: []  # Add spam numbers if needed
```

---

### 6. Set Environment Variables

```bash
# Add to ~/.bashrc or /etc/environment
export OPENCLAW_GATEWAY_TOKEN="your-gateway-token"
export GEMINI_API_KEY="your-gemini-key"
export OPENROUTER_API_KEY="your-openrouter-key"  # Optional
export CLOUDFLARE_KV_TOKEN="your-cf-token"       # Optional

# Reload
source ~/.bashrc
```

---

### 7. Install Mode Switcher

```bash
# Copy systemd service
sudo cp ~/.openclaw-kamino/scripts/openclaw-mode.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable openclaw-mode.service

# Set default mode
echo "kamino" > ~/.openclaw-mode

# Create active symlink
ln -s ~/.openclaw-kamino ~/.openclaw-active
```

---

### 8. Update Docker Configuration

Edit `docker-compose.yml`:

```yaml
version: '3'

services:
  openclaw:
    image: openclaw/gateway:latest
    container_name: openclaw
    restart: unless-stopped
    volumes:
      # Mount active symlink (changes with mode)
      - ~/.openclaw-active:/home/kowalski/.openclaw:ro
      - ~/.openclaw-mode:/home/kowalski/.openclaw-mode:ro
    environment:
      - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    ports:
      - "18789:18789"
```

---

### 9. Start Services

```bash
# Start OpenClaw in Kamino mode
docker-compose up -d

# Wait for gateway
sleep 10

# Check health
docker exec openclaw openclaw health

# View logs
docker logs -f openclaw
```

---

### 10. Verify Hooks

```bash
# List enabled hooks
docker exec openclaw openclaw hooks list

# Should show all 20 hooks with ✓
```

---

### 11. Test Functionality

#### Test 1: Send message from admin number
```
WhatsApp → Your Number
"Test message"

Expected: Routed to admin agent, full access
```

#### Test 2: Test /vps command
```
WhatsApp → Your Number
"/vps status"

Expected: "🚀 VPS Durumu - Aktif Mod: Kamino (Enhanced)"
```

#### Test 3: Test unknown number routing
```
WhatsApp → Random +90 number
"Merhaba"

Expected: Routed to demo agent (sandbox)
```

#### Test 4: Test rate limiting
```
# Edit contacts.yaml to set low limit
rate_limits:
  "+905551234567": 100  # Very low for testing

# Send messages until limit hit
Expected: "⚠️ Günlük token limitinize yaklaşıyorsunuz"
```

---

## Monitoring

### View Logs

```bash
# Security events
tail -f ~/.openclaw-kamino/logs/security.jsonl | jq

# Token usage
tail -f ~/.openclaw-kamino/logs/billing.jsonl | jq

# Gateway logs
docker logs -f openclaw

# Hook execution
docker logs -f openclaw | grep -E 'router-guard|billing-tracker'
```

### Check Storage

```bash
# Contact records
ls -la ~/.openclaw-kamino/storage/contacts/

# View contact
cat ~/.openclaw-kamino/storage/contacts/+905357874261.json | jq
```

---

## Mode Switching

### Switch to Original Mode

```bash
# Via WhatsApp (recommended)
/vps original

# Via SSH
~/openclaw-switch.sh original

# Verify
cat ~/.openclaw-mode
# Should show: original
```

### Switch to Kamino Mode

```bash
# Via WhatsApp
/vps kamino

# Via SSH
~/openclaw-switch.sh kamino

# Verify
cat ~/.openclaw-mode
# Should show: kamino
```

---

## Rollback

### Emergency Rollback

```bash
# Stop services
docker stop openclaw

# Restore original
rm ~/.openclaw-active
ln -s ~/.openclaw-original ~/.openclaw-active

# Start
docker start openclaw

# Verify
docker logs openclaw
```

### Permanent Rollback

```bash
# Stop Kamino
docker stop openclaw

# Restore from backup
rm -rf ~/.openclaw
cp -r ~/.openclaw-backup-YYYYMMDD ~/.openclaw

# Remove mode switcher
sudo systemctl disable openclaw-mode.service
rm ~/openclaw-switch.sh
rm ~/.openclaw-mode

# Start original
docker start openclaw
```

---

## Troubleshooting

### Hooks not loading

```bash
# Check hook discovery
docker exec openclaw openclaw hooks list

# Check permissions
ls -la ~/.openclaw-kamino/hooks/
# All files should be readable by openclaw user

# Check config
cat ~/.openclaw-kamino/openclaw.json | jq '.hooks'
```

### Agent routing issues

```bash
# Check routing.yaml
cat ~/.openclaw-kamino/config/routing.yaml

# Check contacts.yaml
cat ~/.openclaw-kamino/config/contacts.yaml

# Test router manually
docker exec -it openclaw bash
cd /home/kowalski/.openclaw/hooks/router-guard
node handler.js
```

### Token limits not working

```bash
# Check billing.jsonl exists
ls -la ~/.openclaw-kamino/logs/billing.jsonl

# Check rate-limiter logs
docker logs openclaw | grep rate-limiter

# Manually check quota
jq -r 'select(.sender_id=="+905357874261") | .input_tokens + .output_tokens' \
  ~/.openclaw-kamino/logs/billing.jsonl | \
  awk '{sum+=$1} END {print sum}'
```

### VPS mode switch fails

```bash
# Check symlink
ls -la ~/.openclaw-active
readlink -f ~/.openclaw-active

# Check script permissions
ls -la ~/openclaw-switch.sh

# Manual switch
bash ~/openclaw-switch.sh kamino --verbose

# Check systemd status
sudo systemctl status openclaw-mode.service
```

---

## Maintenance

### Update Hooks

```bash
# Pull latest
cd /path/to/openclaw-extensions
git pull

# Copy to VPS
scp -r hooks/* kowalski@vps:~/.openclaw-kamino/hooks/

# Restart gateway
docker restart openclaw
```

### Backup Schedule

```bash
# Add to crontab
crontab -e

# Daily backup at 3 AM
0 3 * * * tar -czvf ~/backups/openclaw-$(date +\%Y\%m\%d).tar.gz ~/.openclaw-kamino
```

### Log Rotation

```bash
# Add to /etc/logrotate.d/openclaw-kamino
/home/kowalski/.openclaw-kamino/logs/*.jsonl {
    daily
    rotate 30
    compress
    missingok
    notifempty
}
```

---

## Performance Tuning

### Docker Resources

```yaml
# docker-compose.yml
services:
  openclaw:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### Hook Optimization

```typescript
// In handler.ts - early return pattern
if (event.type !== "agent:bootstrap") return;  // Fast exit

// Cache expensive operations
const contactsCache = loadContactsOnce();
```

---

## Security Checklist

- ✅ SSH on port 2222, key-only auth
- ✅ UFW enabled, minimal ports open
- ✅ Fail2ban running
- ✅ API keys in environment variables, not config files
- ✅ Workspace permissions 700
- ✅ `allowInsecureAuth: false` in config
- ✅ Security logs reviewed daily
- ✅ Demo/intern agents in sandbox mode
