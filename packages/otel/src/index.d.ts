// Type declarations for @un-test/otel

export interface JaegerSpan {
  traceID: string
  spanID: string
  operationName: string
  tags: Array<{ key: string; value: unknown }>
  duration: number
  startTime: number
}

export interface JaegerTrace {
  traceID: string
  spans: JaegerSpan[]
}

export interface JaegerClient {
  isReachable(): Promise<boolean>
  getServices(): Promise<string[]>
  getTraces(serviceName: string, options?: { limit?: number; lookbackMs?: number }): Promise<JaegerTrace[]>
  getOperations(serviceName: string): Promise<string[]>
}

export interface JaegerExpect {
  expectSpanExists(operationName: string): this
  expectAllWellFormed(): this
  expectSpanAttribute(operationName: string, key: string, value: unknown): this
  expectMinSpanCount(n: number): this
}

export function createJaegerClient(options?: { url?: string }): JaegerClient
export function wrapJaegerExpect(traces: JaegerTrace[]): JaegerExpect

export interface OtlpSpan {
  service_name: string
  event: string
  status: 'ok' | 'error'
  duration_ms: number
  algorithm?: string
  error?: string
  [key: string]: unknown
}

export function buildOtlpPayload(span: OtlpSpan): Record<string, unknown>
