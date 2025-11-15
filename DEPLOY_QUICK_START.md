# 🚀 QUICK START - DEPLOY LÊN VPS

## Bước nhanh để deploy lên VPS Ubuntu

### 1. Setup VPS (Chạy trên VPS)

```bash
# Upload code lên VPS
scp -r . root@YOUR_VPS_IP:/var/www/tiny-url

# SSH vào VPS
ssh root@YOUR_VPS_IP

# Chạy script setup
cd /var/www/tiny-url
chmod +x scripts/setup-vps.sh
./scripts/setup-vps.sh

# Logout và login lại để áp dụng docker group
exit
ssh root@YOUR_VPS_IP
```

### 2. Cấu hình DNS

Vào control panel domain và thêm:
```
Type: A
Name: url
Value: YOUR_VPS_IP
TTL: 3600
```

### 3. Tạo file .env

```bash
cd /var/www/tiny-url
nano .env
```

Nội dung:
```env
DATABASE_URL="postgresql://postgres:STRONG_PASSWORD@db:5432/tiny_url?schema=public"
NEXT_PUBLIC_DOMAIN="https://url.npxofficial.com"
ADMIN_TOKEN="$(openssl rand -hex 32)"
JWT_SECRET="$(openssl rand -hex 64)"
REDIS_URL=""
GEOIP_DB_PATH=""
```

### 4. Cập nhật docker-compose.prod.yml

```bash
nano docker-compose.prod.yml
```

Đổi `CHANGE_THIS_PASSWORD` thành password mạnh.

### 5. Deploy

```bash
# Build và chạy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d

# Kiểm tra
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

### 6. Cấu hình Nginx

```bash
# Copy config
sudo cp scripts/nginx-config.conf /etc/nginx/sites-available/tiny-url
sudo ln -s /etc/nginx/sites-available/tiny-url /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test và reload
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Setup SSL

```bash
sudo certbot --nginx -d url.npxofficial.com
```

### 8. Kiểm tra

Mở browser: https://url.npxofficial.com

---

## 📚 Xem hướng dẫn chi tiết

Xem file `HUONG_DAN_DEPLOY_VPS.md` để biết thêm chi tiết.

