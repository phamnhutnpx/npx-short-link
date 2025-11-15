# 🚀 HƯỚNG DẪN DEPLOY LÊN VPS UBUNTU

## 📋 MỤC LỤC

1. [Chuẩn bị VPS](#1-chuẩn-bị-vps)
2. [Cài đặt môi trường](#2-cài-đặt-môi-trường)
3. [Setup Domain & DNS](#3-setup-domain--dns)
4. [Deploy ứng dụng](#4-deploy-ứng-dụng)
5. [Cấu hình Nginx](#5-cấu-hình-nginx)
6. [Setup SSL với Let's Encrypt](#6-setup-ssl-với-lets-encrypt)
7. [Cấu hình Firewall](#7-cấu-hình-firewall)
8. [Kiểm tra và Monitoring](#8-kiểm-tra-và-monitoring)

---

## 1. CHUẨN BỊ VPS

### Yêu cầu tối thiểu:
- **OS**: Ubuntu 20.04 LTS hoặc 22.04 LTS
- **RAM**: Tối thiểu 2GB (khuyến nghị 4GB)
- **CPU**: 2 cores
- **Disk**: 20GB trống
- **IP Public**: Có IP tĩnh

### Bước 1: Kết nối VPS

```bash
ssh root@YOUR_VPS_IP
# hoặc
ssh ubuntu@YOUR_VPS_IP
```

### Bước 2: Cập nhật hệ thống

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw
```

---

## 2. CÀI ĐẶT MÔI TRƯỜNG

### 2.1. Cài đặt Docker & Docker Compose

```bash
# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user vào docker group (nếu không dùng root)
sudo usermod -aG docker $USER
newgrp docker

# Cài đặt Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kiểm tra
docker --version
docker compose version
```

### 2.2. Cài đặt Node.js (nếu cần chạy migrations)

```bash
# Cài Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra
node --version
npm --version
```

### 2.3. Cài đặt Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2.4. Cài đặt Certbot (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 3. SETUP DOMAIN & DNS

### Bước 1: Cấu hình DNS tại nhà cung cấp domain

Vào control panel của domain provider (GoDaddy, Namecheap, Cloudflare, etc.) và thêm:

**Option 1: A Record (Khuyến nghị)**
```
Type: A
Name: url (hoặc @)
Value: YOUR_VPS_IP
TTL: 3600
```

**Option 2: CNAME (Nếu dùng Cloudflare)**
```
Type: CNAME
Name: url
Value: your-server.example.com
TTL: Auto
```

### Bước 2: Kiểm tra DNS đã propagate

```bash
# Kiểm tra từ VPS
nslookup url.npxofficial.com

# Hoặc từ máy local
ping url.npxofficial.com
```

**Lưu ý**: DNS có thể mất 5-30 phút để propagate.

---

## 4. DEPLOY ỨNG DỤNG

### Bước 1: Clone code lên VPS

```bash
# Tạo thư mục cho ứng dụng
sudo mkdir -p /var/www/tiny-url
sudo chown $USER:$USER /var/www/tiny-url
cd /var/www/tiny-url

# Clone repository (hoặc upload code)
git clone YOUR_REPO_URL .
# Hoặc dùng scp để upload từ máy local:
# scp -r ./tiny-url/* root@YOUR_VPS_IP:/var/www/tiny-url/
```

### Bước 2: Tạo file .env

```bash
cd /var/www/tiny-url
nano .env
```

Nội dung file `.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:CHANGE_THIS_PASSWORD@db:5432/tiny_url?schema=public"

# Domain
NEXT_PUBLIC_DOMAIN="https://url.npxofficial.com"

# Security
ADMIN_TOKEN="GENERATE_STRONG_RANDOM_TOKEN_HERE"
JWT_SECRET="GENERATE_LONG_RANDOM_STRING_HERE_AT_LEAST_32_CHARS"

# Optional
REDIS_URL=""
GEOIP_DB_PATH=""
```

**Tạo token mạnh:**
```bash
# Tạo ADMIN_TOKEN
openssl rand -hex 32

# Tạo JWT_SECRET
openssl rand -hex 64
```

### Bước 3: Cập nhật docker-compose.yml cho production

```bash
nano docker-compose.yml
```

Nội dung:

```yaml
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: tiny_url
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: CHANGE_THIS_PASSWORD
    volumes:
      - db-data:/var/lib/postgresql/data
    # Không expose port ra ngoài cho security
    # ports:
    #   - '5432:5432'

  web:
    build: .
    restart: unless-stopped
    env_file:
      - .env
    environment:
      NODE_ENV: production
    ports:
      - '127.0.0.1:3000:3000'  # Chỉ bind localhost
    depends_on:
      - db
    command: npm run start

volumes:
  db-data:
```

### Bước 4: Build và chạy ứng dụng

```bash
# Build Docker image
docker compose build

# Chạy migrations
docker compose run --rm web npx prisma migrate deploy

# Seed dữ liệu (tùy chọn)
docker compose run --rm web npm run prisma:seed

# Khởi động services
docker compose up -d

# Kiểm tra logs
docker compose logs -f
```

### Bước 5: Kiểm tra ứng dụng chạy

```bash
# Kiểm tra containers
docker compose ps

# Test local
curl http://localhost:3000

# Xem logs
docker compose logs web
```

---

## 5. CẤU HÌNH NGINX

### Bước 1: Tạo Nginx config

```bash
sudo nano /etc/nginx/sites-available/tiny-url
```

Nội dung:

```nginx
server {
    listen 80;
    server_name url.npxofficial.com;

    # Redirect HTTP to HTTPS (sẽ cấu hình sau khi có SSL)
    # return 301 https://$server_name$request_uri;

    # Tạm thời proxy đến app (trước khi có SSL)
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

    # Tăng timeout cho long requests
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### Bước 2: Enable site

```bash
# Tạo symlink
sudo ln -s /etc/nginx/sites-available/tiny-url /etc/nginx/sites-enabled/

# Xóa default site (tùy chọn)
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Bước 3: Kiểm tra

```bash
# Test từ VPS
curl -H "Host: url.npxofficial.com" http://localhost

# Test từ browser
# Mở: http://url.npxofficial.com
```

---

## 6. SETUP SSL VỚI LET'S ENCRYPT

### Bước 1: Lấy SSL certificate

```bash
# Dừng redirect HTTPS trong Nginx config trước
sudo certbot --nginx -d url.npxofficial.com

# Hoặc chỉ lấy cert (không tự động config)
sudo certbot certonly --nginx -d url.npxofficial.com
```

Certbot sẽ:
- Tự động cấu hình Nginx
- Tạo SSL certificate
- Setup auto-renewal

### Bước 2: Cập nhật Nginx config (nếu cần chỉnh thủ công)

```bash
sudo nano /etc/nginx/sites-available/tiny-url
```

Nội dung sau khi có SSL:

```nginx
server {
    listen 80;
    server_name url.npxofficial.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name url.npxofficial.com;

    ssl_certificate /etc/letsencrypt/live/url.npxofficial.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/url.npxofficial.com/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Logging
    access_log /var/log/nginx/tiny-url-access.log;
    error_log /var/log/nginx/tiny-url-error.log;
}
```

### Bước 3: Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 4: Test SSL

```bash
# Test từ command line
curl -I https://url.npxofficial.com

# Hoặc dùng online tool
# https://www.ssllabs.com/ssltest/analyze.html?d=url.npxofficial.com
```

### Bước 5: Auto-renewal (Đã tự động setup)

```bash
# Kiểm tra cron job
sudo certbot renew --dry-run

# Xem renewal schedule
sudo systemctl status certbot.timer
```

---

## 7. CẤU HÌNH FIREWALL

### Bước 1: Cấu hình UFW

```bash
# Cho phép SSH
sudo ufw allow 22/tcp

# Cho phép HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bật firewall
sudo ufw enable

# Kiểm tra status
sudo ufw status
```

### Bước 2: Khóa port 5432 (PostgreSQL)

PostgreSQL chỉ cần accessible từ trong Docker network, không cần expose ra ngoài.

---

## 8. KIỂM TRA VÀ MONITORING

### Kiểm tra ứng dụng

```bash
# 1. Test API
curl -X POST https://url.npxofficial.com/api/links \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"destination": "https://example.com"}'

# 2. Test redirect
curl -I https://url.npxofficial.com/r/docs

# 3. Kiểm tra admin page
# Mở: https://url.npxofficial.com/admin
```

### Monitoring

```bash
# Xem logs ứng dụng
docker compose logs -f web

# Xem logs Nginx
sudo tail -f /var/log/nginx/tiny-url-access.log
sudo tail -f /var/log/nginx/tiny-url-error.log

# Xem resource usage
docker stats

# Xem disk usage
df -h
docker system df
```

### Backup Database

```bash
# Tạo script backup
nano /root/backup-db.sh
```

Nội dung:

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker compose exec -T db pg_dump -U postgres tiny_url | gzip > $BACKUP_DIR/tiny_url_$DATE.sql.gz

# Xóa backups cũ hơn 7 ngày
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/tiny_url_$DATE.sql.gz"
```

```bash
chmod +x /root/backup-db.sh

# Thêm vào crontab (backup hàng ngày lúc 2h sáng)
crontab -e
# Thêm dòng:
0 2 * * * /root/backup-db.sh
```

### Auto-restart nếu container crash

Docker Compose đã có `restart: unless-stopped`, nhưng có thể thêm systemd service:

```bash
sudo nano /etc/systemd/system/tiny-url.service
```

Nội dung:

```ini
[Unit]
Description=Tiny URL Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/tiny-url
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable tiny-url
sudo systemctl start tiny-url
```

---

## 🔄 CẬP NHẬT ỨNG DỤNG

```bash
cd /var/www/tiny-url

# Pull code mới
git pull

# Rebuild và restart
docker compose build
docker compose run --rm web npx prisma migrate deploy
docker compose up -d

# Kiểm tra
docker compose logs -f
```

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: "Cannot connect to database"

```bash
# Kiểm tra database container
docker compose ps db
docker compose logs db

# Kiểm tra network
docker network ls
docker network inspect vaa-short-link_default
```

### Lỗi: "502 Bad Gateway"

```bash
# Kiểm tra app có chạy không
docker compose ps
curl http://127.0.0.1:3000

# Kiểm tra Nginx config
sudo nginx -t
sudo systemctl status nginx
```

### Lỗi: "SSL certificate expired"

```bash
# Renew certificate
sudo certbot renew

# Hoặc force renew
sudo certbot renew --force-renewal
```

### Lỗi: "Domain not resolving"

```bash
# Kiểm tra DNS
nslookup url.npxofficial.com
dig url.npxofficial.com

# Kiểm tra Nginx config
sudo nginx -t
```

---

## 📝 CHECKLIST DEPLOY

- [ ] VPS đã được setup và cập nhật
- [ ] Docker & Docker Compose đã cài đặt
- [ ] Nginx đã cài đặt và cấu hình
- [ ] DNS đã trỏ về VPS IP
- [ ] File .env đã được tạo với đúng thông tin
- [ ] Database password đã được đổi
- [ ] ADMIN_TOKEN đã được generate
- [ ] JWT_SECRET đã được generate
- [ ] Docker containers đã chạy
- [ ] Prisma migrations đã chạy
- [ ] Nginx đã được cấu hình
- [ ] SSL certificate đã được cài đặt
- [ ] Firewall đã được cấu hình
- [ ] Ứng dụng có thể truy cập qua HTTPS
- [ ] API hoạt động bình thường
- [ ] Admin dashboard có thể truy cập
- [ ] Backup script đã được setup

---

## 🎯 TÓM TẮT CÁC LỆNH QUAN TRỌNG

```bash
# Deploy lần đầu
cd /var/www/tiny-url
docker compose build
docker compose run --rm web npx prisma migrate deploy
docker compose up -d

# Xem logs
docker compose logs -f

# Restart
docker compose restart

# Update code
git pull
docker compose build
docker compose up -d

# Backup database
docker compose exec -T db pg_dump -U postgres tiny_url > backup.sql

# Renew SSL
sudo certbot renew
```

---

**Chúc bạn deploy thành công! 🚀**

Nếu gặp vấn đề, kiểm tra logs và đảm bảo tất cả services đang chạy.

