/**
 * @fileoverview Integration tests for analysis CLI commands
 * @description Validates BLOCKER 1: analysis commands actually execute and produce
 * meaningful output rather than falling back to help text.
 *
 * Each test verifies:
 *   1. The command exits with code 0
 *   2. The output contains content specific to that command's execution
 *   3. The output is NOT primarily help/usage text (which would indicate the
 *      command silently fell through to the help handler)
 */

import { describe, it, expect } from 'vitest'
import { runLocalCitty } from '@un-test/runners-local'

describe.concurrent('Analysis Commands Validation (BLOCKER 1)', () => {
  const env = { TEST_CLI: 'true' }

  // ---------------------------------------------------------------------------
  // analysis stats
  // ---------------------------------------------------------------------------
  describe.concurrent('analysis stats', () => {
    it('executes and outputs actual coverage statistics (not help text)', async () => {
      const result = await runLocalCitty(['analysis', 'stats'], { env })
      result.expectSuccess()

      const output = result.stdout + result.stderr
      // Command outputs these headings when it runs correctly
      expect(output).toContain('Main Command')
      expect(output).toContain('Subcommands')
      // Must NOT be primarily a help/usage response
      expect(output).not.toMatch(/^Usage:/m)
    })

    it('shows --help when explicitly requested (control case)', async () => {
      const result = await runLocalCitty(['analysis', 'stats', '--help'], { env })
      result.expectSuccess()

      const output = result.stdout + result.stderr
      expect(output).toMatch(/Usage:|USAGE|--help/i)
    })
  })

  // ---------------------------------------------------------------------------
  // analysis discover
  // ---------------------------------------------------------------------------
  describe.concurrent('analysis discover', () => {
    it('executes and outputs CLI structure discovery report (not help text)', async () => {
      const result = await runLocalCitty(['analysis', 'discover'], { env })
      result.expectSuccess()

      const output = result.stdout + result.stderr
      // The text report always opens with this heading
      expect(output).toContain('CLI Structure Discovery Report')
      // Must contain the discovery summary section
      expect(output).toContain('Discovery Summary')
      // Must NOT be primarily a help/usage response
      expect(output).not.toMatch(/^Usage:/m)
    })

    it('shows --help when explicitly requested (control case)', async () => {
      const result = await runLocalCitty(['analysis', 'discover', '--help'], { env })
      result.expectSuccess()

      const output = result.stdout + result.stderr
      expect(output).toMatch(/Usage:|USAGE|--help/i)
    })
  })

  // ---------------------------------------------------------------------------
  // analysis coverage
  // ---------------------------------------------------------------------------
  describe.concurrent('analysis coverage', () => {
    it('executes and outputs test coverage data (not help text)', async () => {
      const result = await runLocalCitty(['analysis', 'coverage'], { env })
      result.expectSuccess()

      const output = result.stdout + result.stderr
      // The text coverage report always opens with this heading
      expect(output).toContain('Test Coverage Analysis Report')
      // Must contain coverage statistics section
      expect(output).toContain('Coverage Statistics')
      // Must NOT be primarily a help/usage response
      expect(output).not.toMatch(/^Usage:/m)
    })

    it('shows --help when explicitly requested (control case)', async () => {
      const result = await runLocalCitty(['analysis', 'coverage', '--help'], { env })
      result.expectSuccess()

      const output = result.stdout + result.stderr
      expect(output).toMatch(/Usage:|USAGE|--help/i)
    })
  })

  // ---------------------------------------------------------------------------
  // analysis recommend
  // ---------------------------------------------------------------------------
  describe.concurrent('analysis recommend', () => {
    it('executes and outputs recommendations report (not help text)', async () => {
      const result = await runLocalCitty(['analysis', 'recommend'], { env })
      result.expectSuccess()

      const output = result.stdout + result.stderr
      // The text recommendation report always opens with this heading
      expect(output).toContain('Smart Recommendations Report')
      // Must contain the summary section
      expect(output).toContain('Recommendation Summary')
      // Must NOT be primarily a help/usage response
      expect(output).not.toMatch(/^Usage:/m)
    })

    it('shows --help when explicitly requested (control case)', async () => {
      const result = await runLocalCitty(['analysis', 'recommend', '--help'], { env })
      result.expectSuccess()

      const output = result.stdout + result.stderr
      expect(output).toMatch(/Usage:|USAGE|--help/i)
    })
  })

  // ---------------------------------------------------------------------------
  // analysis report
  // ---------------------------------------------------------------------------
  describe.concurrent('analysis report', () => {
    it('executes and outputs a coverage report summary (not help text)', async () => {
      const result = await runLocalCitty(['analysis', 'report'], { env })
      result.expectSuccess()

      const output = result.stdout + result.stderr
      // The text report always opens with this heading
      expect(output).toContain('Summary')
      // The report includes overall coverage line
      expect(output).toContain('Overall')
      // Must NOT be primarily a help/usage response
      expect(output).not.toMatch(/^Usage:/m)
    })

    it('shows --help when explicitly requested (control case)', async () => {
      const result = await runLocalCitty(['analysis', 'report', '--help'], { env })
      result.expectSuccess()

      const output = result.stdout + result.stderr
      expect(output).toMatch(/Usage:|USAGE|--help/i)
    })
  })
})
