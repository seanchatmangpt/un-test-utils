/**
 * Service orchestrator — starts/stops containers via testcontainers.
 *
 * Reads un-test-utils.config.js (or inline config), merges service presets,
 * starts each container, maps ports, and injects env vars so consuming tests
 * can find services without hardcoding ports.
 */

import { GenericContainer, Wait } from 'testcontainers'
import { SERVICE_PRESETS } from './presets.js'

/** Active container instances keyed by service name */
const _containers = new Map()

/** Resolved URLs keyed by service name */
const _urls = new Map()

/** Injected env vars from all started services */
const _injectedEnv = {}

/**
 * Build a GenericContainer for a service config.
 */
function buildContainer(name, config) {
  const preset = config.type ? SERVICE_PRESETS[config.type] : null
  const merged = preset
    ? {
        ...preset,
        ...config,
        environment: { ...preset.environment, ...config.environment },
      }
    : config

  if (!merged.image) throw new Error(`Service "${name}" has no image — set image: or type:`)

  let builder = new GenericContainer(merged.image)

  // Exposed ports
  const ports = merged.ports ?? []
  if (ports.length) {
    builder = builder.withExposedPorts(...ports)
  }

  // Environment variables
  const env = merged.environment ?? {}
  for (const [k, v] of Object.entries(env)) {
    builder = builder.withEnvironment(k, v)
  }

  // Wait strategy
  const wait = merged.waitStrategy
  if (wait) {
    if (wait.type === 'http') {
      builder = builder.withWaitStrategy(
        Wait.forHttp(wait.path ?? '/', wait.port ?? ports[0]).forStatusCode(wait.statusCode ?? 200)
      )
    } else if (wait.type === 'log') {
      builder = builder.withWaitStrategy(Wait.forLogMessage(wait.message))
    } else if (wait.type === 'healthcheck') {
      builder = builder.withWaitStrategy(Wait.forHealthCheck())
    }
  }

  // Labels for identification
  builder = builder.withLabels({ 'un-test.service': name, 'un-test.type': config.type ?? 'custom' })

  return { builder, merged }
}

/**
 * Start a single service container.
 *
 * @param {string} name
 * @param {import('./index.js').ServiceConfig} config
 * @returns {Promise<{ url: unknown, mappedPorts: Record<number, number> }>}
 */
export async function startService(name, config) {
  if (_containers.has(name)) {
    console.warn(`[un-test/services] ${name} already started — reusing`)
    return { url: _urls.get(name), mappedPorts: _containers.get(name).__mappedPorts }
  }

  const { builder, merged } = buildContainer(name, config)

  console.info(`[un-test/services] starting ${name} (${merged.image})…`)
  const container = await builder.start()

  // Build port mapping: containerPort -> hostPort
  const mappedPorts = {}
  for (const port of merged.ports ?? []) {
    mappedPorts[port] = container.getMappedPort(port)
  }

  // Resolve URL via preset urlFn or custom fn
  const urlFn = merged.urlFn
  const url = urlFn ? urlFn(mappedPorts, merged.environment ?? {}) : null

  // Inject env vars
  const envKeys = merged.envKeys ?? {}
  for (const [key, fn] of Object.entries(envKeys)) {
    const value = fn(mappedPorts, merged.environment ?? {})
    process.env[key] = value
    _injectedEnv[key] = value
  }

  container.__mappedPorts = mappedPorts
  _containers.set(name, container)
  _urls.set(name, url)

  console.info(`[un-test/services] ${name} ready — ports: ${JSON.stringify(mappedPorts)}`)
  return { url, mappedPorts }
}

/**
 * Start all services from a config object.
 *
 * @param {Record<string, import('./index.js').ServiceConfig>} services
 * @returns {Promise<Record<string, { url: unknown, mappedPorts: Record<number, number> }>>}
 */
export async function startServices(services) {
  const results = {}
  // Start in parallel
  await Promise.all(
    Object.entries(services).map(async ([name, config]) => {
      results[name] = await startService(name, config)
    })
  )
  return results
}

/**
 * Stop a single service container.
 */
export async function stopService(name) {
  const container = _containers.get(name)
  if (!container) return
  await container.stop()
  _containers.delete(name)
  _urls.delete(name)
}

/**
 * Stop all running service containers.
 */
export async function stopServices() {
  await Promise.all([..._containers.keys()].map(stopService))
}

/**
 * Get the mapped host port for a service's container port.
 */
export function getMappedPort(serviceName, containerPort) {
  const container = _containers.get(serviceName)
  if (!container) throw new Error(`Service "${serviceName}" is not running`)
  return container.getMappedPort(containerPort)
}

/**
 * Get the resolved URL for a started service.
 */
export function getServiceUrl(serviceName) {
  if (!_urls.has(serviceName)) throw new Error(`Service "${serviceName}" is not running`)
  return _urls.get(serviceName)
}

/**
 * All env vars injected by started services.
 */
export function getInjectedEnv() {
  return { ..._injectedEnv }
}

/**
 * Whether any containers are currently running.
 */
export function hasRunningServices() {
  return _containers.size > 0
}
