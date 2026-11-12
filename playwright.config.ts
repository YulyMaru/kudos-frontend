import { defineConfig, devices } from '@playwright/test';

const URL_BASE = 'http://localhost:4200';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: URL_BASE,
    locale: 'es-CO',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'movil', use: { ...devices['Pixel 7'] } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm start',
    url: URL_BASE,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
