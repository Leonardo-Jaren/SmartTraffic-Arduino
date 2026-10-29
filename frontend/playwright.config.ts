import { defineConfig } from '@playwright/test'

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
      command: `${process.platform === 'win32' ? '../backend/env/Scripts/python.exe' : '../backend/env/bin/python'} ../backend/manage.py runserver --noreload 127.0.0.1:8000`,
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
