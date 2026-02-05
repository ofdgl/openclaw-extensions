# VPS Security Hardening

Complete security hardening guide for OpenClaw VPS deployments.

---

## Overview

This guide covers **VPS-level security** (not hook-level). These are infrastructure hardening steps that should be applied to any VPS running OpenClaw.

**Time Required**: 30-45 minutes  
**Difficulty**: Intermediate  
**OS**: Ubuntu 22.04+ (adaptable to other distros)

---

## 1. SSH Hardening

### Change SSH Port

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Change these lines:
Port 2222                    # Change from default 22
PermitRootLogin no           # Disable root login
PasswordAuthentication no    # Disable password auth
PubkeyAuthentication yes     # Enable key-only auth
```

### Restart SSH

```bash
sudo systemctl restart sshd
```

### Test New Connection

**IMPORTANT**: Don't close your current session yet!

```bash
# In a NEW terminal window, test connection:
ssh -p 2222 your-user@your-vps-ip

# If it works, you can close the old session
# If it fails, fix it in the old session that's still open
```

---

## 2. SSH Key-Only Authentication

### Generate SSH Key (Local Machine)

```bash
# On your local machine (if you don't have a key):
ssh-keygen -t ed25519 -C "your_email@example.com"

# Press Enter to accept default location
# Set a strong passphrase (optional but recommended)
```

### Copy Public Key to VPS

```bash
# From local machine:
ssh-copy-id -p 2222 your-user@your-vps-ip

# Or manually:
cat ~/.ssh/id_ed25519.pub | ssh -p 22 your-user@your-vps-ip \
  "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Test Key Auth

```bash
# Should log in WITHOUT password prompt:
ssh -p 2222 your-user@your-vps-ip
```

### Disable Password Auth

```bash
# Only after confirming key auth works!
sudo nano /etc/ssh/sshd_config

# Set:
PasswordAuthentication no

# Restart:
sudo systemctl restart sshd
```

---

## 3. Firewall (UFW)

### Install UFW

```bash
sudo apt update
sudo apt install ufw -y
```

### Configure Rules

```bash
# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (new port)
sudo ufw allow 2222/tcp comment 'SSH'

# Allow OpenClaw Gateway
sudo ufw allow 18789/tcp comment 'OpenClaw Gateway'

# Allow WebSocket (if using Mission Control UI)
sudo ufw allow 3001/tcp comment 'WebSocket'

# Allow HTTP/HTTPS (if hosting web UI)
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
```

### Enable UFW

```bash
# CRITICAL: Make sure SSH port is allowed first!
sudo ufw enable

# Check status
sudo ufw status verbose
```

Expected output:
```
Status: active

To                         Action      From
--                         ------      ----
2222/tcp                   ALLOW       Anywhere                  # SSH
18789/tcp                  ALLOW       Anywhere                  # OpenClaw Gateway
3001/tcp                   ALLOW       Anywhere                  # WebSocket
```

---

## 4. Fail2ban

### Install

```bash
sudo apt install fail2ban -y
```

### Configure for Custom SSH Port

```bash
# Create local config
sudo nano /etc/fail2ban/jail.local
```

Add:
```ini
[DEFAULT]
bantime = 3600        # Ban for 1 hour
findtime = 600        # 10 minute window
maxretry = 3          # 3 failed attempts

[sshd]
enabled = true
port = 2222           # Your custom SSH port
logpath = /var/log/auth.log
maxretry = 3
```

### Start Fail2ban

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### Test Ban

```bash
# From another machine, try 3 failed login attempts
# You should get banned for 1 hour

# Check banned IPs:
sudo fail2ban-client status sshd

# Unban yourself (if needed):
sudo fail2ban-client set sshd unbanip YOUR_IP
```

---

## 5. Automatic Security Updates

### Install Unattended Upgrades

```bash
sudo apt install unattended-upgrades -y
```

### Configure

```bash
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

Ensure these are uncommented:
```
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};

Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
```

### Enable

```bash
sudo dpkg-reconfigure --priority=low unattended-upgrades
# Select "Yes"
```

### Test

```bash
# Dry run:
sudo unattended-upgrade --dry-run --debug
```

---

## 6. Disable Unused Services

### Check Running Services

```bash
sudo systemctl list-unit-files --type=service --state=enabled
```

### Disable Unused Services

Common candidates:
```bash
# If not using Bluetooth:
sudo systemctl disable bluetooth.service

# If not using printing:
sudo systemctl disable cups.service

# If not using Avahi (mDNS):
sudo systemctl disable avahi-daemon.service
```

---

## 7. User Permissions

### Create Non-Root User (if not already done)

```bash
# As root:
adduser kowalski
usermod -aG sudo kowalski

# Test sudo access:
su - kowalski
sudo whoami
# Should print: root
```

### Lock Root Account

```bash
# Disable root password:
sudo passwd -l root
```

---

## 8. OpenClaw-Specific Security

### File Permissions

```bash
# Set correct permissions:
chmod 700 ~/.openclaw
chmod 700 ~/.openclaw-kamino
chmod 700 ~/.openclaw-original

# Workspace files (owner read/write only):
find ~/.openclaw -type f -exec chmod 600 {} \;
find ~/.openclaw -type d -exec chmod 700 {} \;
```

### Environment Variables

**Never** put API keys in config files. Use environment variables:

```bash
# Add to ~/.bashrc:
export OPENCLAW_GATEWAY_TOKEN="your-token"
export GEMINI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"

# Reload:
source ~/.bashrc
```

### Docker Security

If using Docker:

```bash
# Run as non-root user:
sudo usermod -aG docker kowalski

# Enable automatic restart:
docker update --restart=unless-stopped openclaw
```

---

## 9. Monitoring & Logging

### Check Auth Logs

```bash
# View failed login attempts:
sudo grep "Failed password" /var/log/auth.log

# View successful logins:
sudo grep "Accepted" /var/log/auth.log
```

### Monitor Fail2ban

```bash
# Check current bans:
sudo fail2ban-client status sshd

# View ban log:
sudo tail -f /var/log/fail2ban.log
```

### OpenClaw Security Logs

```bash
# View security events:
tail -f ~/.openclaw-kamino/logs/security.jsonl | jq

# Search for specific event:
jq -r 'select(.event=="unauthorized_access")' \
  ~/.openclaw-kamino/logs/security.jsonl
```

---

## 10. Backup & Recovery

### Automated Backups

Use `backup-automator` hook (included in OpenClaw Extensions):

```yaml
# heartbeat.yaml
tasks:
  - name: github_backup
    schedule: "0 */6 * * *"  # Every 6 hours
    handler: command
    command: "cd ~/.openclaw && git add . && git commit -m 'Auto backup' && git push"
```

### Manual Backup

```bash
# Create tarball:
tar -czvf openclaw-backup-$(date +%Y%m%d).tar.gz ~/.openclaw

# Copy to local machine:
scp -P 2222 kowalski@vps:~/openclaw-backup-*.tar.gz .
```

---

## Security Checklist

Before deploying to production, verify:

- [ ] SSH on port 2222 (not 22)
- [ ] Password authentication disabled
- [ ] Key-only authentication working
- [ ] UFW enabled with minimal ports
- [ ] Fail2ban running and monitoring SSH
- [ ] Unattended upgrades enabled
- [ ] Root account locked
- [ ] API keys in environment variables (not config)
- [ ] File permissions set (700 for dirs, 600 for files)
- [ ] `allowInsecureAuth: false` in openclaw.json
- [ ] Automated backups configured
- [ ] Monitoring logs reviewed

---

## Testing Security

### Port Scan Test

```bash
# From local machine:
nmap -p 1-65535 your-vps-ip

# Should only show:
# 2222/tcp open  (SSH)
# 18789/tcp open (OpenClaw Gateway)
```

### SSH Brute Force Test

```bash
# Try 3 wrong passwords from another IP
# Should get banned by Fail2ban within seconds

# Check ban:
sudo fail2ban-client status sshd
```

### OpenClaw Security Test

```bash
# Try to access from blocked number (via WhatsApp)
# Should get rejected by router-guard hook

# Check logs:
jq -r 'select(.event=="blocked_user_attempt")' \
  ~/.openclaw-kamino/logs/security.jsonl
```

---

## Maintenance

### Weekly

- [ ] Review auth logs for suspicious activity
- [ ] Check Fail2ban ban list
- [ ] Review OpenClaw security.jsonl

### Monthly

- [ ] Update all packages: `sudo apt update && sudo apt upgrade`
- [ ] Review UFW rules
- [ ] Rotate logs if too large
- [ ] Test backup restore procedure

### When Needed

- [ ] Regenerate SSH keys if compromised
- [ ] Update API keys in environment
- [ ] Review and update Fail2ban rules

---

## Troubleshooting

### Locked Out of SSH

If you locked yourself out:

1. Use VPS provider's console/VNC
2. Log in as root (if enabled) or recovery mode
3. Fix `/etc/ssh/sshd_config`
4. Restart SSH: `systemctl restart sshd`

### UFW Blocking Legitimate Traffic

```bash
# Temporarily disable UFW:
sudo ufw disable

# Fix rules, then re-enable:
sudo ufw enable
```

### Fail2ban False Positives

```bash
# Whitelist your IP:
sudo nano /etc/fail2ban/jail.local

# Add under [DEFAULT]:
ignoreip = 127.0.0.1/8 YOUR_IP_HERE

# Restart:
sudo systemctl restart fail2ban
```

---

## Additional Resources

- [Ubuntu Security Guide](https://ubuntu.com/server/docs/security-introduction)
- [Fail2ban Documentation](https://www.fail2ban.org/wiki/index.php/Main_Page)
- [UFW Guide](https://help.ubuntu.com/community/UFW)
- [SSH Hardening](https://www.ssh.com/academy/ssh/sshd_config)
