import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom', // Lightweight DOM for React testing
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        'src/main.tsx', // Entry point, not worth testing
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 10,
        functions: 10,
        branches: 10,
        statements: 10,
        autoUpdate: true, // Will increase thresholds as coverage improves
      },
    },
    globals: true, // Enable global test APIs (describe, it, expect)
  },
});
