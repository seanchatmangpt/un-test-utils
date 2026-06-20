/**
 * Well-known service presets for @un-test/services.
 *
 * Each preset defines the Docker image, port mappings, environment defaults,
 * health-check strategy, and how to derive the service URL after startup.
 *
 * Consumers can override any field by spreading the preset into their config.
 */

export const SERVICE_PRESETS = {
  jaeger: {
    image: 'jaegertracing/all-in-one:1.57',
    ports: [16686, 4317, 4318],
    environment: {
      COLLECTOR_OTLP_ENABLED: 'true',
    },
    // Wait for the Jaeger UI API to respond
    waitStrategy: { type: 'http', port: 16686, path: '/api/services', statusCode: 200 },
    urlFn: (mappedPorts) => ({
      ui: `http://localhost:${mappedPorts[16686]}`,
      otlpHttp: `http://localhost:${mappedPorts[4318]}`,
      otlpGrpc: `http://localhost:${mappedPorts[4317]}`,
    }),
    envKeys: {
      OTEL_COLLECTOR_URL: (ports) => `http://localhost:${ports[16686]}`,
      WASM4PM_OTEL_ENDPOINT: (ports) => `http://localhost:${ports[4318]}`,
      JAEGER_URL: (ports) => `http://localhost:${ports[16686]}`,
    },
  },

  postgres: {
    image: 'postgres:16-alpine',
    ports: [5432],
    environment: {
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'test',
    },
    waitStrategy: { type: 'log', message: 'database system is ready to accept connections' },
    urlFn: (mappedPorts, env) =>
      `postgresql://${env.POSTGRES_USER ?? 'test'}:${env.POSTGRES_PASSWORD ?? 'test'}@localhost:${mappedPorts[5432]}/${env.POSTGRES_DB ?? 'test'}`,
    envKeys: {
      DATABASE_URL: (ports, env) =>
        `postgresql://${env.POSTGRES_USER ?? 'test'}:${env.POSTGRES_PASSWORD ?? 'test'}@localhost:${ports[5432]}/${env.POSTGRES_DB ?? 'test'}`,
    },
  },

  redis: {
    image: 'redis:7-alpine',
    ports: [6379],
    waitStrategy: { type: 'log', message: 'Ready to accept connections' },
    urlFn: (mappedPorts) => `redis://localhost:${mappedPorts[6379]}`,
    envKeys: {
      REDIS_URL: (ports) => `redis://localhost:${ports[6379]}`,
    },
  },

  mysql: {
    image: 'mysql:8',
    ports: [3306],
    environment: {
      MYSQL_ROOT_PASSWORD: 'test',
      MYSQL_DATABASE: 'test',
      MYSQL_USER: 'test',
      MYSQL_PASSWORD: 'test',
    },
    waitStrategy: { type: 'log', message: 'port: 3306  MySQL Community Server' },
    urlFn: (mappedPorts, env) =>
      `mysql://${env.MYSQL_USER ?? 'test'}:${env.MYSQL_PASSWORD ?? 'test'}@localhost:${mappedPorts[3306]}/${env.MYSQL_DATABASE ?? 'test'}`,
    envKeys: {
      DATABASE_URL: (ports, env) =>
        `mysql://${env.MYSQL_USER ?? 'test'}:${env.MYSQL_PASSWORD ?? 'test'}@localhost:${ports[3306]}/${env.MYSQL_DATABASE ?? 'test'}`,
    },
  },

  mongodb: {
    image: 'mongo:7',
    ports: [27017],
    waitStrategy: { type: 'log', message: 'Waiting for connections' },
    urlFn: (mappedPorts) => `mongodb://localhost:${mappedPorts[27017]}`,
    envKeys: {
      MONGODB_URL: (ports) => `mongodb://localhost:${ports[27017]}`,
    },
  },
}
