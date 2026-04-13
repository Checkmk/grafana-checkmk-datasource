import { defineConfig } from 'eslint/config';

import baseConfig from './.config/eslint.config.mjs';

export default defineConfig([
  {
    ignores: [
      'dist/',
      '**/logs',
      '**/*.log',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/.pnpm-debug.log*',
      '**/node_modules/',
      '**/pids',
      '**/*.pid',
      '**/*.seed',
      '**/*.pid.lock',
      '**/lib-cov',
      '**/coverage',
      '**/dist/',
      '**/artifacts/',
      '**/work/',
      '**/ci/',
      'tests/results/',
      '**/playwright-report/',
      '**/blob-report/',
      'playwright/.cache/',
      'playwright/.auth/',
      '**/.idea',
      '**/.vscode',
      '**/.env',
      '**/local/',
      '**/.eslintcache',
    ],
  },
  ...baseConfig,
]);
