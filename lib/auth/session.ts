import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { SESSION_COOKIE } from './cookie-name'
import { signSession, verifySessionToken } from './token'

const SESSION_MAX_AGE = 60 * 60 * 24 * 7

/**
 * `jose` signs and verifies HS256 without complaining about short keys, so a
 * weak `SESSION_SECRET` works silently until someone captures a cookie and
 * brute-forces the HMAC offline in seconds. RFC 7518 §3.2 requires at least
 * 256 bits for HS256; `ADMIN_PASSWORD` gets a smaller minimum, just enough to
 * reject trivial test values.
 */
const MIN_ENV_LENGTH: Record<'ADMIN_PASSWORD' | 'SESSION_SECRET', number> = {
  ADMIN_PASSWORD: 16,
  SESSION_SECRET: 32,
}

function requiredEnv(name: 'ADMIN_PASSWORD' | 'SESSION_SECRET'): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} não definida.`)

  const min = MIN_ENV_LENGTH[name]
  if (value.length < min) {
    throw new Error(`${name} precisa ter pelo menos ${min} caracteres.`)
  }

  return value
}

export function verifyPassword(candidate: string): boolean {
  const expected = createHash('sha256').update(requiredEnv('ADMIN_PASSWORD')).digest()
  const received = createHash('sha256').update(candidate).digest()

  return timingSafeEqual(expected, received)
}

export async function createAdminSession(): Promise<void> {
  const token = await signSession(requiredEnv('SESSION_SECRET'), SESSION_MAX_AGE)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

/**
 * `isAdminAuthenticated` is memoized per request, so calling this and then
 * `requireAdmin()` in the same request still sees `true` — the cookie is gone
 * but the check won't rerun. Nothing leaks across requests, but every sign-out
 * action must end in `redirect()` so the next request starts memoization
 * clean.
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export const isAdminAuthenticated = cache(async (): Promise<boolean> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  return verifySessionToken(token, requiredEnv('SESSION_SECRET'))
})

// Never call this inside a try/catch: the redirect works by throwing
// `NEXT_REDIRECT`, so a surrounding catch would swallow it and let the code
// continue unauthenticated, with no compile-time warning.
export async function requireAdmin(): Promise<void> {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) redirect('/login')
}
