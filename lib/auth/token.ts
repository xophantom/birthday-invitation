import { SignJWT, jwtVerify } from 'jose'

const ALGORITHM = 'HS256'
const AUDIENCE = 'convite-admin'

function toKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export async function signSession(
  secret: string,
  expiresInSeconds = 60 * 60 * 24 * 7
): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(toKey(secret))
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false

  try {
    await jwtVerify(token, toKey(secret), {
      algorithms: [ALGORITHM],
      audience: AUDIENCE,
    })
    return true
  } catch {
    return false
  }
}
