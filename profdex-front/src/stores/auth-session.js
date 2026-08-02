export function applyAuthenticatedSession(user, hasRestoredSession, data) {
  user.value = data.user
  hasRestoredSession.value = true
}
