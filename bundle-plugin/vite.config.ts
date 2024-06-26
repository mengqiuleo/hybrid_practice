import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { OfflinePackagePlugin } from './lib/plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    OfflinePackagePlugin({
      packageNameKey: 'packageId',
      packageNameValue: 'package', // package名
      version: 2, // 需要每次手动更新
      baseUrl: 'http://192.168.1.7:3000/',
      fileTypes: ['html', 'js', 'css', 'png'],
      folderName: 'main' // 打包后的 ZIP 名称
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 8991
  }
})
