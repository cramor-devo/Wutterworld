import { defineConfig, devices } from '@playwright/test';

const PORT = 5179;
// Avoids a @types/node dependency just for reading CI.
const CI = !!(globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.CI;

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: CI ? 1 : 0,
  reporter: CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
