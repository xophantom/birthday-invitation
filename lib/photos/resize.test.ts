import { describe, expect, it } from 'vitest'
import { computeTargetSize, FULL_MAX_SIDE, THUMB_MAX_SIDE } from './resize'

describe('computeTargetSize', () => {
  it('preserva imagens menores que o limite', () => {
    expect(computeTargetSize(800, 600, FULL_MAX_SIDE)).toEqual({ width: 800, height: 600 })
  })

  it('reduz pelo lado maior em imagem paisagem', () => {
    expect(computeTargetSize(4000, 3000, FULL_MAX_SIDE)).toEqual({
      width: 2048,
      height: 1536,
    })
  })

  it('reduz pelo lado maior em imagem retrato', () => {
    expect(computeTargetSize(3000, 4000, FULL_MAX_SIDE)).toEqual({
      width: 1536,
      height: 2048,
    })
  })

  it('mantém a proporção ao gerar thumbnail', () => {
    expect(computeTargetSize(693, 895, THUMB_MAX_SIDE)).toEqual({ width: 310, height: 400 })
  })

  it('trata imagem quadrada sem distorcer', () => {
    expect(computeTargetSize(3000, 3000, THUMB_MAX_SIDE)).toEqual({
      width: 400,
      height: 400,
    })
  })

  it('nunca devolve dimensão zero em proporção extrema', () => {
    // Valor exato, não `>= 1`: o resultado é determinístico (ratio 0.004,
    // `Math.round(1 * 0.004)` é 0 e o piso o eleva a 1) e uma afirmação
    // frouxa deixaria passar qualquer regressão que devolvesse outro valor
    // positivo — inaceitável num projeto com três testes no total.
    expect(computeTargetSize(1, 100000, THUMB_MAX_SIDE)).toEqual({ width: 1, height: 400 })
  })
})
