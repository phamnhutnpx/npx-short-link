#!/bin/bash

# Script setup VPS Ubuntu cho Tiny URL
# Chạy script này trên VPS Ubuntu mới
# Usage: ./scripts/setup-vps.sh

set -e

echo "🔧 Bắt đầu setup VPS Ubuntu cho Tiny URL..."

# Cập nhật hệ thống
echo "📦 Cập nhật hệ thống..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw

# Cài đặt Docker
echo "🐳 Cài đặt Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker đã được cài đặt"
else
    echo "✅ Docker đã được cài đặt sẵn"
fi

# Cài đặt Docker Compose
echo "🐳 Cài đặt Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose đã được cài đặt"
else
    echo "✅ Docker Compose đã được cài đặt sẵn"
fi

# Cài đặt Node.js
echo "📦 Cài đặt Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    echo "✅ Node.js đã được cài đặt"
else
    echo "✅ Node.js đã được cài đặt sẵn"
fi

# Cài đặt Nginx
echo "🌐 Cài đặt Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    echo "✅ Nginx đã được cài đặt"
else
    echo "✅ Nginx đã được cài đặt sẵn"
fi

# Cài đặt Certbot
echo "🔒 Cài đặt Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
    echo "✅ Certbot đã được cài đặt"
else
    echo "✅ Certbot đã được cài đặt sẵn"
fi

# Cấu hình Firewall
echo "🔥 Cấu hình Firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo "✅ Firewall đã được cấu hình"

# Hiển thị thông tin
echo ""
echo "✅ Setup hoàn tất!"
echo ""
echo "📋 Thông tin:"
echo "   - Docker: $(docker --version)"
echo "   - Docker Compose: $(docker compose version)"
echo "   - Node.js: $(node --version)"
echo "   - Nginx: $(nginx -v 2>&1 | cut -d' ' -f3)"
echo ""
echo "⚠️  Lưu ý:"
echo "   1. Cần logout và login lại để áp dụng docker group"
echo "   2. Cần cấu hình DNS trỏ về IP này"
echo "   3. Cần tạo file .env với thông tin database và tokens"
echo ""

