import type { PluginOptions } from '@grafana/plugin-e2e';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig<PluginOptions>({
  testDir: './tests/e2e/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
    video: 'on',
    viewport: { width: 1920, height: 1080 },
    
  },
  projects: [
    {
      name: 'e2e tests',
      testDir: './tests/e2e/tests',
      testMatch: ['**/*.test.ts'],
    },
  ],
});
