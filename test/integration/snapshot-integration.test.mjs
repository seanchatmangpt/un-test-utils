import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'un-test-utils'
import { scenario } from '@un-test/scenario'
import { scenarios } from '../../src/core/scenarios/scenarios.js'

describe.concurrent('Snapshot Integration Tests', () => {
  describe.concurrent('Integration with Local Runner', () => {
    it('should work with runLocalCitty and snapshot assertions', async () => {
      const result = await runLocalCitty(['--show-help'], {
        env: { TEST_CLI: 'true' },
      })
      result.expectSuccess().expectSnapshotStdout('local-help-output')
    })

    it('should work with version snapshot', async () => {
      const result = await runLocalCitty(['--version'], {
        env: { TEST_CLI: 'true' },
      })
      result.expectSuccess().expectSnapshotStdout('local-version-output')
    })
  })

  describe.concurrent('Integration with Scenario DSL', () => {
    it('should work with scenario snapshot expectations', async () => {
      const result = await scenario('Scenario snapshot test')
        .step('Get help')
        .run('--show-help', { env: { TEST_CLI: 'true' } })
        .expectSuccess()
        .expectSnapshotStdout('scenario-help')
        .execute()
      expect(result.success).toBe(true)
    })

    it('should work with scenario snapshot steps', async () => {
      const result = await scenario('Scenario snapshot step test')
        .step('Get help')
        .run('--show-help', { env: { TEST_CLI: 'true' } })
        .expectSuccess()
        .snapshot('scenario-step-help')
        .execute()
      expect(result.success).toBe(true)
    })
  })

  describe.concurrent('Pre-built Snapshot Scenarios', () => {
    it('should work with snapshotHelp scenario', async () => {
      const result = await scenarios.snapshotHelp({ env: { TEST_CLI: 'true' } }).execute()
      expect(result.success).toBe(true)
    })

    it('should work with snapshotVersion scenario', async () => {
      const result = await scenarios.snapshotVersion({ env: { TEST_CLI: 'true' } }).execute()
      expect(result.success).toBe(true)
    })
  })
})
