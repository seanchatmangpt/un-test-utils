/**
 * Example vitest.config.js for citty-test-utils v1.0.0
 *
 * This config enables automatic CLI testing configuration.
 * No need to specify cliPath in every test!
 */

export default {
  test: {
    // citty-test-utils configuration
    citty: {
      // Path to your CLI entry point (REQUIRED)
      cliPath: './src/cli.mjs',

      // Working directory (defaults to process.cwd())
      cwd: process.cwd(),

      // Cleanroom (Docker) configuration
      cleanroom: {
        // Enable cleanroom mode (defaults to false)
        // When true, all tests run in isolated Docker containers
        enabled: false,

        // Docker image to use
        image: 'node:20-alpine',

        // Timeout for cleanroom operations (ms)
        timeout: 30000,

        // Additional environment variables
        env: {
          NODE_ENV: 'test'
        }
      }
    },

    // Standard vitest config
    globals: true,
    environment: 'node',
    testTimeout: 30000
  }
}
