#!/bin/bash

# Script di chuyển code vào /var/www/tiny-url
# Chạy script này từ thư mục chứa code

set -e

CURRENT_DIR=$(pwd)
TARGET_DIR="/var/www/tiny-url"

echo "📁 DI CHUYỂN CODE VÀO /var/www"
echo "=============================="
echo ""

# Kiểm tra có package.json không
if [ ! -f "package.json" ]; then
    echo "❌ Lỗi: Không tìm thấy package.json"
    echo "Vui lòng chạy script từ thư mục root của project"
    exit 1
fi

echo "📂 Thư mục hiện tại: $CURRENT_DIR"
echo "🎯 Thư mục đích: $TARGET_DIR"
echo ""

# Hỏi xác nhận
read -p "Bạn có muốn di chuyển code vào $TARGET_DIR? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Đã hủy"
    exit 0
fi

# Tạo thư mục đích
echo "📦 Tạo thư mục đích..."
sudo mkdir -p $TARGET_DIR
sudo chown -R $USER:$USER $TARGET_DIR

# Di chuyển code
echo "🚚 Di chuyển code..."
sudo mv $CURRENT_DIR/* $TARGET_DIR/ 2>/dev/null || true
sudo mv $CURRENT_DIR/.* $TARGET_DIR/ 2>/dev/null || true

# Set quyền
echo "🔐 Set quyền..."
sudo chown -R $USER:$USER $TARGET_DIR

# Vào thư mục mới
cd $TARGET_DIR

echo ""
echo "✅ Di chuyển thành công!"
echo "📂 Thư mục mới: $TARGET_DIR"
echo ""
echo "Bây giờ bạn có thể chạy:"
echo "  cd $TARGET_DIR"
echo "  ./scripts/auto-deploy.sh"

