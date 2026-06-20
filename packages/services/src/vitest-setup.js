/**
 * Vitest global setup integration for @un-test/services.
 *
 * Add to vitest.config.js:
 *   import { vitestGlobalSetup } from '@un-test/services/vitest-setup'
 *   export default defineConfig({
 *     test: {
 *       globalSetup: vitestGlobalSetup(),
 *     }
 *   })
 *
 * Or directly in your globalSetup file:
 *   import { setup, teardown } from '@un-test/services/vitest-setup'
 *   export { setup, teardown }
 */

import { loadConfig } from './config-loader.js'
import { startServices, stopServices, getInjectedEnv } from './orchestrator.js'

/**
 * Returns a path to a generated globalSetup module.
 * Use as: globalSetup: [vitestGlobalSetup()]
 */
export function vitestGlobalSetup() {
  // Return 'this module' path — vitest will import it and call setup/teardown
  return import.meta.url.replace('file://', '')
}

/**
 * Vitest globalSetup hook — starts all services declared in un-test-utils.config.js
 */
export async function setup() {
  const config = await loadConfig(process.cwd())
  if (!config || !Object.keys(config.services).length) return

  const serviceNames = Object.keys(config.services)
  console.info(`[un-test/services] starting ${serviceNames.length} service(s): ${serviceNames.join(', ')}`)

  await startServices(config.services)

  const env = getInjectedEnv()
  const envSummary = Object.entries(env).map(([k, v]) => `  ${k}=${v}`).join('\n')
  if (envSummary) {
    console.info(`[un-test/services] injected env:\n${envSummary}`)
  }
}

/**
 * Vitest globalSetup teardown hook — stops all running service containers
 */
export async function teardown() {
  await stopServices()
  console.info('[un-test/services] all services stopped')
}
