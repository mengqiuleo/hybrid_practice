import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { OfflinePackagePlugin } from './lib/plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    OfflinePackagePlugin({
      packageNameKey: 'packageId',
      packageNameValue: 'meeting',
      version: 1,
      baseUrl: 'http://192.168.1.7:3000/',
      fileTypes: ['html', 'js', 'css', 'png']
    })
  ],
  server: {
    host: '0.0.0.0'
  }
})
