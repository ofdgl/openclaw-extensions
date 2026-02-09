#!/bin/bash
# ============================================================
# OpenClaw Extensions (Kamino) - Unified Setup Wizard
# Version: 1.2.1
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="1.2.1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Installation tracking
INSTALLED_TOOLS=()
ALREADY_INSTALLED=()
FAILED_TOOLS=()

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
    
    # Check if Kamino is installed (check mode file primarily)
    if [ -f "$HOME/.openclaw-mode" ]; then
        status=$(cat "$HOME/.openclaw-mode")
    elif [ -d "$HOME/openclaw-extensions" ] || [ -d "$SCRIPT_DIR/hooks" ]; then
        # Kamino dirs exist but no mode file - assume kamino
        status="kamino"
        echo "kamino" > "$HOME/.openclaw-mode"
    fi
    
    # Check OpenClaw version
    if command -v openclaw &> /dev/null; then
        OC_VERSION=$(openclaw --version 2>/dev/null | head -1 || echo "unknown")
        echo "  OpenClaw: $OC_VERSION"
    else
        print_error "OpenClaw bulunamadı! Önce OpenClaw kurulumu yapın."
        exit 1
    fi
    
    # Show current security status
    local dm_policy=$(jq -r '.channels.whatsapp.dmPolicy // "unknown"' ~/.openclaw/openclaw.json 2>/dev/null)
    echo "  Kamino Modu: $status"
    echo "  WhatsApp Policy: $dm_policy"
    
    if [ "$status" == "kamino" ] && [ "$dm_policy" == "open" ]; then
        print_success "Kamino aktif - hooks filtreleme yapıyor"
    elif [ "$status" == "original" ] && [ "$dm_policy" == "pairing" ]; then
        print_success "Original aktif - sadece admin erişebilir"
    elif [ "$dm_policy" == "open" ] && [ "$status" != "kamino" ]; then
        print_error "UYARI: dmPolicy=open ama Kamino kapalı! Güvenlik riski!"
    fi
    
    echo "$status"
}

# ============================================================
# Phase 2: Mode Selection (PRESERVES current mode)
# ============================================================

handle_mode_selection() {
    local current_mode="$1"
    
    print_step "Phase 2: Mod Kontrolü"
    
    case "$current_mode" in
        "kamino")
            echo "  ✓ Kamino modu aktif (dmPolicy: open, hooks filtreleme yapıyor)"
            echo ""
            echo "  [1] Devam et (modu değiştirme)"
            echo "  [2] Original moda geç (maksimum güvenlik, sadece admin)"
            echo ""
            local choice=$(prompt_choice "Seçim" "1")
            if [ "$choice" == "2" ]; then
                "$SCRIPT_DIR/scripts/mode-switch.sh" original
                print_warning "Original moda geçildi!"
            fi
            ;;
        "original")
            echo "  ✓ Original mod aktif (dmPolicy: pairing, sadece admin)"
            echo ""
            echo "  [1] Devam et (modu değiştirme)"
            echo "  [2] Kamino modunu aktif et (hooks filtreleme ile açık)"
            echo ""
            local choice=$(prompt_choice "Seçim" "1")
            if [ "$choice" == "2" ]; then
                "$SCRIPT_DIR/scripts/mode-switch.sh" kamino
                print_success "Kamino moduna geçildi!"
            fi
            ;;
        "none")
            echo "  Kamino kurulu değil. İlk kurulum yapılacak."
            echo ""
            echo "  Hangi modda başlamak istersin?"
            echo "  [1] Kamino (open + hooks filtreleme) - önerilen"
            echo "  [2] Original (pairing, sadece admin) - maksimum güvenlik"
            echo ""
            local choice=$(prompt_choice "Seçim" "1")
            install_kamino "$choice"
            ;;
    esac
}

install_kamino() {
    local mode_choice="$1"
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
        print_success "Admin telefon kaydedildi"
    fi
    
    # Set mode based on choice
    if [ "$mode_choice" == "2" ]; then
        "$SCRIPT_DIR/scripts/mode-switch.sh" original
    else
        "$SCRIPT_DIR/scripts/mode-switch.sh" kamino
    fi
    
    print_success "Kamino kuruldu!"
}

# ============================================================
# Phase 3: Toolkit Installation (with tracking)
# ============================================================

check_tool() {
    command -v "$1" &> /dev/null
}

handle_toolkit() {
    print_step "Phase 3: Toolkit Kurulumu"
    
    # Check what's already installed
    echo ""
    echo "  Mevcut durum:"
    [ $(check_tool jq && echo 1) ] && echo "    ✓ jq kurulu" || echo "    ○ jq kurulu değil"
    [ $(check_tool tree && echo 1) ] && echo "    ✓ tree kurulu" || echo "    ○ tree kurulu değil"
    [ $(check_tool pandoc && echo 1) ] && echo "    ✓ pandoc kurulu" || echo "    ○ pandoc kurulu değil"
    [ $(check_tool ffmpeg && echo 1) ] && echo "    ✓ ffmpeg kurulu" || echo "    ○ ffmpeg kurulu değil"
    [ $(docker ps -q -f name=searxng 2>/dev/null | grep -q . && echo 1) ] && echo "    ✓ SearXNG çalışıyor" || echo "    ○ SearXNG kurulu değil"
    [ $(npx playwright --version &>/dev/null && echo 1) ] && echo "    ✓ Playwright kurulu" || echo "    ○ Playwright kurulu değil"
    
    echo ""
    echo "  Toolkit modülleri:"
    echo "    1. DevTools   (~50MB)  - jq, yq, tree, sqlite3, gh"
    echo "    2. Playwright (~300MB) - Headless browser"
    echo "    3. SearXNG    (~500MB) - Ücretsiz web arama (Docker)"
    echo "    4. Converters (~800MB) - pandoc, ffmpeg, imagemagick, libreoffice"
    echo ""
    echo "  [1] Eksikleri kur"
    echo "  [2] Modülleri seç"
    echo "  [3] Toolkit'i atla"
    echo ""
    
    local choice=$(prompt_choice "Seçim" "3")
    
    case "$choice" in
        "1")
            install_toolkit_missing
            ;;
        "2")
            install_toolkit_select
            ;;
        "3")
            print_warning "Toolkit kurulumu atlandı"
            ;;
    esac
}

install_toolkit_missing() {
    print_step "Eksik Araçlar Kuruluyor"
    
    # DevTools
    if ! check_tool jq || ! check_tool tree; then
        if "$SCRIPT_DIR/toolkit/modules/devtools.sh" 2>/dev/null; then
            INSTALLED_TOOLS+=("DevTools")
        else
            FAILED_TOOLS+=("DevTools")
        fi
    else
        ALREADY_INSTALLED+=("DevTools")
    fi
    
    # Playwright
    if ! pip3 show playwright &>/dev/null; then
        if "$SCRIPT_DIR/toolkit/modules/playwright.sh" 2>/dev/null; then
            INSTALLED_TOOLS+=("Playwright")
        else
            FAILED_TOOLS+=("Playwright")
        fi
    else
        ALREADY_INSTALLED+=("Playwright")
    fi
    
    # SearXNG
    if ! docker ps -q -f name=searxng 2>/dev/null | grep -q .; then
        if "$SCRIPT_DIR/toolkit/modules/searxng.sh" 2>/dev/null; then
            INSTALLED_TOOLS+=("SearXNG")
        else
            FAILED_TOOLS+=("SearXNG")
        fi
    else
        ALREADY_INSTALLED+=("SearXNG")
    fi
    
    # Converters
    if ! check_tool pandoc || ! check_tool ffmpeg; then
        if "$SCRIPT_DIR/toolkit/modules/converters.sh" 2>/dev/null; then
            INSTALLED_TOOLS+=("Converters")
        else
            FAILED_TOOLS+=("Converters")
        fi
    else
        ALREADY_INSTALLED+=("Converters")
    fi
    
    inject_toolkit_context
}

install_toolkit_select() {
    echo ""
    
    read -p "  DevTools kur? [e/h]: " dt
    if [ "$dt" == "e" ]; then
        if "$SCRIPT_DIR/toolkit/modules/devtools.sh" 2>/dev/null; then
            INSTALLED_TOOLS+=("DevTools")
        else
            FAILED_TOOLS+=("DevTools")
        fi
    fi
    
    read -p "  Playwright kur? [e/h]: " pw
    if [ "$pw" == "e" ]; then
        if "$SCRIPT_DIR/toolkit/modules/playwright.sh" 2>/dev/null; then
            INSTALLED_TOOLS+=("Playwright")
        else
            FAILED_TOOLS+=("Playwright")
        fi
    fi
    
    read -p "  SearXNG kur? [e/h]: " sx
    if [ "$sx" == "e" ]; then
        if "$SCRIPT_DIR/toolkit/modules/searxng.sh" 2>/dev/null; then
            INSTALLED_TOOLS+=("SearXNG")
        else
            FAILED_TOOLS+=("SearXNG")
        fi
    fi
    
    read -p "  Converters kur? [e/h]: " cv
    if [ "$cv" == "e" ]; then
        if "$SCRIPT_DIR/toolkit/modules/converters.sh" 2>/dev/null; then
            INSTALLED_TOOLS+=("Converters")
        else
            FAILED_TOOLS+=("Converters")
        fi
    fi
    
    inject_toolkit_context
}

inject_toolkit_context() {
    print_step "Context Injection"
    
    # Only inject if tools were actually installed or already present
    local tools_file="$HOME/.openclaw/workspace/TOOLS.md"
    
    # Create dynamic toolkit content based on what's actually installed
    local toolkit_content=""
    
    if check_tool jq; then
        toolkit_content+="\n## 🛠️ DevTools\n- **jq**: \`cat data.json | jq '.key'\`\n- **tree**: \`tree -L 2\`\n"
    fi
    
    if pip3 show playwright &>/dev/null 2>&1; then
        toolkit_content+="\n## 🎭 Playwright\nHeadless browser: \`playwright screenshot https://example.com output.png\`\n"
    fi
    
    if docker ps -q -f name=searxng 2>/dev/null | grep -q .; then
        toolkit_content+="\n## 🔍 SearXNG (Web Arama)\n\`curl 'http://localhost:8080/search?q=QUERY&format=json'\`\n"
    fi
    
    if check_tool pandoc; then
        toolkit_content+="\n## 🔄 Converters\n- **pandoc**: \`pandoc doc.md -o doc.pdf\`\n- **ffmpeg**: \`ffmpeg -i video.mp4 video.webm\`\n"
    fi
    
    if [ -n "$toolkit_content" ]; then
        # Remove old toolkit section if exists
        if grep -q "# Kurulu Araçlar" "$tools_file" 2>/dev/null; then
            # Already has toolkit section, skip
            print_warning "TOOLS.md zaten toolkit bilgisi içeriyor"
        else
            echo -e "\n# Kurulu Araçlar (Toolkit)\n$toolkit_content" >> "$tools_file"
            print_success "TOOLS.md güncellendi (sadece kurulu araçlar)"
        fi
    fi
}

# ============================================================
# Phase 4: Summary & Finalize
# ============================================================

finalize() {
    print_step "Phase 4: Özet ve Finalizasyon"
    
    # Inject mode context to SOUL.md (uses current mode from file)
    "$SCRIPT_DIR/scripts/inject-context.sh" 2>/dev/null || true
    
    # Show summary
    echo ""
    echo "  ═══════════════════════════════════════"
    echo "  📋 KURULUM ÖZETİ"
    echo "  ═══════════════════════════════════════"
    
    if [ ${#ALREADY_INSTALLED[@]} -gt 0 ]; then
        echo -e "  ${GREEN}Zaten kurulu:${NC} ${ALREADY_INSTALLED[*]}"
    fi
    
    if [ ${#INSTALLED_TOOLS[@]} -gt 0 ]; then
        echo -e "  ${GREEN}Yeni kuruldu:${NC} ${INSTALLED_TOOLS[*]}"
    fi
    
    if [ ${#FAILED_TOOLS[@]} -gt 0 ]; then
        echo -e "  ${RED}Kurulamadı:${NC} ${FAILED_TOOLS[*]}"
    fi
    
    if [ ${#ALREADY_INSTALLED[@]} -eq 0 ] && [ ${#INSTALLED_TOOLS[@]} -eq 0 ] && [ ${#FAILED_TOOLS[@]} -eq 0 ]; then
        echo "  Toolkit kurulmadı (atlandı)"
    fi
    
    # Show current mode
    echo ""
    local current_mode=$(cat "$HOME/.openclaw-mode" 2>/dev/null || echo "unknown")
    local dm_policy=$(jq -r '.channels.whatsapp.dmPolicy // "unknown"' ~/.openclaw/openclaw.json 2>/dev/null)
    echo "  Aktif Mod: $current_mode (dmPolicy: $dm_policy)"
    
    echo "  ═══════════════════════════════════════"
    echo ""
    
    # Restart gateway
    echo "  Gateway yeniden başlatılıyor..."
    openclaw gateway restart 2>/dev/null || true
    
    print_success "Kurulum tamamlandı!"
    echo ""
    echo "  Mod değiştirmek için:"
    echo "    ~/openclaw-extensions/scripts/mode-switch.sh [original|kamino]"
    echo ""
}

# ============================================================
# Main
# ============================================================

main() {
    print_header
    
    # Phase 1: Detect
    current_mode=$(detect_installation)
    
    # Phase 2: Mode (preserves current, only changes if user wants)
    handle_mode_selection "$current_mode"
    
    # Phase 3: Toolkit
    handle_toolkit
    
    # Phase 4: Finalize
    finalize
}

# Run
main "$@"
