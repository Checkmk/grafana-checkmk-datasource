import type { PluginOptions } from '@grafana/plugin-e2e';
import { defineConfig } from '@playwright/test';
import { dirname } from 'path';

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig<PluginOptions>({
  testDir: './tests/e2e/tests',
  outputDir: './tests/results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  expect: {
    timeout: 20_000,
  },
  timeout: 60_000,
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
    testIdAttribute: 'data-test-id',
    baseURL: process.env.PLAYWRIGHT_TO_GRAFANA_URL || 'http://localhost:3003',
    grafanaAPICredentials: {
      user: process.env.GRAFANA_USER || 'admin',
      password: process.env.GRAFANA_PASSWORD || 'admin',
    },
  },
  projects: [
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    {
      name: 'tests',
      testDir: './tests/e2e/tests',
      testMatch: ['**/*.test.ts'],
      use: {
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup', 'auth'],
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
