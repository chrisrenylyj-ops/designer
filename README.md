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

## Features

1. **Compress** — Drag & drop or select JPEG/PNG/WebP (up to 20MB). Adjust quality slider, then "Compress Image" to download.
2. **Convert** — Upload an image, choose output format (JPG, PNG, WebP, AVIF), then "Convert Now" to download.
3. **360°** — Upload an equirectangular panorama image. Drag to look around; use bottom controls for zoom in/out, reset view, and fullscreen.
4. **Lottie** — Upload a `.json` or `.lottie` file to preview. Use playback controls and "Export" to download.

## Stack

- React 18, React Router 6, TypeScript, Vite
- Tailwind CSS (Figma-aligned colors and spacing)
- Three.js (360 viewer), lottie-web (Lottie preview)
