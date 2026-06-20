/**
 * Playground vitest.config.js for citty-test-utils v1.0.0
 */

export default {
  test: {
    // citty-test-utils v1.0.0 configuration
    citty: {
      cliPath: './src/cli.mjs',
      cwd: process.cwd(),
      cleanroom: {
        enabled: false  // Set to true for Docker isolation
      }
    },
    setupFiles: ['./test/setup.mjs'],
    // Standard vitest config
    globals: true,
    environment: 'node',
    testTimeout: 30000
  }
}
