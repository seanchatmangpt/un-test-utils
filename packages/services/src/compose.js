/**
 * Emit a docker-compose.yml from a resolved service config.
 *
 * Useful for:
 *   - Giving developers a manual "escape hatch" that mirrors the test setup
 *   - CI environments that prefer compose over testcontainers
 *   - Documentation: "here is the exact stack our tests use"
 */

import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SERVICE_PRESETS } from './presets.js'

/**
 * Render a docker-compose.yml string from a service config map.
 *
 * @param {Record<string, import('./index.js').ServiceConfig>} services
 * @returns {string} YAML content
 */
export function renderDockerCompose(services) {
  const lines = ['services:']

  for (const [name, config] of Object.entries(services)) {
    const preset = config.type ? SERVICE_PRESETS[config.type] : null
    const merged = preset ? { ...preset, ...config, environment: { ...preset.environment, ...config.environment } } : config

    lines.push(`  ${name}:`)
    lines.push(`    image: ${merged.image}`)

    if (merged.ports?.length) {
      lines.push('    ports:')
      for (const port of merged.ports) {
        lines.push(`      - "${port}:${port}"`)
      }
    }

    const env = merged.environment ?? {}
    if (Object.keys(env).length) {
      lines.push('    environment:')
      for (const [k, v] of Object.entries(env)) {
        lines.push(`      - ${k}=${v}`)
      }
    }

    lines.push('    restart: unless-stopped')
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Write a docker-compose.yml file to disk.
 *
 * @param {Record<string, import('./index.js').ServiceConfig>} services
 * @param {string} [outputDir='.'] Directory to write docker-compose.yml into
 * @returns {Promise<string>} Absolute path of the written file
 */
export async function emitDockerCompose(services, outputDir = '.') {
  const content = renderDockerCompose(services)
  const outPath = join(outputDir, 'docker-compose.yml')
  await writeFile(outPath, content, 'utf8')
  return outPath
}
