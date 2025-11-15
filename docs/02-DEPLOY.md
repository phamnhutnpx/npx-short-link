# 🚀 HƯỚNG DẪN DEPLOY TINY URL

## 📋 CHUẨN BỊ

- VPS Ubuntu (có IP public)
- Domain: `url.npxofficial.com` (hoặc domain của bạn)
- GitHub account (để lưu code)

---

## BƯỚC 1: PUSH CODE LÊN GITHUB (Máy local)

### 1.1. Khởi tạo git (nếu chưa có)
```bash
cd /d/working/vaa-short-link
git init
git add .
git commit -m "Initial commit"
```

### 1.2. Tạo repo trên GitHub
- Vào https://github.com → New repository
- Tên: `tiny-url`
- Click "Create repository"

### 1.3. Push code
```bash
git remote add origin https://github.com/YOUR_USERNAME/tiny-url.git
git branch -M main
git push -u origin main
```

**Thay `YOUR_USERNAME` bằng username GitHub của bạn!**

---

## BƯỚC 2: SSH VÀO VPS

```bash
ssh <vps>
# hoặc
ssh <root@vps>
```

**Nếu bị lỗi "Permission denied"**: Dùng password để SSH

---

## BƯỚC 3: CLONE CODE VÀ DEPLOY (Trên VPS)

### 3.1. Clone code từ GitHub
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/tiny-url.git
cd tiny-url
```

**Thay `YOUR_USERNAME` bằng username GitHub của bạn!**

### 3.2. Chạy script deploy tự động
```bash
chmod +x scripts/auto-deploy.sh
./scripts/auto-deploy.sh
```

**Script sẽ tự động:**
- ✅ Cài Docker, Docker Compose, Nginx, Certbot
- ✅ Tạo file .env với tokens ngẫu nhiên
- ✅ Build và chạy ứng dụng
- ✅ Cấu hình Nginx
- ✅ Setup SSL (nếu DNS đã trỏ đúng)

**Thời gian:** Khoảng 5-10 phút

---

## BƯỚC 4: CHẠY DATABASE MIGRATIONS (Sau khi containers đã chạy)

Sau khi Docker build thành công và containers đã start, cần chạy migrations:

```bash
# Vào thư mục project
cd ~/npx-short-link
# hoặc
cd /var/www/tiny-url

# Chạy migrations
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy

# Seed dữ liệu mẫu (tùy chọn)
docker compose -f docker-compose.prod.yml run --rm web npm run prisma:seed
```

**Kiểm tra containers đang chạy:**
```bash
docker compose -f docker-compose.prod.yml ps
```

Bạn sẽ thấy:
- ✅ `npx-short-link-db-1` - Database container (Healthy)
- ✅ `npx-short-link-web-1` - Web app container (Started)

---

## BƯỚC 5: KIỂM TRA ỨNG DỤNG

### 5.1. Kiểm tra app có chạy không
```bash
# Test local
curl http://localhost:3000

# Xem logs
docker compose -f docker-compose.prod.yml logs -f web
```

### 5.2. Lưu ADMIN_TOKEN
```bash
# Xem ADMIN_TOKEN (quan trọng!)
cat .env | grep ADMIN_TOKEN

# Lưu lại token này để vào admin sau
```

---

## BƯỚC 6: CẤU HÌNH DNS

### 6.1. Lấy IP VPS
```bash
curl ifconfig.me
```

### 6.2. Vào control panel domain (GoDaddy, Namecheap, Cloudflare, etc.)

### 6.3. Thêm A Record:
- **Type**: `A`
- **Name**: `url` (hoặc `@`)
- **Value**: `IP_VPS` (IP bạn vừa lấy)
- **TTL**: `3600`

### 6.4. Đợi DNS propagate (5-30 phút)

Kiểm tra:
```bash
nslookup url.npxofficial.com
```

---

## BƯỚC 7: CẤU HÌNH NGINX (Nếu chưa tự động)

### 7.1. Kiểm tra Nginx config đã tạo chưa

```bash
# Kiểm tra file config có tồn tại không
ls -la /etc/nginx/sites-available/tiny-url

# Xem nội dung file (nếu có)
cat /etc/nginx/sites-available/tiny-url

# Kiểm tra symlink đã tạo chưa
ls -la /etc/nginx/sites-enabled/ | grep tiny-url
```

**Nếu file chưa tồn tại hoặc rỗng (0 bytes)**, tiếp tục bước 7.2.

### 7.2. Tạo Nginx config

**Cách 1: Dùng lệnh đơn giản (Khuyến nghị)**

```bash
# Tạo file config
sudo bash -c 'cat > /etc/nginx/sites-available/tiny-url << "EOF"
server {
    listen 80;
    server_name url.npxofficial.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF'

# Enable site (tạo symlink)
sudo ln -sf /etc/nginx/sites-available/tiny-url /etc/nginx/sites-enabled/

# Xóa default site (nếu có)
sudo rm -f /etc/nginx/sites-enabled/default

# Test cấu hình
sudo nginx -t

# Nếu test thành công, reload Nginx
sudo systemctl reload nginx
```

**Cách 2: Dùng nano editor**

```bash
# Tạo file với nano
sudo nano /etc/nginx/sites-available/tiny-url
```

Sau đó paste nội dung sau vào:
```
server {
    listen 80;
    server_name url.npxofficial.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Nhấn `Ctrl+O` để save, `Enter` để confirm, `Ctrl+X` để thoát.

Sau đó:
```bash
# Enable site
sudo ln -sf /etc/nginx/sites-available/tiny-url /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 7.3. Kiểm tra lại sau khi tạo

```bash
# Kiểm tra file đã có nội dung chưa
cat /etc/nginx/sites-available/tiny-url

# Kiểm tra symlink
ls -la /etc/nginx/sites-enabled/ | grep tiny-url

# Kiểm tra Nginx status
sudo systemctl status nginx
```

---

## BƯỚC 7.5: XỬ LÝ XUNG ĐỘT PORT (Nếu port 3000 đã bị dùng)

### Kiểm tra port nào đang được dùng:

```bash
# Kiểm tra port 3000 đang được dùng bởi service nào
sudo lsof -i :3000
# hoặc
sudo netstat -tlnp | grep 3000
```

### Giải pháp: Đổi port cho tiny-url app

**Bước 1: Cập nhật docker-compose.prod.yml**

```bash
nano docker-compose.prod.yml
```

Tìm dòng `ports:` và đổi từ `3000:3000` sang port khác (ví dụ `3001:3000`):

```yaml
ports:
  - '127.0.0.1:3001:3000'  # Thay vì 3000:3000
```

**Bước 2: Cập nhật Nginx config**

```bash
sudo nano /etc/nginx/sites-available/tiny-url
```

Đổi `proxy_pass http://127.0.0.1:3000;` thành `proxy_pass http://127.0.0.1:3001;`

**Bước 3: Restart services**

```bash
# Restart Docker containers
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## BƯỚC 8: SETUP SSL/HTTPS (Trên VPS)

### 8.1. Kiểm tra Certbot đã cài chưa

```bash
which certbot
```

**Nếu chưa có:**
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2. Đảm bảo DNS đã trỏ đúng

```bash
# Kiểm tra DNS
nslookup url.npxofficial.com

# Phải trỏ về IP VPS của bạn
```

**Quan trọng:** DNS phải trỏ đúng trước khi chạy Certbot!

### 8.3. Chạy Certbot để lấy SSL certificate

```bash
sudo certbot --nginx -d url.npxofficial.com
```

**Quá trình:**
1. Nhập email (để nhận thông báo renewal)
2. Chọn "Y" để đồng ý Terms of Service
3. Chọn "Y" để share email với EFF (tùy chọn)
4. Chọn "2" để redirect HTTP → HTTPS (khuyến nghị)

### 8.4. Kiểm tra SSL

```bash
# Test từ VPS
curl -I https://url.npxofficial.com

# Hoặc test từ browser
# Mở: https://url.npxofficial.com
```

**Phải thấy:** Padlock icon và "Secure" trong browser

### 8.5. Kiểm tra auto-renewal

```bash
# Test renewal (dry-run)
sudo certbot renew --dry-run

# Xem renewal schedule
sudo systemctl status certbot.timer
```

**Certbot tự động renew certificate mỗi 90 ngày**

---

### 8.6. Nếu gặp lỗi "Domain not resolving"

**Nguyên nhân:** DNS chưa propagate hoặc trỏ sai

**Giải pháp:**
1. Kiểm tra DNS: `nslookup url.npxofficial.com`
2. Đợi 5-30 phút để DNS propagate
3. Thử lại: `sudo certbot --nginx -d url.npxofficial.com`

---

### 8.7. Nếu gặp lỗi "Failed to obtain certificate"

**Nguyên nhân có thể:**
- Port 80 bị chặn bởi firewall
- Nginx chưa chạy
- Domain trỏ sai

**Giải pháp:**
```bash
# Kiểm tra firewall
sudo ufw status

# Đảm bảo port 80/443 mở
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Kiểm tra Nginx
sudo systemctl status nginx

# Thử lại
sudo certbot --nginx -d url.npxofficial.com
```

---

## ✅ HOÀN THÀNH!

### Kiểm tra ứng dụng:
- **Trang chủ**: http://url.npxofficial.com (hoặc https:// sau khi setup SSL)
- **Admin**: http://url.npxofficial.com/admin

### Setup SSL/HTTPS:
👉 **Xem: [SETUP-SSL.md](./SETUP-SSL.md)** - Hướng dẫn setup SSL đầy đủ

**Lệnh nhanh:**
```bash
sudo certbot --nginx -d url.npxofficial.com
```

### Lưu thông tin quan trọng:
```bash
# Xem ADMIN_TOKEN (để vào admin)
cat .env | grep ADMIN_TOKEN
```

### 📋 Checklist kiểm tra đầy đủ:
👉 **Xem: [CHECKLIST-DEPLOY.md](./CHECKLIST-DEPLOY.md)** để kiểm tra tất cả các bước
👉 **Xem: [FINAL-CHECK.md](./FINAL-CHECK.md)** - Kiểm tra cuối cùng

---

## 🔧 CÁC LỆNH HỮU ÍCH

### Xem logs
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Restart ứng dụng
```bash
docker compose -f docker-compose.prod.yml restart
```

### Cập nhật code
```bash
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Xem trạng thái
```bash
docker compose -f docker-compose.prod.yml ps
```

---

## 🐛 XỬ LÝ LỖI

### Lỗi: "Permission denied" khi SSH
**Giải pháp:** Dùng password hoặc setup SSH key

### Lỗi: "Cannot connect to database"
```bash
docker compose -f docker-compose.prod.yml ps db
docker compose -f docker-compose.prod.yml logs db
```

### Lỗi: "502 Bad Gateway"
```bash
# Kiểm tra app có chạy không
docker compose -f docker-compose.prod.yml ps

# Kiểm tra Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Lỗi: "SSL certificate failed"
**Giải pháp:** Đảm bảo DNS đã trỏ đúng và đợi 5-10 phút

---

## 📝 TÓM TẮT CÁC BƯỚC

1. ✅ Push code lên GitHub (máy local)
2. ✅ SSH vào VPS
3. ✅ Clone code từ GitHub (VPS)
4. ✅ Chạy script deploy tự động (VPS)
5. ✅ **Chạy database migrations** (VPS) ⚠️ QUAN TRỌNG
6. ✅ Kiểm tra ứng dụng (VPS)
7. ✅ Cấu hình DNS (nhà cung cấp domain)
8. ✅ Cấu hình Nginx (nếu chưa tự động)
9. ✅ Setup SSL (VPS)

**Tổng thời gian:** ~15-20 phút

---

## 🎯 LÀM NGAY BÂY GIỜ

**Copy và chạy từng bước:**

### Trên máy local:
```bash
cd /d/working/vaa-short-link
git add .
git commit -m "Ready to deploy"
git push origin main
```

### Trên VPS:
```bash
ssh ubuntu@npx-vps
cd ~
git clone https://github.com/YOUR_USERNAME/tiny-url.git
cd tiny-url
chmod +x scripts/auto-deploy.sh
./scripts/auto-deploy.sh

# Sau khi build thành công, chạy migrations:
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy

# Kiểm tra containers:
docker compose -f docker-compose.prod.yml ps

# Lưu ADMIN_TOKEN:
cat .env | grep ADMIN_TOKEN
```

**Thay `YOUR_USERNAME` bằng username GitHub của bạn!**

---

**Chúc bạn deploy thành công! 🚀**

