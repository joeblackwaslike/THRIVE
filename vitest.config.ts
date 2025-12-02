import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    watch: false,
    environment: 'node',
    setupFiles: ['./api/tests/setup.ts'],
    include: ['api/tests/**/*.test.ts'],
    testTimeout: 10000, // 10 second timeout
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'api/tests/', '**/*.d.ts', '**/*.config.ts', '**/mockData.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './api'),
    },
  },
});
