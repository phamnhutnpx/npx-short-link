#!/bin/bash

# Script backup database
# Usage: ./scripts/backup-db.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-/root/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="${PROJECT_DIR:-/var/www/tiny-url}"

echo "📦 Bắt đầu backup database..."

# Tạo thư mục backup nếu chưa có
mkdir -p "$BACKUP_DIR"

# Backup database
cd "$PROJECT_DIR"
docker compose exec -T db pg_dump -U postgres tiny_url | gzip > "$BACKUP_DIR/tiny_url_$DATE.sql.gz"

# Kiểm tra file backup
if [ -f "$BACKUP_DIR/tiny_url_$DATE.sql.gz" ]; then
    SIZE=$(du -h "$BACKUP_DIR/tiny_url_$DATE.sql.gz" | cut -f1)
    echo "✅ Backup thành công: $BACKUP_DIR/tiny_url_$DATE.sql.gz ($SIZE)"
else
    echo "❌ Lỗi: Backup thất bại"
    exit 1
fi

# Xóa backups cũ hơn 7 ngày
find "$BACKUP_DIR" -name "tiny_url_*.sql.gz" -mtime +7 -delete
echo "🧹 Đã xóa backups cũ hơn 7 ngày"

echo "✅ Hoàn thành backup!"

