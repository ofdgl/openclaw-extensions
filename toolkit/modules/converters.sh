#!/bin/bash
# Converters Module - ~800MB
# pandoc, imagemagick, ffmpeg, libreoffice, ghostscript, poppler-utils

set -e

echo "🔄 Converters Kurulumu..."

# Update package list
sudo apt-get update -qq

# Install all converters
sudo apt-get install -y -qq \
    pandoc \
    imagemagick \
    ffmpeg \
    ghostscript \
    poppler-utils

# LibreOffice (headless) - largest component
sudo apt-get install -y -qq libreoffice-core libreoffice-writer libreoffice-calc --no-install-recommends

echo "✅ Converters kuruldu:"
echo "   - pandoc: markdown ↔ docx ↔ pdf"
echo "   - imagemagick: resim dönüştürme"
echo "   - ffmpeg: video/audio dönüştürme"
echo "   - libreoffice: office dosyaları"
echo "   - ghostscript: PDF işleme"
echo "   - poppler-utils: pdftotext, pdftoppm"
