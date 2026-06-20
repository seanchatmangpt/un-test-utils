// Type declarations for @un-test/services

export interface WaitStrategyHttp {
  type: 'http'
  port?: number
  path?: string
  statusCode?: number
}

export interface WaitStrategyLog {
  type: 'log'
  message: string
}

export interface WaitStrategyHealthcheck {
  type: 'healthcheck'
}

export type WaitStrategy = WaitStrategyHttp | WaitStrategyLog | WaitStrategyHealthcheck

export interface ServiceConfig {
  /** Well-known service type — fills in image, ports, waitStrategy, envKeys */
  type?: 'jaeger' | 'postgres' | 'redis' | 'mysql' | 'mongodb'
  /** Docker image (required when type is not set) */
  image?: string
  /** Container ports to expose (host port is auto-assigned) */
  ports?: number[]
  /** Environment variables to set inside the container */
  environment?: Record<string, string>
  /** How to determine when the container is ready */
  waitStrategy?: WaitStrategy
  /** How to derive the service URL from mapped ports */
  urlFn?: (mappedPorts: Record<number, number>, env: Record<string, string>) => unknown
  /** Map of env var name -> value function; injected into process.env after startup */
  envKeys?: Record<string, (ports: Record<number, number>, env: Record<string, string>) => string>
}

export interface UnTestConfig {
  services: Record<string, ServiceConfig>
}

export interface ServiceResult {
  url: unknown
  mappedPorts: Record<number, number>
}

export declare function loadConfig(searchDir?: string): Promise<UnTestConfig | null>

export declare function startService(name: string, config: ServiceConfig): Promise<ServiceResult>
export declare function startServices(services: Record<string, ServiceConfig>): Promise<Record<string, ServiceResult>>
export declare function stopService(name: string): Promise<void>
export declare function stopServices(): Promise<void>
export declare function getMappedPort(serviceName: string, containerPort: number): number
export declare function getServiceUrl(serviceName: string): unknown
export declare function getInjectedEnv(): Record<string, string>
export declare function hasRunningServices(): boolean

export { SERVICE_PRESETS } from './presets.js'
