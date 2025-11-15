# 📊 HƯỚNG DẪN XEM DATABASE

## 📍 DATABASE LƯU Ở ĐÂU?

### Với Docker (Mặc định)

Database được lưu trong **Docker Volume** có tên: `vaa-short-link_db-data`

**Vị trí thực tế trên Windows:**
```
\\wsl$\docker-desktop-data\data\docker\volumes\vaa-short-link_db-data\_data
```

Hoặc trong WSL2:
```
/var/lib/docker/volumes/vaa-short-link_db-data/_data
```

**Thông tin Database:**
- **Database name**: `tiny_url`
- **User**: `postgres`
- **Password**: `postgres`
- **Port**: `5432`
- **Host**: `localhost` (hoặc `db` nếu trong Docker network)

---

## 🔍 CÁC LỆNH XEM DATABASE

### 1. Kiểm tra Docker Volume (Nơi lưu data)

```bash
# Xem danh sách volumes
docker volume ls

# Xem chi tiết volume database
docker volume inspect vaa-short-link_db-data

# Xem kích thước volume
docker system df -v
```

### 2. Kiểm tra Container đang chạy

```bash
# Xem trạng thái containers
docker compose ps

# Xem logs database
docker compose logs db

# Xem logs real-time
docker compose logs -f db
```

### 3. Truy cập Database qua Adminer (Giao diện Web)

**Bước 1:** Đảm bảo Adminer đang chạy:
```bash
docker compose up -d adminer
```

**Bước 2:** Mở trình duyệt:
```
http://localhost:8080
```

**Bước 3:** Đăng nhập:
- **System**: `PostgreSQL`
- **Server**: `db` (hoặc `localhost` nếu chạy ngoài Docker)
- **Username**: `postgres`
- **Password**: `postgres`
- **Database**: `tiny_url`

### 4. Truy cập Database qua psql (Command Line)

**Cách 1: Vào container PostgreSQL**

```bash
# Vào container database
docker compose exec db psql -U postgres -d tiny_url

# Hoặc
docker exec -it vaa-short-link-db-1 psql -U postgres -d tiny_url
```

**Cách 2: Dùng psql từ máy host (nếu đã cài PostgreSQL client)**

```bash
psql -h localhost -U postgres -d tiny_url
# Password: postgres
```

### 5. Các lệnh SQL hữu ích

Sau khi vào psql, bạn có thể chạy:

```sql
-- Xem danh sách tables
\dt

-- Xem cấu trúc table
\d "Link"
\d "Click"
\d "User"

-- Xem tất cả links
SELECT * FROM "Link";

-- Xem tất cả clicks
SELECT * FROM "Click";

-- Đếm số links
SELECT COUNT(*) FROM "Link";

-- Đếm số clicks
SELECT COUNT(*) FROM "Click";

-- Xem links kèm số clicks
SELECT 
  l.slug, 
  l.destination, 
  l."clickCount",
  COUNT(c.id) as actual_clicks
FROM "Link" l
LEFT JOIN "Click" c ON c."linkId" = l.id
GROUP BY l.id, l.slug, l.destination, l."clickCount";

-- Xem top 10 links có nhiều clicks nhất
SELECT 
  slug, 
  destination, 
  "clickCount",
  "createdAt"
FROM "Link"
ORDER BY "clickCount" DESC
LIMIT 10;

-- Xem clicks gần đây
SELECT 
  c."createdAt",
  l.slug,
  c.ip,
  c.country,
  c."userAgent"
FROM "Click" c
JOIN "Link" l ON l.id = c."linkId"
ORDER BY c."createdAt" DESC
LIMIT 20;

-- Thoát psql
\q
```

### 6. Dùng Prisma Studio (Giao diện đẹp)

```bash
# Chạy Prisma Studio
npx prisma studio
```

Sau đó mở: **http://localhost:5555**

### 7. Backup Database

```bash
# Backup database
docker compose exec db pg_dump -U postgres tiny_url > backup.sql

# Hoặc với timestamp
docker compose exec db pg_dump -U postgres tiny_url > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 8. Restore Database

```bash
# Restore từ file backup
docker compose exec -T db psql -U postgres -d tiny_url < backup.sql
```

### 9. Xem kích thước database

```sql
-- Vào psql và chạy:
SELECT 
  pg_size_pretty(pg_database_size('tiny_url')) AS database_size;

-- Xem kích thước từng table
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 10. Reset Database (XÓA TẤT CẢ DATA)

⚠️ **CẢNH BÁO: Lệnh này sẽ xóa tất cả dữ liệu!**

```bash
# Dừng containers
docker compose down

# Xóa volume (xóa toàn bộ database)
docker volume rm vaa-short-link_db-data

# Khởi động lại và chạy migrations
docker compose up -d db
npm run prisma:migrate
npm run prisma:seed
```

---

## 📋 TÓM TẮT CÁC LỆNH THƯỜNG DÙNG

```bash
# 1. Xem database qua web (Adminer)
# Mở: http://localhost:8080

# 2. Xem database qua Prisma Studio
npx prisma studio

# 3. Vào database bằng psql
docker compose exec db psql -U postgres -d tiny_url

# 4. Xem logs database
docker compose logs -f db

# 5. Xem volume database
docker volume inspect vaa-short-link_db-data

# 6. Backup database
docker compose exec db pg_dump -U postgres tiny_url > backup.sql

# 7. Xem tables trong database
docker compose exec db psql -U postgres -d tiny_url -c "\dt"
```

---

## 🗂️ CẤU TRÚC DATABASE

Database có 3 bảng chính:

1. **User**: Lưu thông tin admin users
2. **Link**: Lưu thông tin các short links
3. **Click**: Lưu analytics (mỗi lần click vào link)

**Quan hệ:**
- User → Link (1-nhiều)
- Link → Click (1-nhiều)

---

## 💡 MẸO

1. **Dùng Prisma Studio** để xem database dễ nhất (giao diện đẹp, không cần biết SQL)
2. **Dùng Adminer** nếu muốn chạy SQL queries phức tạp
3. **Dùng psql** nếu quen command line
4. **Backup thường xuyên** trước khi thay đổi lớn

---

**Chúc bạn làm việc với database thành công! 🎉**

