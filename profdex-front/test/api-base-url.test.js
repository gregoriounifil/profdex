import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveApiBaseUrl } from '../src/services/api-base-url.js'

test('uses the same-origin API proxy in production', () => {
  assert.equal(
    resolveApiBaseUrl({
      isDevelopment: false,
      configuredUrl: 'https://backend.example/api',
    }),
    '/api',
  )
})

test('allows an explicit backend URL only during local development', () => {
  assert.equal(
    resolveApiBaseUrl({
      isDevelopment: true,
      configuredUrl: 'http://localhost:3000/api',
    }),
    'http://localhost:3000/api',
  )
})
