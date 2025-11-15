#!/bin/bash

# Script deploy tự động cho VPS Ubuntu
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Bắt đầu deploy Tiny URL..."

# Kiểm tra đang ở đúng thư mục
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Lỗi: Không tìm thấy docker-compose.yml"
    echo "Vui lòng chạy script từ thư mục root của project"
    exit 1
fi

# Kiểm tra file .env
if [ ! -f ".env" ]; then
    echo "❌ Lỗi: Không tìm thấy file .env"
    echo "Vui lòng tạo file .env trước khi deploy"
    exit 1
fi

echo "📦 Building Docker images..."
docker compose build

echo "🗄️ Running database migrations..."
docker compose run --rm web npx prisma migrate deploy

echo "🚀 Starting services..."
docker compose up -d

echo "⏳ Đợi services khởi động..."
sleep 5

echo "✅ Kiểm tra services..."
docker compose ps

echo "📊 Xem logs (Ctrl+C để thoát)..."
docker compose logs -f

