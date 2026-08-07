import { describe, expect, it } from 'vitest'
import { rsvpFormSchema } from './rsvp'

describe('rsvpFormSchema', () => {
  it('aceita apenas o nome completo, com os demais campos vazios', () => {
    const result = rsvpFormSchema.safeParse({
      fullName: 'Alice Fernandes',
      phone: '',
      companionsCount: 0,
      message: '',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita nome vazio', () => {
    const result = rsvpFormSchema.safeParse({ fullName: '   ', companionsCount: 0 })

    expect(result.success).toBe(false)
  })

  it('rejeita número negativo de acompanhantes', () => {
    const result = rsvpFormSchema.safeParse({
      fullName: 'Convidado Teste',
      companionsCount: -1,
    })

    expect(result.success).toBe(false)
  })

  it('converte acompanhantes vindos como texto do formulário', () => {
    const result = rsvpFormSchema.safeParse({
      fullName: 'Convidado Teste',
      companionsCount: '3',
    })

    expect(result.success).toBe(true)
    expect(result.data?.companionsCount).toBe(3)
  })
})
