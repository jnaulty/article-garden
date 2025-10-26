import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000, // 60s timeout for blockchain interactions
    hookTimeout: 120000, // 120s for setup/teardown (deployment)
    isolate: true,
    sequence: {
      concurrent: false, // Run tests sequentially to avoid nonce conflicts
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  },
});
