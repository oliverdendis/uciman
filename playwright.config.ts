import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { baseURL: `http://localhost:${PORT}`, viewport: { width: 1366, height: 768 } },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 768 } } },
  ],
  // testuje sa produkčný build – to isté, čo pôjde na Vercel aj na USB
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
