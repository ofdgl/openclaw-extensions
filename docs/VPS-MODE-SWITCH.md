# VPS Mode Switch

Switch between Original and Kamino modes on your OpenClaw VPS.

## Quick Commands

```bash
# Check current mode
~/openclaw-extensions/scripts/mode-switch.sh status

# Switch to Original (maximum security)
~/openclaw-extensions/scripts/mode-switch.sh original

# Switch to Kamino (custom hooks)
~/openclaw-extensions/scripts/mode-switch.sh kamino
```

## Security Differences

| Aspect | Original | Kamino |
|--------|----------|--------|
| **dmPolicy** | `pairing` | `open` |
| **allowFrom** | Admin only | `*` (hooks filter) |
| **Custom Hooks** | Disabled | Enabled |
| **Who Can Message** | Paired users only | Anyone (+90 filtered by hook) |
| **Guest Sandbox** | N/A | Yes (unknowns get limited access) |

## What The Script Does

### Switch to Original:
1. Sets `dmPolicy: "pairing"` (only paired users)
2. Sets `allowFrom` to admin phone only
3. Removes `boot.md` (agent won't know about extensions)
4. Disables custom hooks
5. Restarts gateway

### Switch to Kamino:
1. Sets `dmPolicy: "open"` (everyone can message)
2. Sets `allowFrom: ["*"]` (hooks handle filtering)
3. Creates `boot.md` (agent knows about extensions)
4. Enables router-guard hook (filters +90, sandboxes unknowns)
5. Restarts gateway

## Manual Override

If script fails, manually set:

```bash
# For Original mode
jq '.channels.whatsapp.dmPolicy = "pairing"' ~/.openclaw/openclaw.json > /tmp/oc.json && mv /tmp/oc.json ~/.openclaw/openclaw.json
echo '{"version":1,"allowFrom":["+905357874261"]}' > ~/.openclaw/credentials/whatsapp-allowFrom.json

# For Kamino mode
jq '.channels.whatsapp.dmPolicy = "open"' ~/.openclaw/openclaw.json > /tmp/oc.json && mv /tmp/oc.json ~/.openclaw/openclaw.json
echo '{"version":1,"allowFrom":["*"]}' > ~/.openclaw/credentials/whatsapp-allowFrom.json
```
