import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 项目站需设置 base 为 /仓库名/，本地开发留空即可
  base: process.env.BASE_PATH || '/',
})
