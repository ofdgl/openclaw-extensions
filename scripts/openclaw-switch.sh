#!/bin/bash
# OpenClaw Mode Switch Script
# Usage: ./openclaw-switch.sh [original|kamino]
# Persists mode across restarts

set -e

MODE="${1:-status}"
MODE_FILE="/home/kowalski/.openclaw-mode"
ACTIVE_LINK="/home/kowalski/.openclaw-active"

# Directories
ORIGINAL_DIR="/home/kowalski/.openclaw-original"
KAMINO_DIR="/home/kowalski/.openclaw-kamino"

# Docker container name
CONTAINER_NAME="openclaw"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

get_current_mode() {
    if [ -f "$MODE_FILE" ]; then
        cat "$MODE_FILE"
    else
        echo "kamino"  # Default
    fi
}

switch_mode() {
    local target_mode="$1"
    local target_dir=""
    
    if [ "$target_mode" = "original" ]; then
        target_dir="$ORIGINAL_DIR"
    else
        target_dir="$KAMINO_DIR"
    fi
    
    log "Switching to $target_mode mode..."
    
    # Stop current container
    log "Stopping OpenClaw container..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    
    # Update symlink
    log "Updating active config symlink..."
    rm -f "$ACTIVE_LINK"
    ln -s "$target_dir" "$ACTIVE_LINK"
    
    # Save mode state
    echo "$target_mode" > "$MODE_FILE"
    
    # Start container with new config
    log "Starting OpenClaw with $target_mode configuration..."
    docker start "$CONTAINER_NAME"
    
    # Wait for gateway to be ready
    log "Waiting for gateway..."
    sleep 5
    
    # Health check
    if docker exec "$CONTAINER_NAME" openclaw health --quiet 2>/dev/null; then
        log "✅ Gateway is healthy"
    else
        log "⚠️ Gateway may need more time to start"
    fi
    
    log "Mode switch complete: $target_mode"
}

show_status() {
    local current=$(get_current_mode)
    echo "=========================================="
    echo "OpenClaw VPS Mode Status"
    echo "=========================================="
    echo "Current Mode: $current"
    echo "Mode File: $MODE_FILE"
    echo "Active Link: $ACTIVE_LINK -> $(readlink -f $ACTIVE_LINK 2>/dev/null || echo 'Not set')"
    echo ""
    echo "Available Modes:"
    echo "  - original: Strict admin-only access"
    echo "  - kamino:   Enhanced with 19 hooks"
    echo "=========================================="
}

# Startup hook (called by systemd/docker on boot)
ensure_mode_on_startup() {
    local saved_mode=$(get_current_mode)
    log "Boot: Ensuring mode is set to $saved_mode"
    
    # Make sure symlink points to correct directory
    local expected_dir=""
    if [ "$saved_mode" = "original" ]; then
        expected_dir="$ORIGINAL_DIR"
    else
        expected_dir="$KAMINO_DIR"
    fi
    
    if [ "$(readlink -f $ACTIVE_LINK)" != "$expected_dir" ]; then
        log "Boot: Fixing symlink from $(readlink -f $ACTIVE_LINK) to $expected_dir"
        rm -f "$ACTIVE_LINK"
        ln -s "$expected_dir" "$ACTIVE_LINK"
    fi
}

# Main
case "$MODE" in
    original|simple)
        switch_mode "original"
        ;;
    kamino|plus)
        switch_mode "kamino"
        ;;
    status)
        show_status
        ;;
    startup)
        ensure_mode_on_startup
        ;;
    *)
        echo "Usage: $0 [original|kamino|status|startup]"
        exit 1
        ;;
esac
