import { describe, expect, it } from 'vitest'
import { MAX_COMPANIONS, manualRsvpSchema, rsvpFormSchema } from './rsvp'

describe('rsvpFormSchema', () => {
  it('aceita apenas o nome completo, com os demais campos vazios', () => {
    const result = rsvpFormSchema.safeParse({
      fullName: 'Alice Fernandes',
      phone: '',
      companions: [],
      message: '',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita nome vazio', () => {
    const result = rsvpFormSchema.safeParse({ fullName: '   ', companions: [] })

    expect(result.success).toBe(false)
  })

  it('aceita acompanhantes com nome completo, sem espaços nas pontas', () => {
    const result = rsvpFormSchema.safeParse({
      fullName: 'Convidado Teste',
      companions: [{ fullName: '  Bruno Lima ' }, { fullName: 'Carla Souza' }],
    })

    expect(result.success).toBe(true)
    expect(result.data?.companions.map((c) => c.fullName)).toEqual(['Bruno Lima', 'Carla Souza'])
  })

  it('rejeita acompanhante adicionado sem nome', () => {
    const result = rsvpFormSchema.safeParse({
      fullName: 'Convidado Teste',
      companions: [{ fullName: 'Bruno Lima' }, { fullName: '  ' }],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['companions', 1, 'fullName'])
  })

  it('rejeita mais acompanhantes que o limite', () => {
    const result = rsvpFormSchema.safeParse({
      fullName: 'Convidado Teste',
      companions: Array.from({ length: MAX_COMPANIONS + 1 }, (_, i) => ({
        fullName: `Acompanhante ${i + 1}`,
      })),
    })

    expect(result.success).toBe(false)
  })
})

describe('manualRsvpSchema', () => {
  it('rejeita número negativo de acompanhantes', () => {
    const result = manualRsvpSchema.safeParse({
      fullName: 'Convidado Teste',
      companionsCount: -1,
    })

    expect(result.success).toBe(false)
  })

  it('converte acompanhantes vindos como texto do formulário', () => {
    const result = manualRsvpSchema.safeParse({
      fullName: 'Convidado Teste',
      companionsCount: '3',
    })

    expect(result.success).toBe(true)
    expect(result.data?.companionsCount).toBe(3)
  })
})
