#!/bin/bash
# Context Injection Script
# Injects mode-specific context to SOUL.md

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$HOME/.openclaw/workspace"
MODE_FILE="$HOME/.openclaw-mode"
SOUL_FILE="$WORKSPACE/SOUL.md"

# Determine current mode
if [ -f "$MODE_FILE" ]; then
    CURRENT_MODE=$(cat "$MODE_FILE")
else
    CURRENT_MODE="kamino"
fi

# Remove existing mode block from SOUL.md
if [ -f "$SOUL_FILE" ]; then
    # Remove lines between mode markers
    sed -i '/^## Mevcut Mod:/,/^##[^#]/{ /^## Mevcut Mod:/d; /^##[^#]/!d; }' "$SOUL_FILE" 2>/dev/null || true
fi

# Append appropriate mode block
case "$CURRENT_MODE" in
    "original")
        cat >> "$SOUL_FILE" << 'EOF'

## Mevcut Mod: Original
Şu an standart OpenClaw kodu ile çalışıyorsun.
Arkada Kamino extension paketi mevcut ama kullanıcı talimatıyla devre dışı.
Kullanıcı Kamino'ya geçmek isterse terminal komutu gerekiyor:
```
~/openclaw-extensions/scripts/mode-switch.sh kamino
```
EOF
        echo "✅ Original mod context'i SOUL.md'ye eklendi"
        ;;
    "kamino")
        cat >> "$SOUL_FILE" << 'EOF'

## Mevcut Mod: Kamino
Özel hook ve extension sistemi aktif.
Kod kaynaklı bir endişe veya güvenlik açığı varsa,
kullanıcıya güvenli moda geçiş önerebilirsin:
```
~/openclaw-extensions/scripts/mode-switch.sh original
```
EOF
        echo "✅ Kamino mod context'i SOUL.md'ye eklendi"
        ;;
esac
