#!/bin/bash
# Playwright Module - ~300MB
# Headless Chromium browser for web scraping (Node.js version)

set -e

echo "🎭 Playwright Kurulumu (Node.js)..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "  Node.js bulunamadı, kuruluyor..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "  npm bulunamadı, kuruluyor..."
    sudo apt-get install -y npm
fi

# Install playwright globally
echo "  Playwright CLI kuruluyor..."
npm install -g playwright

# Install Chromium browser and dependencies
echo "  Chromium ve bağımlılıklar indiriliyor (~300MB)..."
npx playwright install chromium
npx playwright install-deps chromium

echo "✅ Playwright kuruldu (Node.js + Chromium)"
echo "   Kullanım: npx playwright screenshot https://example.com output.png"
echo "   PDF:      npx playwright pdf https://example.com output.pdf"
