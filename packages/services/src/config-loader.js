/**
 * Config loader for un-test-utils.config.js
 *
 * Searches the project root for a config file, resolves it, and returns
 * the normalized service definitions.
 *
 * Config file format (un-test-utils.config.js or un-test-utils.config.mjs):
 *
 *   export default {
 *     services: {
 *       jaeger: { type: 'jaeger' },
 *       postgres: { type: 'postgres', environment: { POSTGRES_DB: 'mydb' } },
 *       redis: { type: 'redis' },
 *       custom: {
 *         image: 'my-service:latest',
 *         ports: [8080],
 *         environment: { API_KEY: 'test' },
 *         waitStrategy: { type: 'http', port: 8080, path: '/health' },
 *       },
 *     },
 *   }
 */

import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const CONFIG_NAMES = [
  'un-test-utils.config.js',
  'un-test-utils.config.mjs',
  'un-test-utils.config.ts',
]

/**
 * Find and load the config file.
 *
 * @param {string} [searchDir] Directory to search from (defaults to process.cwd())
 * @returns {Promise<import('./index.js').UnTestConfig | null>}
 */
export async function loadConfig(searchDir = process.cwd()) {
  for (const name of CONFIG_NAMES) {
    const candidate = join(searchDir, name)
    if (existsSync(candidate)) {
      const url = pathToFileURL(resolve(candidate)).href
      const mod = await import(url)
      const config = mod.default ?? mod
      return normalizeConfig(config)
    }
  }
  return null
}

/**
 * Normalize a raw config object into a consistent shape.
 */
function normalizeConfig(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('un-test-utils.config.js must export a plain object')
  }
  return {
    services: raw.services ?? {},
    ...raw,
  }
}
