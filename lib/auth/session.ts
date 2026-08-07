import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { signSession, verifySessionToken } from './token'

export const SESSION_COOKIE = 'convite_admin'

const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function requiredEnv(name: 'ADMIN_PASSWORD' | 'SESSION_SECRET'): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} não definida.`)
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

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export const isAdminAuthenticated = cache(async (): Promise<boolean> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  return verifySessionToken(token, requiredEnv('SESSION_SECRET'))
})

export async function requireAdmin(): Promise<void> {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) redirect('/login')
}
