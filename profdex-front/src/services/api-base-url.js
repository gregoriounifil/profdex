export function resolveApiBaseUrl({ isDevelopment, configuredUrl }) {
  if (isDevelopment && configuredUrl) return configuredUrl
  return '/api'
}
