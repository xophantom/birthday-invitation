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
    const result = computeTargetSize(693, 895, THUMB_MAX_SIDE)

    expect(result.height).toBe(400)
    expect(result.width / result.height).toBeCloseTo(693 / 895, 2)
  })

  it('trata imagem quadrada sem distorcer', () => {
    expect(computeTargetSize(3000, 3000, THUMB_MAX_SIDE)).toEqual({
      width: 400,
      height: 400,
    })
  })
})
