/**
 * Converts a flat span object into a minimal OTLP ExportTraceServiceRequest JSON body.
 *
 * @param {{ service_name: string, event: string, status: string, duration_ms: number, algorithm?: string, error?: string, [key: string]: unknown }} span
 * @returns {object} OTLP ExportTraceServiceRequest body
 */
export function buildOtlpPayload(span) {
  const { service_name, event, status, duration_ms, ...extra } = span

  const traceId = crypto.randomUUID().replace(/-/g, '')
  const spanId = traceId.slice(0, 16)

  const statusCode = status === 'ok' ? 1 : status === 'error' ? 2 : 0

  const startTimeUnixNano = String(Date.now() * 1_000_000)
  const endTimeUnixNano = String((Date.now() + duration_ms) * 1_000_000)

  const reservedKeys = new Set(['service_name', 'event', 'status', 'duration_ms'])
  const attributes = Object.entries(extra)
    .filter(([k]) => !reservedKeys.has(k))
    .map(([key, value]) => ({
      key,
      value: { stringValue: String(value) },
    }))

  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: service_name } },
          ],
        },
        scopeSpans: [
          {
            scope: { name: '@un-test/otel' },
            spans: [
              {
                traceId,
                spanId,
                name: event,
                startTimeUnixNano,
                endTimeUnixNano,
                attributes,
                status: { code: statusCode },
              },
            ],
          },
        ],
      },
    ],
  }
}
