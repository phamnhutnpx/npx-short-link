# 🚀 DEPLOY TỪ GITHUB

## Cách 1: Deploy trực tiếp từ GitHub (Khuyến nghị)

### Bước 1: Push code lên GitHub

**Trên máy local:**

```bash
# Khởi tạo git (nếu chưa có)
git init

# Thêm .gitignore nếu chưa có
cat > .gitignore << 'EOF'
node_modules
.next
out
.env
.env.local
.env.production
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-store
coverage
.DS_Store
.idea
.vscode
*.log
*.sqlite
EOF

# Thêm tất cả files
git add .

# Commit
git commit -m "Initial commit - Tiny URL project"

# Tạo repo trên GitHub (qua web hoặc GitHub CLI)
# Sau đó thêm remote và push
git remote add origin https://github.com/YOUR_USERNAME/tiny-url.git
git branch -M main
git push -u origin main
```

**Hoặc nếu đã có repo:**
```bash
git add .
git commit -m "Update code"
git push
```

### Bước 2: SSH vào VPS và clone code

```bash
# SSH vào VPS (dùng password nếu không có SSH key)
ssh ubuntu@npx-vps
# hoặc
ssh root@npx-vps

# Tạo thư mục và clone code
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/tiny-url.git
sudo chown -R $USER:$USER tiny-url
cd tiny-url
```

### Bước 3: Chạy script deploy tự động

```bash
chmod +x scripts/auto-deploy.sh
./scripts/auto-deploy.sh
```

## Cách 2: Setup SSH Key (Để không cần nhập password)

### Trên máy local:

```bash
# Tạo SSH key (nếu chưa có)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

### Trên VPS:

```bash
# SSH vào VPS (dùng password lần này)
ssh ubuntu@npx-vps

# Tạo thư mục .ssh nếu chưa có
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Thêm public key vào authorized_keys
nano ~/.ssh/authorized_keys
# Paste public key vào đây, sau đó save

# Set permissions
chmod 600 ~/.ssh/authorized_keys
```

### Sau đó từ máy local:

```bash
# Test SSH
ssh ubuntu@npx-vps

# Nếu thành công, có thể chạy lệnh từ xa
ssh ubuntu@npx-vps "cd /var/www/tiny-url && git pull"
```

## Cách 3: Deploy script tự động từ GitHub

Tạo script trên VPS để tự động pull và deploy:

```bash
# SSH vào VPS
ssh ubuntu@npx-vps

# Tạo script deploy
nano /home/ubuntu/deploy.sh
```

Nội dung script:

```bash
#!/bin/bash
set -e

PROJECT_DIR="/var/www/tiny-url"
cd $PROJECT_DIR

echo "🔄 Pulling latest code from GitHub..."
git pull origin main

echo "🔨 Rebuilding Docker images..."
docker compose -f docker-compose.prod.yml build

echo "🗄️ Running migrations..."
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy

echo "🚀 Restarting services..."
docker compose -f docker-compose.prod.yml up -d

echo "✅ Deploy completed!"
docker compose -f docker-compose.prod.yml ps
```

```bash
chmod +x /home/ubuntu/deploy.sh
```

Sau này chỉ cần chạy:
```bash
ssh ubuntu@npx-vps "/home/ubuntu/deploy.sh"
```

## Cách 4: Dùng GitHub Actions (Tự động deploy khi push)

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/tiny-url
            git pull origin main
            docker compose -f docker-compose.prod.yml build
            docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
            docker compose -f docker-compose.prod.yml up -d
```

Setup secrets trên GitHub:
- `VPS_HOST`: IP hoặc domain VPS
- `VPS_USER`: username (ubuntu hoặc root)
- `VPS_SSH_KEY`: Private SSH key

## 📝 HƯỚNG DẪN CHI TIẾT

### 1. Push code lên GitHub

```bash
# Trên máy local
cd /d/working/vaa-short-link

# Kiểm tra git status
git status

# Nếu chưa init git
git init
git add .
git commit -m "Initial commit"

# Tạo repo trên GitHub.com, sau đó:
git remote add origin https://github.com/YOUR_USERNAME/tiny-url.git
git branch -M main
git push -u origin main
```

### 2. Trên VPS - Clone và deploy

```bash
# SSH vào VPS (dùng password)
ssh ubuntu@npx-vps

# Cài đặt git nếu chưa có
sudo apt update
sudo apt install -y git

# Clone code
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/tiny-url.git
sudo chown -R $USER:$USER tiny-url
cd tiny-url

# Chạy script deploy
chmod +x scripts/auto-deploy.sh
./scripts/auto-deploy.sh
```

### 3. Cập nhật code sau này

**Trên máy local:**
```bash
git add .
git commit -m "Update code"
git push
```

**Trên VPS:**
```bash
ssh ubuntu@npx-vps
cd /var/www/tiny-url
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d
```

## 🔑 Setup SSH Key (Tùy chọn)

Nếu muốn không cần nhập password mỗi lần:

**Trên máy local (Windows):**
```bash
# Tạo SSH key
ssh-keygen -t ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

**Trên VPS:**
```bash
# SSH vào VPS (dùng password)
ssh ubuntu@npx-vps

# Tạo file authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste public key vào đây

chmod 600 ~/.ssh/authorized_keys
```

**Test:**
```bash
# Từ máy local
ssh ubuntu@npx-vps
# Nếu không cần nhập password = thành công
```

---

**Chọn cách phù hợp với bạn và làm theo! 🚀**

