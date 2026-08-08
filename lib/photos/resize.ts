/**
 * Scales down proportionally so the longest side fits `maxSide`. Images
 * already below the limit are left alone — upscaling only adds weight.
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
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

export const FULL_MAX_SIDE = 2048
export const THUMB_MAX_SIDE = 400
export const FULL_QUALITY = 0.83
export const THUMB_QUALITY = 0.7
