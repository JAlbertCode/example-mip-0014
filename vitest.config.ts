import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // ZK proving keys are large; give circuit calls room to run.
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
