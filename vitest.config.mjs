import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    pool: 'forks',
    include: [
      'test/**/*.{test,spec}.{js,mjs}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.claude/worktrees/**',
      '**/citty-test-utils/**',
      '**/playground/**',
      '**/scratch/**',
      '**/test/enterprise/**',
      '**/test/compliance/**',
      '**/test/performance/**',
      '**/test/integration/**cleanroom*',
      '**/test/integration/analysis-cleanroom*',
      '**/test/integration/production-deployment*',
    ],
  },
})
