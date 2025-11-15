# 🤖 TỰ ĐỘNG DEPLOY LÊN VPS

## Cách 1: Chạy script tự động (Khuyến nghị)

### Bước 1: Upload code lên VPS

Từ máy local, chạy:

```bash
# Tạo thư mục trên VPS
ssh npx-vps "sudo mkdir -p /var/www/tiny-url && sudo chown \$USER:\$USER /var/www/tiny-url"

# Upload toàn bộ code
scp -r ./* npx-vps:/var/www/tiny-url/
```

### Bước 2: SSH vào VPS và chạy script

```bash
ssh npx-vps
cd /var/www/tiny-url
chmod +x scripts/auto-deploy.sh
./scripts/auto-deploy.sh
```

Script sẽ tự động:
- ✅ Cài đặt Docker, Docker Compose, Nginx, Certbot
- ✅ Tạo file .env với tokens ngẫu nhiên
- ✅ Cấu hình Docker Compose
- ✅ Build và deploy ứng dụng
- ✅ Chạy database migrations
- ✅ Cấu hình Nginx
- ✅ Setup SSL với Let's Encrypt
- ✅ Cấu hình Firewall

## Cách 2: Chạy từng lệnh (Nếu muốn kiểm soát từng bước)

### SSH vào VPS

```bash
ssh npx-vps
```

### Chạy các lệnh sau:

```bash
# 1. Tạo thư mục
sudo mkdir -p /var/www/tiny-url
sudo chown $USER:$USER /var/www/tiny-url
cd /var/www/tiny-url

# 2. Upload code từ máy local (chạy trên máy local)
# scp -r ./* npx-vps:/var/www/tiny-url/

# 3. Cài đặt môi trường
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# 4. Tạo file .env
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:CHANGE_THIS@db:5432/tiny_url?schema=public"
NEXT_PUBLIC_DOMAIN="https://url.npxofficial.com"
ADMIN_TOKEN="$(openssl rand -hex 32)"
JWT_SECRET="$(openssl rand -hex 64)"
REDIS_URL=""
GEOIP_DB_PATH=""
EOF

# Generate tokens
ADMIN_TOKEN=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 64)
DB_PASSWORD=$(openssl rand -hex 24)

# Cập nhật .env
cat > .env << EOF
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db:5432/tiny_url?schema=public"
NEXT_PUBLIC_DOMAIN="https://url.npxofficial.com"
ADMIN_TOKEN="${ADMIN_TOKEN}"
JWT_SECRET="${JWT_SECRET}"
REDIS_URL=""
GEOIP_DB_PATH=""
EOF

# 5. Tạo docker-compose.prod.yml
cat > docker-compose.prod.yml << EOF
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

# 6. Build và deploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d

# 7. Cấu hình Nginx
sudo tee /etc/nginx/sites-available/tiny-url > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name url.npxofficial.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

sudo ln -sf /etc/nginx/sites-available/tiny-url /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 8. Setup SSL (đảm bảo DNS đã trỏ đúng)
sudo certbot --nginx -d url.npxofficial.com --non-interactive --agree-tos --email admin@url.npxofficial.com --redirect

# 9. Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 10. Kiểm tra
docker compose -f docker-compose.prod.yml ps
curl -I http://localhost:3000
```

## ⚠️ LƯU Ý QUAN TRỌNG

1. **DNS phải trỏ đúng** trước khi chạy Certbot:
   - Type: A
   - Name: url
   - Value: IP của VPS

2. **Lưu lại thông tin** sau khi deploy:
   - ADMIN_TOKEN (trong file .env)
   - DB_PASSWORD (trong file .env)

3. **Kiểm tra logs** nếu có lỗi:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

## 🔍 KIỂM TRA SAU KHI DEPLOY

```bash
# Kiểm tra services
docker compose -f docker-compose.prod.yml ps

# Kiểm tra logs
docker compose -f docker-compose.prod.yml logs -f web

# Test API
curl -X POST https://url.npxofficial.com/api/links \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"destination": "https://example.com"}'

# Test redirect
curl -I https://url.npxofficial.com/r/docs
```

## 📝 CẬP NHẬT CODE SAU NÀY

```bash
ssh npx-vps
cd /var/www/tiny-url

# Pull code mới hoặc upload code mới
# git pull  # hoặc scp từ máy local

# Rebuild và restart
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d
```

---

**Chúc bạn deploy thành công! 🚀**

