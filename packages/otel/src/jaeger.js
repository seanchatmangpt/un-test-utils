/**
 * Jaeger HTTP API client and fluent assertion wrapper.
 *
 * @param {{ url?: string }} [options={}]
 */
export function createJaegerClient(options = {}) {
  const base =
    options.url ??
    process.env.OTEL_COLLECTOR_URL ??
    process.env.JAEGER_URL ??
    'http://localhost:16686'

  async function isReachable() {
    try {
      const res = await fetch(`${base}/api/services`)
      return res.ok
    } catch {
      return false
    }
  }

  async function getServices() {
    const res = await fetch(`${base}/api/services`)
    if (!res.ok) throw new Error(`Jaeger /api/services returned ${res.status}`)
    const json = await res.json()
    return json.data
  }

  async function getTraces(serviceName, { limit = 20, lookbackMs = 60000 } = {}) {
    const end = Date.now() * 1000
    const start = (Date.now() - lookbackMs) * 1000
    const url = `${base}/api/traces?service=${encodeURIComponent(serviceName)}&limit=${limit}&start=${start}&end=${end}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Jaeger /api/traces returned ${res.status}`)
    const json = await res.json()
    return json.data
  }

  async function getOperations(serviceName) {
    const res = await fetch(`${base}/api/services/${encodeURIComponent(serviceName)}/operations`)
    if (!res.ok) throw new Error(`Jaeger operations returned ${res.status}`)
    const json = await res.json()
    return json.data
  }

  return { isReachable, getServices, getTraces, getOperations }
}

/**
 * Fluent assertion wrapper over an array of Jaeger trace objects.
 *
 * @param {Array<{ spans: Array<{ operationName: string, traceID: string, spanID: string, tags: Array<{ key: string, value: unknown }> }> }>} traces
 */
export function wrapJaegerExpect(traces) {
  function allSpans() {
    return traces.flatMap((t) => t.spans ?? [])
  }

  const wrapper = {
    expectSpanExists(operationName) {
      const spans = allSpans()
      const found = spans.find((s) => s.operationName === operationName)
      if (!found) {
        const names = [...new Set(spans.map((s) => s.operationName))].join(', ')
        throw new Error(
          `Expected span with operationName "${operationName}" but found: [${names}]`
        )
      }
      return wrapper
    },

    expectAllWellFormed() {
      const spans = allSpans()
      if (spans.length === 0) {
        throw new Error('expectAllWellFormed: no spans found')
      }
      for (const span of spans) {
        if (!span.traceID || !span.spanID || !span.operationName) {
          throw new Error(
            `expectAllWellFormed: span missing required fields — ${JSON.stringify(span)}`
          )
        }
      }
      return wrapper
    },

    expectSpanAttribute(operationName, key, value) {
      const spans = allSpans()
      const span = spans.find((s) => s.operationName === operationName)
      if (!span) {
        const names = [...new Set(spans.map((s) => s.operationName))].join(', ')
        throw new Error(
          `expectSpanAttribute: span "${operationName}" not found. Found: [${names}]`
        )
      }
      const tag = (span.tags ?? []).find((t) => t.key === key && t.value === value)
      if (!tag) {
        const existing = (span.tags ?? []).map((t) => `${t.key}=${JSON.stringify(t.value)}`).join(', ')
        throw new Error(
          `expectSpanAttribute: span "${operationName}" missing tag ${key}=${JSON.stringify(value)}. Tags: [${existing}]`
        )
      }
      return wrapper
    },

    expectMinSpanCount(n) {
      const count = allSpans().length
      if (count < n) {
        throw new Error(`expectMinSpanCount: expected >= ${n} spans but found ${count}`)
      }
      return wrapper
    },
  }

  return wrapper
}
