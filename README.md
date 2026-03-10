# Design

A web app with four tools: **Compress Image**, **Image Format Convert**, **360° Panorama Viewer**, and **Lottie Previewer**. UI follows the provided Figma design; all copy is in English and primary buttons use black (`#0f172a`).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Deploy（GitHub 上传与 Pages，控制在 25MB 以内）

- **仓库体积**：已通过 `.gitignore` 排除 `node_modules`（约 144MB）和 `dist`，只提交源码与配置，仓库体积约 **200KB**，远低于 25MB。
- **上线方式**：
  1. 将本项目推送到 GitHub 仓库（确保提交了 `package-lock.json`，否则 Actions 里 `npm ci` 会失败）。
  2. 仓库 **Settings → Pages**：**Build and deployment** 下 **Source** 选 **GitHub Actions**（不要选 “Deploy from a branch”，否则会直接拿源码当网站，出现 404）。
  3. 推送/合并到 `main` 或 `master` 后，到 **Actions** 页确认 “Deploy to GitHub Pages”  workflow 跑绿。
  4. 等待 1～2 分钟后访问：**`https://<你的用户名>.github.io/<仓库名>/`**（例如仓库名为 `design-app` 则为 `https://<username>.github.io/design-app/`，注意末尾斜杠和仓库名）。
- **若出现 404，请逐项检查**：
  - 是否把 **Source** 改成了 **GitHub Actions**（不是 “Deploy from a branch”）。
  - 访问地址是否带**仓库名**：`https://用户名.github.io/仓库名/`，而不是 `https://用户名.github.io/`。
  - **Actions** 里该 workflow 是否成功（有绿色勾）；若失败，看日志里是 `npm ci` 还是 build 报错。
  - 首次部署或改过 Pages 设置后，多等几分钟再刷新。

如需本地先构建再手动上传，可只上传 `dist` 目录内容（约 1MB），同样满足 25MB 限制。

## 自定义域名（GitHub Pages）

若希望用自己域名（如 `www.example.com`）访问站点，按下面做。

### 1. 在 GitHub 填写自定义域名

1. 打开仓库 **Settings → Pages**。
2. 在 **Custom domain** 输入框填你的域名（例如 `www.example.com` 或 `example.com`）。
3. 点 **Save**。  
   （若提示 DNS 未生效，先完成下面第 2 步再回来点 **Save** 或 **Enforce HTTPS**。）

### 2. 在域名服务商配置 DNS

到你购买域名的平台（阿里云、腾讯云、Cloudflare、GoDaddy 等）添加解析：

**若使用子域名（推荐，如 www.example.com）：**

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| CNAME | www | chrisrenylyj-ops.github.io |

**若使用根域名（example.com）：**

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

（主机记录为 `@` 表示根域名；四条 A 记录都要加。）

保存后等待几分钟到几十分钟生效（可多次刷新 Pages 里的 “Custom domain” 检查）。

### 3. 让站点用根路径构建（避免资源 404）

当前站点部署在 `https://用户名.github.io/仓库名/` 下，资源路径带 `/designer/`。换成自定义域名后，站点在域名根路径打开，必须用**根路径**构建，否则 JS/CSS 会 404。

1. 仓库 **Settings → Secrets and variables → Actions**。
2. 点 **Variables**，**New repository variable**：
   - Name：`USE_CUSTOM_DOMAIN`
   - Value：`true`
3. 保存后，到 **Actions** 里重新跑一次 **Deploy to GitHub Pages**（或随意改一个文件推送），新的部署会用根路径构建，自定义域名即可正常显示。

### 4. 开启 HTTPS（可选）

DNS 生效后，回到 **Settings → Pages**，若 **Enforce HTTPS** 可勾选，勾选即可。GitHub 会为你的域名申请证书，访问时自动走 HTTPS。

**说明**：开启自定义域名并设置 `USE_CUSTOM_DOMAIN=true` 后，`https://chrisrenylyj-ops.github.io/designer/` 可能无法正常打开（路径不一致）。若需同时保留 github.io 链接，可去掉 `USE_CUSTOM_DOMAIN` 变量，但自定义域名下需用「仅重定向到 github.io」等方式，或只保留一种访问方式。

## 部署到阿里云 OSS

### 方式一：GitHub Actions 自动部署（推荐）

1. **在阿里云创建 OSS 存储桶**
   - 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
   - 创建 Bucket，读写权限选 **公共读**（或私有 + 配合 CDN）
   - 在 Bucket 的 **基础设置** 里开启 **静态页面**：默认首页 `index.html`，默认 404 页 `404.html`
   - 记下 **Bucket 名称** 和 **Endpoint**（如 `oss-cn-hangzhou.aliyuncs.com`）

2. **创建 AccessKey 并配置 GitHub Secrets**
   - 阿里云控制台 → 右上角头像 → **AccessKey 管理** → 创建 AccessKey（保存 ID 和 Secret）
   - 在 GitHub 仓库 **Settings → Secrets and variables → Actions** 里新增：
     - `OSS_ACCESS_KEY_ID`：AccessKey ID  
     - `OSS_ACCESS_KEY_SECRET`：AccessKey Secret  
     - `OSS_BUCKET`：Bucket 名称  
     - `OSS_ENDPOINT`：Endpoint（如 `oss-cn-hangzhou.aliyuncs.com`）

3. **触发部署**
   - 推送到 `main` 或 `master` 分支后，**Actions** 里 “Deploy to Aliyun OSS” 会自动运行；也可在 Actions 页手动 **Run workflow**。

4. **访问网站**
   - 若未绑定自定义域名：`http://<Bucket名>.<Endpoint>/`  
     例如：`http://your-bucket.oss-cn-hangzhou.aliyuncs.com/`
   - 若在 OSS 控制台绑定了自己的域名并解析好，则用该域名访问；可配合 CDN 和 HTTPS 证书。

### 方式二：本地构建后手动上传

```bash
# 构建（根路径，适合 OSS）
BASE_PATH=/ npm run build
cp dist/index.html dist/404.html
```

然后在 OSS 控制台或使用 [ossutil](https://help.aliyun.com/document_detail/120075.html) 将 `dist` 目录下**所有文件**上传到 Bucket 根目录，并在 Bucket 中开启静态页面（默认首页 `index.html`，默认 404 页 `404.html`）。

## Features

1. **Compress** — Drag & drop or select JPEG/PNG/WebP (up to 20MB). Adjust quality slider, then "Compress Image" to download.
2. **Convert** — Upload an image, choose output format (JPG, PNG, WebP, AVIF), then "Convert Now" to download.
3. **360°** — Upload an equirectangular panorama image. Drag to look around; use bottom controls for zoom in/out, reset view, and fullscreen.
4. **Lottie** — Upload a `.json` or `.lottie` file to preview. Use playback controls and "Export" to download.

## Stack

- React 18, React Router 6, TypeScript, Vite
- Tailwind CSS (Figma-aligned colors and spacing)
- Three.js (360 viewer), lottie-web (Lottie preview)
