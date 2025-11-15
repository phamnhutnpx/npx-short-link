# 🔧 XỬ LÝ XUNG ĐỘT PORT VỚI N8N

## Vấn đề
n8n đang chạy trên port 3000, nên khi truy cập `url.npxofficial.com`, Nginx đang proxy đến n8n thay vì tiny-url app.

## Giải pháp: Đổi port cho tiny-url app

### Bước 1: Kiểm tra port đang được dùng

```bash
# Xem port 3000 đang được dùng bởi service nào
sudo lsof -i :3000
# hoặc
sudo netstat -tlnp | grep 3000
```

### Bước 2: Đổi port trong docker-compose.prod.yml

```bash
nano docker-compose.prod.yml
```

Tìm dòng:
```yaml
ports:
  - '127.0.0.1:3000:3000'
```

Đổi thành:
```yaml
ports:
  - '127.0.0.1:3001:3000'  # Port 3001 để tránh xung đột
```

Lưu file: `Ctrl+O`, `Enter`, `Ctrl+X`

### Bước 3: Cập nhật Nginx config

```bash
sudo nano /etc/nginx/sites-available/tiny-url
```

Tìm dòng:
```nginx
proxy_pass http://127.0.0.1:3000;
```

Đổi thành:
```nginx
proxy_pass http://127.0.0.1:3001;
```

Lưu file: `Ctrl+O`, `Enter`, `Ctrl+X`

### Bước 4: Restart services

```bash
# Dừng và khởi động lại containers
cd ~/npx-short-link
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Test và reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 5: Kiểm tra

```bash
# Kiểm tra tiny-url app đang chạy trên port 3001
curl http://localhost:3001

# Kiểm tra qua domain
curl -H "Host: url.npxofficial.com" http://localhost
```

---

**Sau khi làm xong, tiny-url sẽ chạy trên port 3001 và Nginx sẽ proxy đúng!**

