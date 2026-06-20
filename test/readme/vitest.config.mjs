import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test configuration for README examples
    include: ['test/readme/**/*.test.mjs'],
    environment: 'node',
    timeout: 30000, // Longer timeout for Docker operations
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js', 'src/**/*.spec.js', 'src/**/test/**', 'src/**/tests/**'],
    },

    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],

    // Global setup
    globalSetup: ['./test/readme/setup.mjs'],

    // Test environment variables
    env: {
      TEST_CLI: 'true',
      NODE_ENV: 'test',
    },
  },
})

