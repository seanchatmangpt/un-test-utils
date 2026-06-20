/**
 * Creates an OTEL span collector that intercepts POST requests to **\/api/otel-event
 * via Playwright's page.route().
 *
 * @param {object} page - Playwright Page object
 * @returns {{ all: Array<object>, assertSpan(eventName: string, fields?: object): object, assertAllWellFormed(): void, assertAllHaveServiceName(name: string): void }}
 */
export function createOtelCollector(page) {
  /** @type {Array<object>} */
  const spans = []

  page.route('**/api/otel-event', async (route) => {
    try {
      const body = route.request().postDataJSON()
      if (body) spans.push(body)
    } catch {
      // ignore unparseable bodies
    }
    await route.continue()
  })

  return {
    get all() {
      return spans
    },

    /**
     * @param {string} eventName
     * @param {object} [fields={}]
     * @returns {object} the matching span
     */
    assertSpan(eventName, fields = {}) {
      const match = spans.find((s) => s.event === eventName)
      if (!match) {
        const found = spans.map((s) => s.event).join(', ')
        throw new Error(
          `assertSpan: no span with event "${eventName}". Found events: [${found}]`
        )
      }
      for (const [key, expected] of Object.entries(fields)) {
        if (match[key] !== expected) {
          throw new Error(
            `assertSpan: span "${eventName}" field "${key}" expected ${JSON.stringify(expected)} but got ${JSON.stringify(match[key])}`
          )
        }
      }
      return match
    },

    /**
     * Throws if no spans were collected or any span is missing required fields.
     */
    assertAllWellFormed() {
      if (spans.length === 0) {
        throw new Error('assertAllWellFormed: no spans collected')
      }
      for (const span of spans) {
        const missing = ['service_name', 'event', 'status', 'duration_ms'].filter(
          (f) => span[f] == null
        )
        if (missing.length > 0) {
          throw new Error(
            `assertAllWellFormed: span missing fields [${missing.join(', ')}] — ${JSON.stringify(span)}`
          )
        }
      }
    },

    /**
     * @param {string} name
     */
    assertAllHaveServiceName(name) {
      const bad = spans.filter((s) => s.service_name !== name)
      if (bad.length > 0) {
        const found = [...new Set(bad.map((s) => s.service_name))].join(', ')
        throw new Error(
          `assertAllHaveServiceName: expected all spans to have service_name "${name}" but found: [${found}]`
        )
      }
    },
  }
}
