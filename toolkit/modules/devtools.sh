#!/bin/bash
# DevTools Module - ~50MB
# jq, yq, tree, sqlite3, gh (GitHub CLI)

set -e

echo "📦 DevTools Kurulumu..."

# Update package list
sudo apt-get update -qq

# Install basic tools
sudo apt-get install -y -qq jq tree sqlite3

# Install yq (YAML processor)
if ! command -v yq &> /dev/null; then
    pip3 install yq --quiet 2>/dev/null || pip install yq --quiet
fi

# Install GitHub CLI
if ! command -v gh &> /dev/null; then
    type -p curl >/dev/null || sudo apt install curl -y
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    sudo apt update -qq
    sudo apt install gh -y -qq
fi

echo "✅ DevTools kuruldu: jq, yq, tree, sqlite3, gh"
