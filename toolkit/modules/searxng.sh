#!/bin/bash
# SearXNG Module - ~500MB
# Self-hosted meta search engine (Docker)

set -e

echo "🔍 SearXNG Kurulumu..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Docker bulunamadı. Kuruluyor..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

# Check if already running
if docker ps -q -f name=searxng 2>/dev/null | grep -q .; then
    echo "SearXNG zaten çalışıyor"
else
    # Remove old container if exists
    docker rm -f searxng 2>/dev/null || true
    
    # Run SearXNG
    docker run -d \
        --name searxng \
        --restart unless-stopped \
        -p 8080:8080 \
        -e SEARXNG_BASE_URL=http://localhost:8080 \
        searxng/searxng:latest
fi

echo "✅ SearXNG kuruldu: http://localhost:8080"
echo "   API: curl 'http://localhost:8080/search?q=QUERY&format=json'"
