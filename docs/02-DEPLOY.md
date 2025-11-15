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

## BƯỚC 4: CẤU HÌNH DNS

### 4.1. Lấy IP VPS
```bash
curl ifconfig.me
```

### 4.2. Vào control panel domain (GoDaddy, Namecheap, Cloudflare, etc.)

### 4.3. Thêm A Record:
- **Type**: `A`
- **Name**: `url` (hoặc `@`)
- **Value**: `IP_VPS` (IP bạn vừa lấy)
- **TTL**: `3600`

### 4.4. Đợi DNS propagate (5-30 phút)

Kiểm tra:
```bash
nslookup url.npxofficial.com
```

---

## BƯỚC 5: SETUP SSL (Trên VPS)

```bash
sudo certbot --nginx -d url.npxofficial.com
```

**Nhập email và chọn "Y" để đồng ý**

---

## ✅ HOÀN THÀNH!

### Kiểm tra ứng dụng:
- **Trang chủ**: https://url.npxofficial.com
- **Admin**: https://url.npxofficial.com/admin

### Lưu thông tin quan trọng:
```bash
# Xem ADMIN_TOKEN (để vào admin)
cat .env | grep ADMIN_TOKEN
```

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
5. ✅ Cấu hình DNS (nhà cung cấp domain)
6. ✅ Setup SSL (VPS)

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
```

**Thay `YOUR_USERNAME` bằng username GitHub của bạn!**

---

**Chúc bạn deploy thành công! 🚀**

