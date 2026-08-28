#!/bin/bash
# Deploy script for Playr frontend (Vite/React)
# Run this on the server (viktor@87.106.19.210) inside ~/apps/playr-frontend-src
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

REPO_DIR="$HOME/apps/playr-frontend-src"
TARGET_DIR="/var/www/playr-frontend"

echo "==> Pulling latest changes"
cd "$REPO_DIR"
git pull

echo "==> Installing dependencies"
npm ci

echo "==> Building (production)"
npm run build

echo "==> Deploying to $TARGET_DIR (requires sudo)"
sudo cp -r dist/* "$TARGET_DIR/"
sudo chown -R www-data:www-data "$TARGET_DIR"

echo "==> Done. Verifying:"
curl -s -o /dev/null -w "https://www.playr.viktorradman.se/ -> %{http_code}\n" https://www.playr.viktorradman.se/
