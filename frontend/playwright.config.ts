import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const python = fileURLToPath(
  new URL(
    process.platform === 'win32' ? '../backend/env/Scripts/python.exe' : '../backend/env/bin/python',
    import.meta.url,
  ),
)
const manage = fileURLToPath(new URL('../backend/manage.py', import.meta.url))

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] }
      : {},
  },
  webServer: [
    {
      command: `"${python}" "${manage}" runserver --noreload 127.0.0.1:8000`,
      url: 'http://127.0.0.1:8000/api/dispositivo/',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
      url: 'http://127.0.0.1:5173/',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
