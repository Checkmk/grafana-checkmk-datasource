import type { PluginOptions } from '@grafana/plugin-e2e';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig<PluginOptions>({
  testDir: './tests/e2e/tests',
  outputDir: './tests/results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  workers: 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    {
      name: 'e2e tests',
      testDir: './tests/e2e/tests',
      testMatch: ['**/*.test.ts'],
      dependencies: ['setup'],
    },
    {
      name: 'setup',
      testDir: './tests/e2e/tests',
      testMatch: 'global.setup.ts',
      teardown: 'tearDown',
    },
    {
      name: 'tearDown',
      testDir: './tests/e2e/tests',
      testMatch: 'global.teardown.ts',
    },
  ],
});
