# ✅ CHECKLIST DEPLOY TINY URL

## 🔍 KIỂM TRA CÁC BƯỚC ĐÃ LÀM

### 1. ✅ Code đã được deploy
```bash
# Kiểm tra containers đang chạy
docker compose -f docker-compose.prod.yml ps
```
**Kết quả mong đợi:**
- ✅ `npx-short-link-db-1` - Healthy
- ✅ `npx-short-link-web-1` - Started

---

### 2. ✅ Database migrations đã chạy
```bash
# Kiểm tra migrations
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate status
```
**Nếu chưa chạy:**
```bash
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
```

---

### 3. ✅ Port đã được đổi (nếu có xung đột với n8n)
```bash
# Kiểm tra port 3001 đang được dùng
sudo lsof -i :3001
```

**Kiểm tra docker-compose.prod.yml:**
```bash
cat docker-compose.prod.yml | grep "3001:3000"
```
**Phải thấy:** `- '127.0.0.1:3001:3000'`

---

### 4. ✅ Nginx config đã đúng port
```bash
# Kiểm tra Nginx config
cat /etc/nginx/sites-available/tiny-url | grep proxy_pass
```
**Phải thấy:** `proxy_pass http://127.0.0.1:3001;` (không phải 3000)

---

### 5. ✅ Nginx đã được enable và reload
```bash
# Kiểm tra symlink
ls -la /etc/nginx/sites-enabled/ | grep tiny-url

# Test config
sudo nginx -t

# Kiểm tra Nginx đang chạy
sudo systemctl status nginx
```

---

### 6. ✅ DNS đã trỏ đúng
```bash
# Kiểm tra DNS từ VPS
nslookup url.npxofficial.com

# Hoặc
dig url.npxofficial.com
```
**Phải trỏ về IP VPS của bạn**

**Lưu ý:** Nếu dùng Cloudflare Proxy (orange cloud), có thể cần:
- Tắt Proxy (chuyển sang DNS only - gray cloud)
- Hoặc cấu hình Cloudflare để proxy đúng

---

### 7. ✅ Test ứng dụng local
```bash
# Test trên port 3001
curl http://localhost:3001

# Test qua Nginx
curl -H "Host: url.npxofficial.com" http://localhost
```

---

### 8. ✅ SSL đã được setup (nếu DNS đã trỏ đúng)
```bash
# Kiểm tra SSL certificate
sudo certbot certificates | grep url.npxofficial.com
```

**Nếu chưa có SSL:**
```bash
sudo certbot --nginx -d url.npxofficial.com
```

---

### 9. ✅ ADMIN_TOKEN đã được lưu
```bash
# Xem ADMIN_TOKEN
cat .env | grep ADMIN_TOKEN
```
**Lưu token này để vào admin!**

---

### 10. ✅ Test từ browser
- Mở: `http://url.npxofficial.com` (hoặc `https://` nếu đã có SSL)
- Phải thấy trang chủ tiny-url, không phải n8n
- Test tạo link
- Test vào admin: `http://url.npxofficial.com/admin`

---

## 🐛 CÁC VẤN ĐỀ THƯỜNG GẶP

### Vấn đề: Vẫn thấy n8n thay vì tiny-url

**Nguyên nhân có thể:**
1. Nginx chưa đổi port 3001
2. Docker containers chưa restart sau khi đổi port
3. Cloudflare đang proxy và cache

**Giải pháp:**
```bash
# 1. Kiểm tra và sửa Nginx config
sudo nano /etc/nginx/sites-available/tiny-url
# Đảm bảo: proxy_pass http://127.0.0.1:3001;

# 2. Restart containers
docker compose -f docker-compose.prod.yml restart web

# 3. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# 4. Clear Cloudflare cache (nếu dùng Cloudflare)
# Vào Cloudflare dashboard → Caching → Purge Everything
```

---

### Vấn đề: 502 Bad Gateway

**Kiểm tra:**
```bash
# 1. App có chạy không?
docker compose -f docker-compose.prod.yml ps web

# 2. Logs có lỗi gì?
docker compose -f docker-compose.prod.yml logs web

# 3. Port 3001 có đang listen?
sudo lsof -i :3001
```

---

### Vấn đề: Database connection error

**Kiểm tra:**
```bash
# 1. Database container có chạy?
docker compose -f docker-compose.prod.yml ps db

# 2. Migrations đã chạy?
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate status
```

---

## 📋 CHECKLIST NHANH

Copy và chạy từng lệnh để kiểm tra:

```bash
# 1. Containers
echo "=== Containers ===" && docker compose -f docker-compose.prod.yml ps

# 2. Port 3001
echo "=== Port 3001 ===" && sudo lsof -i :3001

# 3. Nginx config
echo "=== Nginx Config ===" && cat /etc/nginx/sites-available/tiny-url | grep proxy_pass

# 4. Nginx status
echo "=== Nginx Status ===" && sudo systemctl status nginx --no-pager | head -5

# 5. Test local
echo "=== Test Local ===" && curl -s http://localhost:3001 | head -20

# 6. DNS
echo "=== DNS ===" && nslookup url.npxofficial.com | grep -A 1 "Name:"
```

---

## ✅ HOÀN THÀNH KHI:

- ✅ Containers đang chạy
- ✅ Port 3001 đang được dùng bởi tiny-url
- ✅ Nginx config đúng port 3001
- ✅ DNS trỏ đúng IP VPS
- ✅ Truy cập `url.npxofficial.com` thấy tiny-url app (không phải n8n)
- ✅ Có thể tạo link và vào admin

---

**Nếu tất cả đều ✅, bạn đã deploy thành công! 🎉**

