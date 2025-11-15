# 📖 HƯỚNG DẪN SỬ DỤNG TINY-URL

## ✅ Kết quả kiểm tra

✅ **TypeScript compilation**: PASS  
✅ **Next.js build**: PASS  
✅ **Tests**: 3/3 tests PASS  
✅ **File .env**: Đã tạo tự động

## 🚀 CÁCH CHẠY DỰ ÁN

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Tạo file .env (ĐÃ TỰ ĐỘNG TẠO)

File `.env` đã được tạo với nội dung:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tiny_url?schema=public"
NEXT_PUBLIC_DOMAIN="http://localhost:3000"
ADMIN_TOKEN="dev-admin-token-12345"
JWT_SECRET="dev-jwt-secret-key-change-in-production-12345678901234567890"
REDIS_URL=""
GEOIP_DB_PATH=""
```

### Bước 3: Khởi động PostgreSQL với Docker

**Cách 1: Dùng docker-compose (Khuyến nghị)**

```bash
docker compose up -d db
```

Hoặc chạy tất cả services (PostgreSQL + Adminer + App):

```bash
npm run docker:up
```

**Cách 2: Cài PostgreSQL trực tiếp**

Nếu bạn đã có PostgreSQL chạy sẵn, đảm bảo:
- Database: `tiny_url`
- User: `postgres`
- Password: `postgres`
- Port: `5432`

### Bước 4: Chạy Prisma migrations

```bash
npm run prisma:migrate
```

Hoặc:

```bash
npx prisma migrate dev
```

### Bước 5: Seed dữ liệu mẫu (Tùy chọn)

```bash
npm run prisma:seed
```

Dữ liệu mẫu sẽ tạo:
- Admin user: `admin@tiny-url.local` / `ChangeMe123!`
- 2 link mẫu: `/r/docs`, `/r/launch`

### Bước 6: Chạy ứng dụng

**Development mode:**

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:3000**

**Production mode:**

```bash
npm run build
npm start
```

## 📱 SỬ DỤNG ỨNG DỤNG

### 1. Tạo short link (Giao diện web)

1. Mở trình duyệt: http://localhost:3000
2. Điền form:
   - **Destination URL**: URL đích (bắt buộc)
   - **Custom slug**: Slug tùy chỉnh (tùy chọn, 4-64 ký tự)
   - **Expiration**: Ngày hết hạn (tùy chọn)
   - **Title**: Tiêu đề (tùy chọn)
   - **UTM parameters**: Tham số UTM (tùy chọn)
3. Click "Create short link"
4. Copy short URL được tạo

### 2. Truy cập short link

Mở trình duyệt và truy cập:
```
http://localhost:3000/r/{slug}
```

Ví dụ: `http://localhost:3000/r/docs`

### 3. Admin Dashboard

1. Truy cập: http://localhost:3000/admin
2. Nhập admin token: `dev-admin-token-12345` (từ file .env)
3. Xem danh sách links, analytics, xóa links

### 4. Sử dụng API

**Tạo link qua API:**

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -H "x-admin-token: dev-admin-token-12345" \
  -d '{
    "destination": "https://example.com",
    "slug": "example",
    "title": "Example Link"
  }'
```

**Lấy danh sách links:**

```bash
curl -X GET http://localhost:3000/api/links \
  -H "x-admin-token: dev-admin-token-12345"
```

**Xem analytics của một link:**

```bash
curl -X GET http://localhost:3000/api/links/example/analytics \
  -H "x-admin-token: dev-admin-token-12345"
```

**Xóa link:**

```bash
curl -X DELETE http://localhost:3000/api/links/example \
  -H "x-admin-token: dev-admin-token-12345"
```

## 🧪 CHẠY TESTS

```bash
npm test
```

Kết quả: ✅ 3/3 tests PASS

## 🐳 DOCKER COMMANDS

**Khởi động tất cả services:**
```bash
npm run docker:up
# hoặc
docker compose up --build
```

**Dừng services:**
```bash
npm run docker:down
# hoặc
docker compose down
```

**Chỉ khởi động database:**
```bash
docker compose up -d db
```

**Xem logs:**
```bash
docker compose logs -f web
```

## 🔧 CÁC LỆNH HỮU ÍCH

```bash
# Generate Prisma Client
npm run prisma:generate

# Chạy migrations
npm run prisma:migrate

# Seed dữ liệu
npm run prisma:seed

# Build production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Chạy tests
npm test
```

## 📊 TRUY CẬP DATABASE

**Với Adminer (nếu dùng docker-compose):**

1. Mở: http://localhost:8080
2. Đăng nhập:
   - System: `PostgreSQL`
   - Server: `db`
   - Username: `postgres`
   - Password: `postgres`
   - Database: `tiny_url`

**Với psql:**

```bash
psql -h localhost -U postgres -d tiny_url
```

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Admin Token**: Đổi `ADMIN_TOKEN` trong file `.env` trước khi deploy production
2. **Database Password**: Đổi password PostgreSQL trong production
3. **HTTPS**: Cấu hình HTTPS cho production domain
4. **Rate Limiting**: Mặc định 60 requests/giờ/IP (có thể cấu hình Redis)
5. **GeoIP**: Hiện tại country lookup trả về `null`, có thể tích hợp MaxMind sau

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

**Lỗi: "Cannot connect to database"**
- Kiểm tra PostgreSQL đã chạy chưa: `docker compose ps`
- Kiểm tra `DATABASE_URL` trong file `.env`
- Đảm bảo port 5432 không bị chiếm

**Lỗi: "Prisma Client not generated"**
- Chạy: `npm run prisma:generate`

**Lỗi: "Rate limit exceeded"**
- Đợi 1 giờ hoặc reset bằng cách restart server

**Lỗi: "Slug already exists"**
- Chọn slug khác hoặc để trống để tự động generate

## 📝 CẤU TRÚC DỰ ÁN

```
tiny-url/
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions
│   ├── admin/             # Admin page
│   ├── api/               # API routes
│   └── r/                 # Redirect handler
├── components/            # React components
├── lib/                   # Utilities
├── prisma/                # Prisma schema & migrations
├── __tests__/             # Tests
└── public/                # Static files
```

## 🎯 TÍNH NĂNG CHÍNH

✅ Tạo short link với custom slug hoặc auto-generate  
✅ Redirect với 301 status  
✅ Log analytics (IP, user-agent, referrer, country)  
✅ Admin dashboard với token authentication  
✅ RESTful API với rate limiting  
✅ Expiration date cho links  
✅ UTM parameters support  
✅ Security headers  
✅ Docker support  

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. Logs: `docker compose logs`
2. Database connection: `psql` hoặc Adminer
3. Environment variables: File `.env`
4. Port conflicts: Đảm bảo 3000, 5432, 8080 không bị chiếm

---

**Chúc bạn sử dụng thành công! 🚀**

