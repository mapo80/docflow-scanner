import { defineConfig, devices } from '@playwright/test'

const fakeCam = process.env.FAKE_CAM_Y4M

export default defineConfig({
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    permissions: ['camera'],
    launchOptions: {
      args: fakeCam ? [
        '--use-fake-device-for-media-stream',
        `--use-file-for-fake-video-capture=${fakeCam}`
      ] : []
    }
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
})
