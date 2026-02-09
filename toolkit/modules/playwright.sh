#!/bin/bash
# Playwright Module - ~300MB
# Headless Chromium browser for web scraping

set -e

echo "🎭 Playwright Kurulumu..."

# Install pip if not present
if ! command -v pip3 &> /dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq python3-pip
fi

# Install playwright
pip3 install playwright --quiet 2>/dev/null || pip install playwright --quiet

# Install Chromium browser
playwright install chromium

echo "✅ Playwright kuruldu (Chromium)"
echo "   Kullanım: playwright codegen https://example.com"
