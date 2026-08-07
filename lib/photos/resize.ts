/**
 * Reduz proporcionalmente para que o maior lado caiba em `maxSide`.
 * Imagens menores que o limite são preservadas — ampliar só adiciona peso sem detalhe.
 */
export function computeTargetSize(
  width: number,
  height: number,
  maxSide: number
): { width: number; height: number } {
  const largest = Math.max(width, height)

  if (largest <= maxSide) {
    return { width, height }
  }

  const ratio = maxSide / largest

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

export const FULL_MAX_SIDE = 2048
export const THUMB_MAX_SIDE = 400
export const FULL_QUALITY = 0.83
export const THUMB_QUALITY = 0.7
