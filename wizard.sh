#!/bin/bash
# ============================================================
# OpenClaw Extensions (Kamino) - Unified Setup Wizard
# Version: 1.2.0
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="1.2.0"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================
# Helper Functions
# ============================================================

print_header() {
    clear
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║     🦞 OpenClaw Extensions (Kamino) Setup Wizard v${VERSION}      ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

prompt_choice() {
    local prompt="$1"
    local default="$2"
    read -p "$prompt [$default]: " choice
    echo "${choice:-$default}"
}

# ============================================================
# Phase 1: Detection
# ============================================================

detect_installation() {
    print_step "Phase 1: Kurulum Tespiti"
    
    local status="none"
    
    # Check if Kamino is installed
    if [ -d "$HOME/openclaw-extensions" ] || [ -d "$SCRIPT_DIR/hooks" ]; then
        if [ -f "$HOME/.openclaw-mode" ]; then
            status=$(cat "$HOME/.openclaw-mode")
        else
            status="kamino"
        fi
    fi
    
    # Check OpenClaw version
    if command -v openclaw &> /dev/null; then
        OC_VERSION=$(openclaw --version 2>/dev/null | head -1 || echo "unknown")
        echo "  OpenClaw: $OC_VERSION"
    else
        print_error "OpenClaw bulunamadı! Önce OpenClaw kurulumu yapın."
        exit 1
    fi
    
    echo "  Kamino Durumu: $status"
    echo "$status"
}

# ============================================================
# Phase 2: Mode Selection
# ============================================================

handle_mode_selection() {
    local current_mode="$1"
    
    print_step "Phase 2: Mod Seçimi"
    
    case "$current_mode" in
        "kamino")
            echo "  Şu an: Kamino modu aktif"
            echo ""
            echo "  [1] Kamino modunda kal"
            echo "  [2] Original moda geç (maksimum güvenlik)"
            echo ""
            local choice=$(prompt_choice "Seçim" "1")
            if [ "$choice" == "2" ]; then
                "$SCRIPT_DIR/scripts/mode-switch.sh" original
            fi
            ;;
        "original")
            echo "  Şu an: Original mod (Kamino devre dışı)"
            echo ""
            echo "  [1] Original modda kal"
            echo "  [2] Kamino modunu aktif et"
            echo ""
            local choice=$(prompt_choice "Seçim" "1")
            if [ "$choice" == "2" ]; then
                "$SCRIPT_DIR/scripts/mode-switch.sh" kamino
            fi
            ;;
        "none")
            echo "  Kamino kurulu değil."
            echo ""
            echo "  Kamino v${VERSION} özellikleri:"
            echo "    - 20 production-ready hook"
            echo "    - 4 özelleştirilmiş agent"
            echo "    - Güvenlik ve rate limiting"
            echo "    - VPS modu değiştirme"
            echo ""
            local choice=$(prompt_choice "Kurulsun mu? [e/h]" "e")
            if [ "$choice" == "e" ] || [ "$choice" == "E" ]; then
                install_kamino
            else
                echo "Kurulum iptal edildi."
                exit 0
            fi
            ;;
    esac
}

install_kamino() {
    print_step "Kamino Kurulumu"
    
    # Copy hooks
    mkdir -p ~/.openclaw/hooks
    if [ -d "$SCRIPT_DIR/hooks" ]; then
        cp -r "$SCRIPT_DIR/hooks/"* ~/.openclaw/hooks/
        print_success "Hooks kopyalandı"
    fi
    
    # Ask for admin phone (optional)
    echo ""
    echo "  Admin telefon numarası (opsiyonel, WhatsApp routing için):"
    echo "  Format: +905XXXXXXXXX"
    local admin_phone=$(prompt_choice "Numara (boş bırakılabilir)" "")
    if [ -n "$admin_phone" ]; then
        echo "$admin_phone" > "$HOME/.openclaw-admin-phone"
        print_success "Admin telefon kaydedildi: ~/.openclaw-admin-phone"
    fi
    
    # Set mode
    echo "kamino" > "$HOME/.openclaw-mode"
    print_success "Kamino kuruldu!"
}

# ============================================================
# Phase 3: Toolkit Installation
# ============================================================

handle_toolkit() {
    print_step "Phase 3: Toolkit Kurulumu"
    
    echo ""
    echo "  Toolkit modülleri (boyut sırasıyla):"
    echo "    1. DevTools   (~50MB)  - jq, yq, tree, sqlite3, gh"
    echo "    2. Playwright (~300MB) - Headless browser"
    echo "    3. SearXNG    (~500MB) - Ücretsiz web arama (Docker)"
    echo "    4. Converters (~800MB) - pandoc, ffmpeg, imagemagick, libreoffice"
    echo ""
    echo "  [1] Tam kurulum (önerilen) ✨"
    echo "  [2] Modülleri seç"
    echo "  [3] Toolkit'i atla"
    echo ""
    
    local choice=$(prompt_choice "Seçim" "3")
    
    case "$choice" in
        "1")
            install_toolkit_all
            ;;
        "2")
            install_toolkit_select
            ;;
        "3")
            print_warning "Toolkit kurulumu atlandı"
            ;;
    esac
}

install_toolkit_all() {
    print_step "Tam Toolkit Kurulumu"
    
    "$SCRIPT_DIR/toolkit/modules/devtools.sh" || true
    "$SCRIPT_DIR/toolkit/modules/playwright.sh" || true
    "$SCRIPT_DIR/toolkit/modules/searxng.sh" || true
    "$SCRIPT_DIR/toolkit/modules/converters.sh" || true
    
    inject_toolkit_context
}

install_toolkit_select() {
    echo ""
    
    read -p "  DevTools kur? [e/h]: " dt
    if [ "$dt" == "e" ]; then
        "$SCRIPT_DIR/toolkit/modules/devtools.sh" || true
    fi
    
    read -p "  Playwright kur? [e/h]: " pw
    if [ "$pw" == "e" ]; then
        "$SCRIPT_DIR/toolkit/modules/playwright.sh" || true
    fi
    
    read -p "  SearXNG kur? [e/h]: " sx
    if [ "$sx" == "e" ]; then
        "$SCRIPT_DIR/toolkit/modules/searxng.sh" || true
    fi
    
    read -p "  Converters kur? [e/h]: " cv
    if [ "$cv" == "e" ]; then
        "$SCRIPT_DIR/toolkit/modules/converters.sh" || true
    fi
    
    inject_toolkit_context
}

inject_toolkit_context() {
    print_step "Context Injection"
    
    if [ -f "$SCRIPT_DIR/toolkit/context/TOOLKIT.md" ]; then
        # Append toolkit info to TOOLS.md if not already there
        if ! grep -q "# Kurulu Araçlar" ~/.openclaw/workspace/TOOLS.md 2>/dev/null; then
            cat "$SCRIPT_DIR/toolkit/context/TOOLKIT.md" >> ~/.openclaw/workspace/TOOLS.md
            print_success "TOOLKIT.md → TOOLS.md eklendi"
        fi
    fi
}

# ============================================================
# Phase 4: Finalize
# ============================================================

finalize() {
    print_step "Phase 4: Finalizasyon"
    
    # Inject mode context to SOUL.md
    "$SCRIPT_DIR/scripts/inject-context.sh" 2>/dev/null || true
    
    # Restart gateway
    echo "  Gateway yeniden başlatılıyor..."
    openclaw gateway restart 2>/dev/null || true
    
    print_success "Kurulum tamamlandı!"
    echo ""
    echo "  Sonraki adımlar:"
    echo "    - WhatsApp'tan test mesajı gönderin"
    echo "    - Mod değiştirmek için: ~/openclaw-extensions/scripts/mode-switch.sh [original|kamino]"
    echo "    - Dokümantasyon: ~/openclaw-extensions/docs/"
    echo ""
}

# ============================================================
# Main
# ============================================================

main() {
    print_header
    
    # Phase 1: Detect
    current_mode=$(detect_installation)
    
    # Phase 2: Mode
    handle_mode_selection "$current_mode"
    
    # Phase 3: Toolkit
    handle_toolkit
    
    # Phase 4: Finalize
    finalize
}

# Run
main "$@"
