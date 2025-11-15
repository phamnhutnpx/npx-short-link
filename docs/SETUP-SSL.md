# 🔒 HƯỚNG DẪN SETUP SSL/HTTPS

## ✅ ĐIỀU KIỆN

- ✅ Domain đã trỏ đúng về VPS IP
- ✅ Nginx đã cấu hình và chạy
- ✅ App đã chạy trên port 3001
- ✅ Có thể truy cập `http://url.npxofficial.com`

---

## 📋 CÁC BƯỚC SETUP SSL

### Bước 1: Cài đặt Certbot (Nếu chưa có)

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### Bước 2: Kiểm tra DNS đã trỏ đúng

```bash
# Kiểm tra DNS
nslookup url.npxofficial.com
dig url.npxofficial.com

# Phải trỏ về IP VPS của bạn
```

**Quan trọng:** DNS phải trỏ đúng trước khi chạy Certbot!

### Bước 3: Đảm bảo Firewall mở port 80/443

```bash
# Kiểm tra firewall
sudo ufw status

# Mở port nếu chưa mở
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Bước 4: Chạy Certbot

```bash
sudo certbot --nginx -d url.npxofficial.com
```

**Quá trình:**
1. **Email:** Nhập email của bạn (để nhận thông báo renewal)
2. **Terms:** Chọn "Y" để đồng ý
3. **Share email:** Chọn "Y" hoặc "N" (tùy chọn)
4. **Redirect HTTP → HTTPS:** Chọn "2" (khuyến nghị)

Certbot sẽ:
- ✅ Tự động tạo SSL certificate
- ✅ Cập nhật Nginx config để dùng HTTPS
- ✅ Setup auto-renewal

### Bước 5: Kiểm tra SSL

```bash
# Test từ VPS
curl -I https://url.npxofficial.com

# Test từ browser
# Mở: https://url.npxofficial.com
```

**Phải thấy:**
- ✅ Padlock icon trong browser
- ✅ "Secure" hoặc "Connection is secure"
- ✅ URL bắt đầu với `https://`

### Bước 6: Kiểm tra auto-renewal

```bash
# Test renewal (không thực sự renew)
sudo certbot renew --dry-run

# Xem renewal schedule
sudo systemctl status certbot.timer
```

**Certbot tự động renew certificate mỗi 90 ngày**

---

## 🔧 XỬ LÝ LỖI

### Lỗi: "Domain not resolving"

**Nguyên nhân:** DNS chưa trỏ đúng hoặc chưa propagate

**Giải pháp:**
```bash
# Kiểm tra DNS
nslookup url.npxofficial.com

# Đợi 5-30 phút để DNS propagate
# Thử lại
sudo certbot --nginx -d url.npxofficial.com
```

### Lỗi: "Failed to obtain certificate"

**Nguyên nhân:** Port 80 bị chặn hoặc Nginx chưa chạy

**Giải pháp:**
```bash
# Kiểm tra firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Kiểm tra Nginx
sudo systemctl status nginx
sudo systemctl start nginx

# Thử lại
sudo certbot --nginx -d url.npxofficial.com
```

### Lỗi: "Address already in use"

**Nguyên nhân:** Port 80/443 đã được dùng bởi service khác

**Giải pháp:**
```bash
# Xem port 80 đang được dùng bởi gì
sudo lsof -i :80

# Nếu không phải Nginx, dừng service đó
```

---

## 📝 SAU KHI SETUP SSL

### Nginx config sẽ được tự động cập nhật

Certbot sẽ thêm vào config:
- SSL certificate paths
- Redirect HTTP → HTTPS
- SSL security headers

### Kiểm tra config sau khi setup

```bash
cat /etc/nginx/sites-available/tiny-url
```

**Phải thấy:**
- `listen 443 ssl;`
- `ssl_certificate /etc/letsencrypt/live/url.npxofficial.com/fullchain.pem;`
- `ssl_certificate_key /etc/letsencrypt/live/url.npxofficial.com/privkey.pem;`
- `return 301 https://$server_name$request_uri;` (cho HTTP)

---

## ✅ HOÀN THÀNH!

Sau khi setup SSL:
- ✅ Truy cập: `https://url.npxofficial.com`
- ✅ Browser hiển thị padlock icon
- ✅ Certificate tự động renew mỗi 90 ngày

---

**Chúc bạn setup SSL thành công! 🔒**

