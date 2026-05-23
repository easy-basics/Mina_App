# 布行微信小程序 (uni-app)

Vue 3 + Vite + Pinia，对接 `api` 的 `/api/mini/*` 接口。

## 开发

```bash
# 终端 1：API
cd ../api && npm run dev

# 终端 2：小程序
cd mini
npm install
npm run dev
```

用微信开发者工具打开 **`mini/dist/build/mp-weixin`**（修改 `config.js` 后需执行 `npm run build` 再重新编译），勾选 **不校验合法域名**。

## 配置

API 地址通过环境变量区分（与 admin 一致）：

| 命令 | 环境文件 | 默认 API |
|------|----------|----------|
| `npm run dev` | `.env.development` | `http://127.0.0.1:3000/api` |
| `npm run build` | `.env.production` | `https://api.mina.bigdeng.com/api` |

本地覆盖可复制 `mini/.env.example` 为 `.env.local`（见 Vite 文档）。

真机调试请将 `.env.development` 改为电脑局域网 IP，例如 `http://192.168.1.10:3000/api`，并保证 `api/.env` 中：

```env
API_PUBLIC_URL=http://192.168.1.10:3000
```

## 微信登录（本地）

未配置 `WECHAT_APPID` 时，API 使用 `WECHAT_DEV_OPENID` 模拟登录（见 `api/.env`）。

## 支付（布版）

开发环境走 `POST /api/mini/pay/mock-success/:orderId` 模拟支付。生产需配置商户号后使用 `uni.requestPayment`。

## 生产上线

1. `manifest.json` 填写 `mp-weixin.appid`
2. 小程序后台配置 request 合法域名为 HTTPS API
3. `npm run build`，上传 `dist/build/mp-weixin`
