import { describe, expect, it } from 'vitest'
import { signSession, verifySessionToken } from './token'

const SECRET = 'segredo-de-teste-com-tamanho-suficiente-1234567890'
const OTHER_SECRET = 'outro-segredo-completamente-diferente-0987654321'

describe('sessão do admin', () => {
  it('aceita um token que ela mesma assinou', async () => {
    const token = await signSession(SECRET)

    await expect(verifySessionToken(token, SECRET)).resolves.toBe(true)
  })

  it('rejeita token assinado com outra chave', async () => {
    const token = await signSession(OTHER_SECRET)

    await expect(verifySessionToken(token, SECRET)).resolves.toBe(false)
  })

  it('rejeita token adulterado', async () => {
    const token = await signSession(SECRET)
    const tampered = `${token.slice(0, -4)}aaaa`

    await expect(verifySessionToken(tampered, SECRET)).resolves.toBe(false)
  })

  it('rejeita token expirado', async () => {
    const token = await signSession(SECRET, -10)

    await expect(verifySessionToken(token, SECRET)).resolves.toBe(false)
  })

  it('rejeita ausência de token', async () => {
    await expect(verifySessionToken(undefined, SECRET)).resolves.toBe(false)
  })
})
