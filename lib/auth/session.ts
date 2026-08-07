import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { SESSION_COOKIE } from './cookie-name'
import { signSession, verifySessionToken } from './token'

export { SESSION_COOKIE }

const SESSION_MAX_AGE = 60 * 60 * 24 * 7

/**
 * Tamanho mínimo exigido para cada segredo. `jose` assina e verifica HS256
 * sem reclamar de chaves curtas — não há checagem embutida na biblioteca —
 * então um `SESSION_SECRET` fraco (ex.: "123") funciona silenciosamente até
 * alguém capturar um cookie e quebrar o HMAC offline em segundos, passando a
 * forjar sessões admin para sempre. RFC 7518 §3.2 exige ao menos 256 bits
 * (32 bytes) para HS256. `ADMIN_PASSWORD` recebe um mínimo mais modesto, só
 * para barrar valores triviais de teste.
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
 * `isAdminAuthenticated` é memoizado por request via `cache()` do React: se
 * uma action chamar `destroyAdminSession()` e, no mesmo request, algo
 * chamar `requireAdmin()` em seguida, o valor memoizado ainda é `true` — o
 * cookie já foi apagado, mas a checagem não roda de novo até o próximo
 * request. Não há vazamento entre requests distintos. Por isso toda action
 * de logout deve terminar chamando `redirect()`, que encerra o request atual
 * e faz o próximo carregar com memoização limpa.
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

// Nunca chame `requireAdmin()` dentro de um try/catch: o redirect funciona
// lançando `NEXT_REDIRECT`, uma exceção de controle de fluxo do Next. Um
// catch ao redor a engoliria e o código seguiria em frente sem autenticação,
// sem nenhum sinal em tempo de compilação.
export async function requireAdmin(): Promise<void> {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) redirect('/login')
}
