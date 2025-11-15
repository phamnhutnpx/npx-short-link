#!/bin/bash

# Script deploy từ GitHub
# Chạy script này trên VPS sau khi đã clone code từ GitHub

set -e

echo "🚀 DEPLOY TỪ GITHUB"
echo "==================="
echo ""

# Kiểm tra đang ở đúng thư mục
if [ ! -f "package.json" ]; then
    echo "❌ Lỗi: Không tìm thấy package.json"
    echo "Vui lòng chạy script từ thư mục root của project"
    exit 1
fi

# Pull code mới từ GitHub
echo "📥 Pulling code từ GitHub..."
git pull origin main || git pull origin master
echo "✅ Code đã được cập nhật"
echo ""

# Chạy script auto-deploy
if [ -f "scripts/auto-deploy.sh" ]; then
    echo "🔄 Chạy script deploy tự động..."
    chmod +x scripts/auto-deploy.sh
    ./scripts/auto-deploy.sh
else
    echo "⚠️  Script auto-deploy.sh không tìm thấy"
    echo "Chạy deploy thủ công..."
    
    # Build và deploy
    docker compose -f docker-compose.prod.yml build
    docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
    docker compose -f docker-compose.prod.yml up -d
    
    echo "✅ Deploy hoàn tất!"
fi

