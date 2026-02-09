#!/bin/bash
# Mode Switch Script for OpenClaw
# Handles secure transition between Original and Kamino modes
# CRITICAL: This script also switches security policies (dmPolicy)

set -e

MODE_FILE="$HOME/.openclaw-mode"
CONFIG_DIR="$HOME/openclaw-extensions/config"
OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"
WA_ALLOWFROM="$HOME/.openclaw/credentials/whatsapp-allowFrom.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Dynamic admin phone (from wizard or fallback)
if [ -f "$HOME/.openclaw-admin-phone" ]; then
    ADMIN_PHONE=$(cat "$HOME/.openclaw-admin-phone")
else
    ADMIN_PHONE=""
fi

show_status() {
    echo "=== OpenClaw Mode Status ==="
    if [ -f "$MODE_FILE" ]; then
        CURRENT_MODE=$(cat "$MODE_FILE")
        echo "Current Mode: $CURRENT_MODE"
    else
        echo "Current Mode: unknown (no mode file)"
    fi
    
    if [ -f "$OPENCLAW_CONFIG" ]; then
        DM_POLICY=$(jq -r '.channels.whatsapp.dmPolicy // "not set"' "$OPENCLAW_CONFIG")
        echo "WhatsApp dmPolicy: $DM_POLICY"
    fi
    
    if [ -f "$WA_ALLOWFROM" ]; then
        ALLOW=$(jq -r '.allowFrom | join(", ")' "$WA_ALLOWFROM")
        echo "WhatsApp allowFrom: $ALLOW"
    fi
}

switch_to_original() {
    echo "Switching to ORIGINAL mode..."
    
    # 1. Update mode file
    echo "original" > "$MODE_FILE"
    
    # 2. Set dmPolicy to pairing (SECURE)
    if [ -f "$OPENCLAW_CONFIG" ]; then
        jq '.channels.whatsapp.dmPolicy = "pairing"' "$OPENCLAW_CONFIG" > /tmp/oc.json
        mv /tmp/oc.json "$OPENCLAW_CONFIG"
    fi
    
    # 3. Restrict allowFrom to admin only (if configured)
    if [ -n "$ADMIN_PHONE" ]; then
        echo "{\"version\":1,\"allowFrom\":[\"$ADMIN_PHONE\"]}" > "$WA_ALLOWFROM"
    fi
    
    # 4. Remove boot.md (Kamino indicator)
    rm -f "$HOME/.openclaw/boot.md"
    
    # 5. Disable custom hooks (minimal config)
    if [ -f "$OPENCLAW_CONFIG" ]; then
        jq '.hooks.internal.entries = {}' "$OPENCLAW_CONFIG" > /tmp/oc.json
        mv /tmp/oc.json "$OPENCLAW_CONFIG"
    fi
    
    # 6. Inject mode context to SOUL.md
    "$SCRIPT_DIR/inject-context.sh" 2>/dev/null || true
    
    # 7. Restart gateway
    openclaw gateway restart
    
    echo "✅ Switched to ORIGINAL mode"
    echo "   - dmPolicy: pairing (only admin)"
    echo "   - Hooks: disabled"
    echo "   - Security: maximum"
}

switch_to_kamino() {
    echo "Switching to KAMINO mode..."
    
    # 1. Update mode file
    echo "kamino" > "$MODE_FILE"
    
    # 2. Set dmPolicy to open (hooks handle filtering)
    if [ -f "$OPENCLAW_CONFIG" ]; then
        jq '.channels.whatsapp.dmPolicy = "open" | .channels.whatsapp.allowFrom = ["*"]' "$OPENCLAW_CONFIG" > /tmp/oc.json
        mv /tmp/oc.json "$OPENCLAW_CONFIG"
    fi
    
    # 3. Set allowFrom to wildcard (hooks filter)
    echo '{"version":1,"allowFrom":["*"]}' > "$WA_ALLOWFROM"
    
    # 4. Create boot.md (Kamino indicator for agent)
    cat > "$HOME/.openclaw/boot.md" << 'EOF'
# Kamino Mode Active

Özel hook ve extension sistemi.
- Kişiler: `~/.openclaw/storage/contacts/`
- Detaylar: `~/openclaw-extensions/config/agent-context.md`
EOF
    
    # 5. Enable custom hooks
    # Note: This assumes hooks are already in ~/.openclaw/hooks/
    # Just ensure router-guard is enabled for security
    if [ -f "$OPENCLAW_CONFIG" ]; then
        jq '.hooks.internal.entries["router-guard"] = {"enabled": true}' "$OPENCLAW_CONFIG" > /tmp/oc.json
        mv /tmp/oc.json "$OPENCLAW_CONFIG"
    fi
    
    # 6. Inject mode context to SOUL.md
    "$SCRIPT_DIR/inject-context.sh" 2>/dev/null || true
    
    # 7. Restart gateway
    openclaw gateway restart
    
    echo "✅ Switched to KAMINO mode"
    echo "   - dmPolicy: open (hooks filter)"
    echo "   - router-guard: enabled"
    echo "   - +90 filtering: active"
}

# Main
case "${1:-status}" in
    status|s)
        show_status
        ;;
    original|o)
        switch_to_original
        ;;
    kamino|k)
        switch_to_kamino
        ;;
    *)
        echo "Usage: $0 {status|original|kamino}"
        echo ""
        echo "Commands:"
        echo "  status   - Show current mode and security settings"
        echo "  original - Switch to original mode (pairing only, max security)"
        echo "  kamino   - Switch to kamino mode (open + hook filtering)"
        exit 1
        ;;
esac
