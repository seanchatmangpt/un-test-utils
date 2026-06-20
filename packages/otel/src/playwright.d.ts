// Type declarations for @un-test/otel/playwright

export interface OtelSpan {
  service_name: string
  event: string
  status: 'ok' | 'error'
  duration_ms: number
  algorithm?: string
  error?: string
  [key: string]: unknown
}

export interface OtelCollector {
  readonly all: OtelSpan[]
  assertSpan(eventName: string, fields?: Partial<OtelSpan>): OtelSpan
  assertAllWellFormed(): void
  assertAllHaveServiceName(name: string): void
}

/** Call before page.goto() — registers a route interceptor for /api/otel-event */
export function createOtelCollector(page: import('@playwright/test').Page): OtelCollector
