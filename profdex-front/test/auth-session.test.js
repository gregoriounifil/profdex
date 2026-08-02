import assert from 'node:assert/strict'
import test from 'node:test'
import { applyAuthenticatedSession } from '../src/stores/auth-session.js'

test('keeps the freshly authenticated user during the first navigation', () => {
  const user = { value: null }
  const hasRestoredSession = { value: false }
  const authenticatedUser = {
    id: 'user-1',
    matricula: '123',
    name: 'Treinador',
  }

  applyAuthenticatedSession(user, hasRestoredSession, {
    user: authenticatedUser,
  })

  assert.equal(user.value, authenticatedUser)
  assert.equal(hasRestoredSession.value, true)
})
