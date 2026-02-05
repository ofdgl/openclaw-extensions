#!/bin/bash
# VPS Mode Switch - Direct command handler (bypasses AI model)

MODE_FILE="$HOME/.openclaw-mode"
KAMINO_DIR="$HOME/.openclaw-kamino"
ORIGINAL_DIR="$HOME/.openclaw-original"
ACTIVE_LINK="$HOME/.openclaw-active"

# Parse command from args
CMD="${1:-status}"

case "$CMD" in
  status)
    CURRENT=$(cat "$MODE_FILE" 2>/dev/null || echo "unknown")
    echo "🔄 **VPS Mode Status**"
    echo ""
    echo "**Aktif Mod:** $CURRENT"
    echo "**Symlink:** $(readlink "$ACTIVE_LINK" 2>/dev/null || echo 'not set')"
    echo ""
    echo "Komutlar: \`/vps original\` | \`/vps kamino\`"
    ;;
    
  original|simple)
    echo "kamino" > "$MODE_FILE"
    ln -sfn "$ORIGINAL_DIR" "$ACTIVE_LINK"
    systemctl restart openclaw-gateway 2>/dev/null || openclaw gateway restart
    echo "✅ **Original moda geçildi!**"
    echo ""
    echo "- Strict allowlist"
    echo "- Bundled hooks only"
    ;;
    
  kamino|plus)
    echo "kamino" > "$MODE_FILE"
    ln -sfn "$KAMINO_DIR" "$ACTIVE_LINK"
    systemctl restart openclaw-gateway 2>/dev/null || openclaw gateway restart
    echo "✅ **Kamino moda geçildi!**"
    echo ""
    echo "- 21 custom hooks"
    echo "- Multi-agent system"
    echo "- Rate limiting enabled"
    ;;
    
  *)
    echo "❌ Bilinmeyen komut: $CMD"
    echo ""
    echo "Kullanım:"
    echo "- \`/vps status\` - Aktif modu göster"
    echo "- \`/vps original\` - Orijinal moda geç"  
    echo "- \`/vps kamino\` - Gelişmiş moda geç"
    ;;
esac
