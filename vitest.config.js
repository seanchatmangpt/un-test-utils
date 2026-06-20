import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test CLI Configuration - Use playground CLI (published version)
    env: {
      TEST_CLI_PATH: './playground/src/cli.mjs',
      TEST_CWD: process.cwd()
    },

    // Performance: Use threads for parallel execution with isolation
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
        useAtomics: true,
        maxThreads: 3,
        minThreads: 1
      }
    },

    // Coverage Configuration
    coverage: {
      provider: 'v8', // Faster than istanbul
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'test/**',
        'tests/**',
        'dist/**',
        'build/**',
        'playground/**',
        '**/*.config.js',
        '**/*.config.mjs',
        '**/types/**',
        '**/__snapshots__/**',
        '**/demo*.js',
        '**/demo*.mjs',
        '.claude-flow/**',
        '.hive-mind/**'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      },
      clean: true,
      cleanOnRerun: true
    },

    // Execution Settings
    globals: false, // Explicit imports for better tree-shaking
    environment: 'node',
    testTimeout: 120000, // 120s for Docker operations
    hookTimeout: 120000, // 120s for setup/teardown
    teardownTimeout: 120000,

    // File Patterns
    include: [
      'test/**/*.test.{js,mjs,ts}',
      'test/**/*.spec.{js,mjs,ts}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/playground/**',
      '**/__snapshots__/**',
      '**/citty-test-*/**'
    ],

    // Reporting
    reporters: ['verbose'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    },

    // Watch Mode Configuration
    watch: false,
    silent: false,

    // Execution Sequence
    sequence: {
      shuffle: false, // Deterministic order for debugging
      concurrent: false, // Disable concurrent test execution
      setupFiles: 'serial' // Run setup files serially
    },

    // Isolate Tests
    isolate: true,

    // Snapshot Configuration
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace(/\.test\.([jt]s|mjs)/, `${snapExtension}`)
    },

    // Setup Files
    setupFiles: ['./test/setup/test-defaults.mjs'],

    // Allow tests to be skipped based on environment
    passWithNoTests: true,

    // Retry Configuration (for flaky Docker tests)
    retry: 0 // Don't retry by default
  },

  // Resolve Configuration
  resolve: {
    alias: {
      '@': '/src',
      '@test': '/test',
      'citty-test-utils': new URL('./index.js', import.meta.url).pathname
    }
  }
})
