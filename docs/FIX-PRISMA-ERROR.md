# 🔧 XỬ LÝ LỖI PRISMA VÀ CONTAINER UNHEALTHY

## Vấn đề

1. Container web đang `unhealthy`
2. Prisma lỗi: `Could not parse schema engine response`
3. Warning về OpenSSL version

## Giải pháp

### Bước 1: Kiểm tra logs để xem lỗi chi tiết

```bash
# Xem logs của container web
docker compose -f docker-compose.prod.yml logs web

# Xem logs gần đây
docker compose -f docker-compose.prod.yml logs --tail=50 web
```

### Bước 2: Rebuild container với OpenSSL fix

Dockerfile đã được cập nhật để cài OpenSSL. Rebuild:

```bash
cd ~/npx-short-link

# Rebuild container
docker compose -f docker-compose.prod.yml build --no-cache web

# Restart containers
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Bước 3: Chạy migrations lại

```bash
# Chạy migrations
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy

# Nếu vẫn lỗi, thử generate Prisma Client trước
docker compose -f docker-compose.prod.yml run --rm web npx prisma generate
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
```

### Bước 4: Kiểm tra container health

```bash
# Xem status
docker compose -f docker-compose.prod.yml ps

# Nếu vẫn unhealthy, xem logs
docker compose -f docker-compose.prod.yml logs web | tail -20
```

### Bước 5: Test ứng dụng

```bash
# Test local
curl http://localhost:3001

# Xem response
curl -v http://localhost:3001
```

---

## Nếu vẫn còn lỗi

### Kiểm tra database connection

```bash
# Test kết nối database
docker compose -f docker-compose.prod.yml run --rm web npx prisma db pull
```

### Kiểm tra .env file

```bash
# Đảm bảo DATABASE_URL đúng
cat .env | grep DATABASE_URL
```

### Xóa và tạo lại containers

```bash
# Dừng và xóa containers
docker compose -f docker-compose.prod.yml down -v

# Rebuild và start lại
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Chạy migrations
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
```

---

**Sau khi fix, container sẽ healthy và Prisma sẽ hoạt động bình thường!**

