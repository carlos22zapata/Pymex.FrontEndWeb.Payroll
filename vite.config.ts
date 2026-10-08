import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), 'VITE_')

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    envDir: path.resolve(__dirname, '../..'),
    server: {
      port: parseInt(env.VITE_PAYROLL_APP_PORT || '7300'),
    },
  }
})
