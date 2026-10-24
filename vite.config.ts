import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works under https://<user>.github.io/Wutterworld/
  base: './',
  build: {
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
