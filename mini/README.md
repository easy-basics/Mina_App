# 布行微信小程序 (uni-app)

Vue 3 + Vite + Pinia，对接 `api` 的 `/api/mini/*` 接口。

## 开发

### 微信小程序

```bash
# 终端 1：API
cd ../api && npm run dev

# 终端 2：小程序
cd mini
npm install
npm run dev
```

用微信开发者工具打开 **`mini/dist/build/mp-weixin`**（修改 `config.js` 后需执行 `npm run build` 再重新编译），勾选 **不校验合法域名**。

### H5 浏览器调试（免登录）

适合在本地浏览器中调试页面布局，无需微信开发者工具：

```bash
# 终端 1：API（需配置 WECHAT_DEV_OPENID，见 api/.env）
cd ../api && npm run dev

# 终端 2：H5
cd mini
npm run dev:h5
# 浏览器打开 http://localhost:5173
```

H5 开发模式会自动调用 `/api/mini/auth/wechat` 换取 token，并注入模拟用户资料（头像、姓名、手机号等），跳过微信登录步骤。可通过 `.env.development` 中的 `VITE_DEV_AUTO_LOGIN=false` 关闭。

微信专属能力（`chooseAvatar`、`getPhoneNumber`、`chooseAddress`）在 H5 中仍提示「请在微信小程序中使用」，不影响 UI 布局调试。

## 配置

API 地址与图片域名通过环境变量区分：

| 变量 | 说明 | 开发 | 生产 |
|------|------|------|------|
| `VITE_API_BASE_URL` | 接口根路径 | `http://127.0.0.1:3000/api` | `https://api.mina.bigdeng.com/api` |
| `VITE_ASSET_BASE_URL` | 上传图片域名 | `http://127.0.0.1:3000` | `https://api.mina.bigdeng.com` |

| 命令 | 读取文件 |
|------|----------|
| `npm run dev` | `.env.development` |
| `npm run dev:h5` | `.env.development` |
| `npm run build` | `.env.production` |
| `npm run build:h5` | `.env.production` |

H5 开发专用变量（仅 `import.meta.env.DEV` 且浏览器环境生效）：

| 变量 | 说明 | 默认 |
|------|------|------|
| `VITE_DEV_AUTO_LOGIN` | 是否自动登录 | `true` |
| `VITE_DEV_MOCK_AVATAR` | 模拟头像 | `/static/logo.svg` |
| `VITE_DEV_MOCK_REAL_NAME` | 模拟姓名 | `开发用户` |
| `VITE_DEV_MOCK_PHONE` | 模拟手机号 | `13800000000` |
| `VITE_DEV_MOCK_COMPANY` | 模拟公司名 | `开发公司` |

小程序会将 `/uploads/...` 拼接到 `VITE_ASSET_BASE_URL`（生产强制 https）。  
服务端 `api/.env` 请同步设置 `API_PUBLIC_URL=https://api.mina.bigdeng.com`。

本地覆盖可复制 `mini/.env.example` 为 `.env.local`（见 Vite 文档）。

真机调试请将 `.env.development` 改为电脑局域网 IP，例如：

```env
VITE_API_BASE_URL=http://192.168.1.10:3000/api
VITE_ASSET_BASE_URL=http://192.168.1.10:3000
```

### 微信头像（chooseAvatar）

「我的」页登录与个人资料页换头像时，`chooseAvatar` 返回微信 CDN 地址（如 `https://thirdwx.qlogo.cn/...`），小程序直接 `PUT /profile` 保存该 URL，**不上传文件到自有服务器**。

体验版/正式版需在 [微信公众平台](https://mp.weixin.qq.com/) → 开发 → 开发管理 → 开发设置 → 服务器域名，配置 **downloadFile 合法域名**（`<image>` 加载外链）：

- `https://thirdwx.qlogo.cn`
- （可选）`https://wx.qlogo.cn`、`https://mmbiz.qpic.cn`

头像登录**不需要**配置 uploadFile 合法域名；商品图等本地上传仍走 `/mini/upload`，需单独配置 uploadFile。

## 微信登录（本地）

未配置 `WECHAT_APPID` 时，API 使用 `WECHAT_DEV_OPENID` 模拟登录（见 `api/.env`）。

### 隐私保护指引（errno 112 必看）

`getPhoneNumber:fail api scope is not declared in the privacy agreement` 表示：**后台隐私指引里未声明「手机号」，或未审核通过**。仅保存不够，须审核生效。

1. [微信公众平台](https://mp.weixin.qq.com/) → **设置** → **服务内容声明** → **用户隐私保护指引** → **更新**
2. 勾选本小程序实际用到的类型（缺一不可）：
   - **手机号**（`getPhoneNumber` / 一键填写）
   - **收集你选中的照片或视频信息**（`chooseAvatar` 头像）
   - **收货地址**（`chooseAddress`）
3. 填写用途说明 → **提交**，等待 **审核通过**（常见 5 分钟～1 个工作日）
4. 若走发版：**管理** → **版本管理** → 提审页的「用户隐私保护设置」也需与代码一致
5. 微信开发者工具：**清缓存 → 清除授权数据**，重新编译后再点「一键填写」

**限制：** 个人主体小程序不支持 `getPhoneNumber`；须企业认证。开发期可手输手机号，或配置 `WECHAT_DEV_PHONE`（无 AppID 时 API 走 mock）。

代码侧：`__usePrivacyCheck__: true`，按钮为 `getPhoneNumber|agreePrivacyAuthorization` / `chooseAvatar|agreePrivacyAuthorization`。

## 支付（布版）

开发环境走 `POST /api/mini/pay/mock-success/:orderId` 模拟支付。生产需配置商户号后使用 `uni.requestPayment`。

**体验版/正式版必须满足：**

1. 生产 API 的 `api/.env` 中 `NODE_ENV=production`（须与 `production` 完全一致，改后必须重启进程）
2. 微信支付 V3 全套变量已写入服务器 `api/.env`：`WECHAT_MCH_ID`、`WECHAT_MCH_SERIAL_NO`、`WECHAT_PAY_API_KEY`、`WECHAT_MCH_PRIVATE_KEY_PATH`、`WECHAT_MCH_CERT_PATH`
3. 证书文件须手动上传到服务器（`api/certs/` 在 gitignore 中，不会随代码部署）：
   ```bash
   scp api/certs/apiclient_key.pem api/certs/apiclient_cert.pem user@server:/path/to/mina/api/certs/
   ```
4. 在服务器执行 `cd api && npm run verify:pay`，确认返回真实 `prepay_id`
5. 检查 `curl https://api.mina.bigdeng.com/api/health`，`payEnabled` 应为 `true`
6. 重新 `npm run build` 上传体验版

若报错「微信支付未启用」，health 接口的 `payDisableReasons` 会列出具体缺失项。

## 生产上线

1. `manifest.json` 填写 `mp-weixin.appid`
2. 小程序后台配置 request 合法域名为 HTTPS API；downloadFile 合法域名含 `https://thirdwx.qlogo.cn`（微信头像 CDN）
3. `npm run build`，上传 `dist/build/mp-weixin`
