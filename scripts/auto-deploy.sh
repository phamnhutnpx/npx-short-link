#!/bin/bash

# Script tự động deploy Tiny URL lên VPS
# Chạy script này trên VPS: bash <(curl -s https://raw.githubusercontent.com/...) hoặc upload và chạy

set -e

echo "🚀 BẮT ĐẦU TỰ ĐỘNG DEPLOY TINY URL"
echo "===================================="
echo ""

# Màu sắc
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Biến
PROJECT_DIR="/var/www/tiny-url"
DOMAIN="url.npxofficial.com"

# Hàm kiểm tra lỗi
check_error() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Lỗi: $1${NC}"
        exit 1
    fi
}

# Bước 1: Kiểm tra và cài đặt dependencies
echo -e "${GREEN}📦 Bước 1: Kiểm tra môi trường...${NC}"

# Cài Docker nếu chưa có
if ! command -v docker &> /dev/null; then
    echo "Cài đặt Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    check_error "Cài đặt Docker thất bại"
fi

# Cài Docker Compose nếu chưa có
if ! command -v docker-compose &> /dev/null; then
    echo "Cài đặt Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    check_error "Cài đặt Docker Compose thất bại"
fi

# Cài Nginx nếu chưa có
if ! command -v nginx &> /dev/null; then
    echo "Cài đặt Nginx..."
    sudo apt update
    sudo apt install -y nginx
    sudo systemctl enable nginx
    check_error "Cài đặt Nginx thất bại"
fi

# Cài Certbot nếu chưa có
if ! command -v certbot &> /dev/null; then
    echo "Cài đặt Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
    check_error "Cài đặt Certbot thất bại"
fi

echo -e "${GREEN}✅ Môi trường đã sẵn sàng${NC}"
echo ""

# Bước 2: Tạo thư mục project
echo -e "${GREEN}📁 Bước 2: Tạo thư mục project...${NC}"
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR
cd $PROJECT_DIR
echo -e "${GREEN}✅ Thư mục đã tạo: $PROJECT_DIR${NC}"
echo ""

# Bước 3: Upload code (người dùng cần upload code vào thư mục này)
echo -e "${YELLOW}⚠️  Bước 3: Vui lòng đảm bảo code đã được upload vào $PROJECT_DIR${NC}"
echo "Nếu chưa upload, hãy dùng lệnh sau từ máy local:"
echo "  scp -r ./* $USER@$(hostname -I | awk '{print $1}'):$PROJECT_DIR/"
echo ""
read -p "Nhấn Enter sau khi đã upload code..."

# Kiểm tra file cần thiết
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Không tìm thấy package.json. Vui lòng upload code trước.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Code đã được upload${NC}"
echo ""

# Bước 4: Tạo file .env
echo -e "${GREEN}⚙️  Bước 4: Tạo file .env...${NC}"

if [ ! -f ".env" ]; then
    # Tạo tokens ngẫu nhiên
    ADMIN_TOKEN=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 64)
    DB_PASSWORD=$(openssl rand -hex 24)
    
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db:5432/tiny_url?schema=public"

# Domain
NEXT_PUBLIC_DOMAIN="https://${DOMAIN}"

# Security (Đã tự động generate)
ADMIN_TOKEN="${ADMIN_TOKEN}"
JWT_SECRET="${JWT_SECRET}"

# Optional
REDIS_URL=""
GEOIP_DB_PATH=""
EOF
    
    echo -e "${GREEN}✅ File .env đã được tạo${NC}"
    echo -e "${YELLOW}⚠️  Lưu lại thông tin sau:${NC}"
    echo "   ADMIN_TOKEN: $ADMIN_TOKEN"
    echo "   DB_PASSWORD: $DB_PASSWORD"
    echo ""
else
    echo -e "${YELLOW}⚠️  File .env đã tồn tại, giữ nguyên${NC}"
    DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d'=' -f2 | tr -d '"' || echo "")
fi
echo ""

# Bước 5: Cập nhật docker-compose.prod.yml
echo -e "${GREEN}🐳 Bước 5: Cấu hình Docker Compose...${NC}"

if [ ! -f "docker-compose.prod.yml" ]; then
    cat > docker-compose.prod.yml << 'EOF'
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: tiny_url
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  web:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - .env
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/tiny_url?schema=public
    ports:
      - '127.0.0.1:3000:3000'
    depends_on:
      db:
        condition: service_healthy
    command: npm run start

volumes:
  db-data:
    driver: local
EOF
fi

# Cập nhật DB_PASSWORD trong docker-compose.prod.yml nếu có
if [ ! -z "$DB_PASSWORD" ]; then
    sed -i "s/\${DB_PASSWORD}/$DB_PASSWORD/g" docker-compose.prod.yml
fi

echo -e "${GREEN}✅ Docker Compose đã được cấu hình${NC}"
echo ""

# Bước 6: Build và chạy migrations
echo -e "${GREEN}🔨 Bước 6: Build Docker images...${NC}"
docker compose -f docker-compose.prod.yml build
check_error "Build Docker images thất bại"
echo -e "${GREEN}✅ Build thành công${NC}"
echo ""

echo -e "${GREEN}🗄️  Bước 7: Chạy database migrations...${NC}"
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
check_error "Migrations thất bại"
echo -e "${GREEN}✅ Migrations thành công${NC}"
echo ""

# Bước 7: Khởi động services
echo -e "${GREEN}🚀 Bước 8: Khởi động services...${NC}"
docker compose -f docker-compose.prod.yml up -d
check_error "Khởi động services thất bại"

# Đợi services khởi động
echo "Đợi services khởi động..."
sleep 10

docker compose -f docker-compose.prod.yml ps
echo -e "${GREEN}✅ Services đã khởi động${NC}"
echo ""

# Bước 8: Cấu hình Nginx
echo -e "${GREEN}🌐 Bước 9: Cấu hình Nginx...${NC}"

# Tạo Nginx config
sudo tee /etc/nginx/sites-available/tiny-url > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/tiny-url /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test và reload Nginx
sudo nginx -t
check_error "Nginx config có lỗi"
sudo systemctl reload nginx
echo -e "${GREEN}✅ Nginx đã được cấu hình${NC}"
echo ""

# Bước 9: Cấu hình Firewall
echo -e "${GREEN}🔥 Bước 10: Cấu hình Firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo -e "${GREEN}✅ Firewall đã được cấu hình${NC}"
echo ""

# Bước 10: Setup SSL
echo -e "${GREEN}🔒 Bước 11: Setup SSL Certificate...${NC}"
echo -e "${YELLOW}⚠️  Đảm bảo DNS đã trỏ về IP này trước khi tiếp tục${NC}"
read -p "DNS đã trỏ đúng chưa? (y/n): " confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} --redirect
    check_error "Setup SSL thất bại"
    echo -e "${GREEN}✅ SSL đã được cấu hình${NC}"
else
    echo -e "${YELLOW}⚠️  Bỏ qua SSL. Chạy sau: sudo certbot --nginx -d ${DOMAIN}${NC}"
fi
echo ""

# Hoàn thành
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ DEPLOY THÀNH CÔNG!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "🌐 Truy cập ứng dụng:"
echo "   http://${DOMAIN} (hoặc https://${DOMAIN} nếu đã setup SSL)"
echo ""
echo "📊 Kiểm tra services:"
echo "   docker compose -f docker-compose.prod.yml ps"
echo ""
echo "📝 Xem logs:"
echo "   docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🔑 Thông tin quan trọng đã lưu trong file .env"
echo ""

