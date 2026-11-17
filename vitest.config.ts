import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/**/*.test.ts', 'packages/**/*.test.ts'],
    environment: 'node',
    coverage: { include: ['apps/*/src/**/*.ts', 'packages/*/src/**/*.ts'] },
  },
});
