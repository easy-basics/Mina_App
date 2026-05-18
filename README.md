# 布行管理后台 MVP

前后端分离的布行（面料）管理后台：门店、系列、商品/SKU、布版/大货订单管理。

## 技术栈

- **admin**：Vue 3 + Vite + Element Plus + Pinia
- **api**：Express + Prisma 5 + MySQL
- **mini**：uni-app Vue 3 + Vite + Pinia（微信小程序 C 端）
- **鉴权**：JWT + bcrypt，登录限流与账号锁定

## 目录结构

```text
mina/
├── admin/          # 管理后台前端
├── api/            # 后端 API
├── mini/           # 微信小程序 (uni-app)
├── .env.example    # 环境变量示例
└── README.md
```

## 快速开始

### 1. 准备 MySQL

**常见报错**：`Authentication failed ... credentials for root are not valid`  
说明 `api/.env` 里 `DATABASE_URL` 的密码不对或未填写。本机 `root` 一般需要密码，不能写成 `mysql://root@localhost`（无密码）。

1. 确认你知道 MySQL `root` 密码（安装 Homebrew MySQL 时设置的）。若忘记，可重置：

```bash
# 停止 MySQL 后按 Homebrew 文档重置 root 密码，或：
brew services stop mysql
mysqld_safe --skip-grant-tables &
# 另开终端用 mysql 修改密码后重启服务
```

2. 创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS mina CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 配置环境变量：

```bash
cp .env.example api/.env
# 编辑 api/.env，把「你的MySQL密码」换成真实密码
```

```env
DATABASE_URL="mysql://root:你的真实密码@localhost:3306/mina"
```

4. 测试连接：

```bash
cd api
node scripts/check-db.js
```

### 2. 启动 API

```bash
cd api
npm install
npx prisma generate
npx prisma migrate deploy   # 或 migrate dev（开发环境）
npm run prisma:seed
npm run dev
```

API 默认：`http://localhost:3000`

### 3. 启动管理后台

```bash
cd admin
npm install
npm run dev
```

后台默认：`http://localhost:5173`

### 4. 启动小程序（可选）

```bash
cd mini
npm install
npm run dev
```

用微信开发者工具打开编译输出目录，详见 [mini/README.md](mini/README.md)。

本地登录无需微信 AppID 时，API 使用 `WECHAT_DEV_OPENID`（见 `api/.env`）。

### 5. 默认管理员

seed 后可用（以 `api/.env` 为准）：

- 用户名：`admin`
- 密码：`Admin@123456`（请上线前修改）

## 安全说明

- 登录：同 IP 15 分钟最多 10 次；连续 5 次密码错误锁定 30 分钟
- Token 存于 `sessionStorage`，有效期 2 小时
- 生产环境请修改 `JWT_SECRET`、`ADMIN_PASSWORD`，并配置 HTTPS 与 `CORS_ORIGIN`

## 生产构建

```bash
cd admin && npm run build
cd api && npm start
```

Nginx 建议：静态资源托管 `admin/dist`，`/api` 与 `/uploads` 反代到 Node 服务。
