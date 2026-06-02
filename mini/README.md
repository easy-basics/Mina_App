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

API 地址与图片域名通过环境变量区分：

| 变量 | 说明 | 开发 | 生产 |
|------|------|------|------|
| `VITE_API_BASE_URL` | 接口根路径 | `http://127.0.0.1:3000/api` | `https://api.mina.bigdeng.com/api` |
| `VITE_ASSET_BASE_URL` | 上传图片域名 | `http://127.0.0.1:3000` | `https://api.mina.bigdeng.com` |

| 命令 | 读取文件 |
|------|----------|
| `npm run dev` | `.env.development` |
| `npm run build` | `.env.production` |

小程序会将 `/uploads/...` 拼接到 `VITE_ASSET_BASE_URL`（生产强制 https）。  
服务端 `api/.env` 请同步设置 `API_PUBLIC_URL=https://api.mina.bigdeng.com`。

本地覆盖可复制 `mini/.env.example` 为 `.env.local`（见 Vite 文档）。

真机调试请将 `.env.development` 改为电脑局域网 IP，例如：

```env
API_PUBLIC_URL=http://192.168.1.10:3000
```

## 微信登录（本地）

未配置 `WECHAT_APPID` 时，API 使用 `WECHAT_DEV_OPENID` 模拟登录（见 `api/.env`）。

「我的」页使用 `open-type="chooseAvatar"` 选择头像。若开发者工具报 `chooseAvatar:fail api scope is not declared in the privacy agreement`，除重新编译小程序外，还必须在 **微信公众平台** 配置隐私指引：

1. 登录 [微信公众平台](https://mp.weixin.qq.com/) → **设置** → **服务内容声明** → **用户隐私保护指引**
2. 点击 **更新**，勾选并说明用途：**收集你选中的照片或视频信息**（头像）或指引中的「头像」相关项；若使用手机号、收货地址，一并声明对应类型
3. 保存后等待约 **5 分钟** 生效，再在开发者工具 **清除授权数据** 后重试

代码侧已启用 `__usePrivacyCheck__`，按钮使用 `chooseAvatar|agreePrivacyAuthorization` 与 `App.vue` 中的隐私监听。

## 支付（布版）

开发环境走 `POST /api/mini/pay/mock-success/:orderId` 模拟支付。生产需配置商户号后使用 `uni.requestPayment`。

## 生产上线

1. `manifest.json` 填写 `mp-weixin.appid`
2. 小程序后台配置 request 合法域名为 HTTPS API
3. `npm run build`，上传 `dist/build/mp-weixin`
