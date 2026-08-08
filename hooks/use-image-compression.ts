'use client'

import { useCallback } from 'react'
import {
  computeTargetSize,
  FULL_MAX_SIDE,
  FULL_QUALITY,
  THUMB_MAX_SIDE,
  THUMB_QUALITY,
} from '@/lib/photos/resize'

export type CompressedPair = {
  full: File
  thumb: File
}

const HEIC_TYPES = ['image/heic', 'image/heif']

/** Checks the extension too: `.heic` files often arrive with an empty `type`
 *  because the OS lacks the MIME mapping. */
function isHeic(file: File): boolean {
  return HEIC_TYPES.includes(file.type) || /\.hei[cf]$/i.test(file.name)
}

const ERRO_CONVERSAO_HEIC =
  'Não foi possível converter esta foto (formato HEIC/HEIF). Tente outra foto.'
const ERRO_DECODIFICACAO =
  'Não foi possível abrir esta foto. Ela pode estar corrompida ou em um formato não suportado.'
const ERRO_CANVAS_INDISPONIVEL = 'Não foi possível processar imagens neste navegador.'
const ERRO_CODIFICACAO = 'Não foi possível gerar o arquivo desta foto. Tente novamente.'

/**
 * Converts HEIC/HEIF (iPhone camera default) to JPEG — most browsers can't
 * decode it. `heic2any` is loaded on demand because it is heavy and most
 * uploads don't need it.
 *
 * On failure returns the **original** file instead of throwing: heic2any 0.0.4
 * chokes on real-world variants (HDR, 10-bit, multi-image), but Safari decodes
 * HEIC natively, so `decodeImage` may still open it via the `<img>` path. If
 * that also fails, `compress()` throws ERRO_CONVERSAO_HEIC.
 */
async function toJpegIfNeeded(file: File): Promise<File> {
  if (!isHeic(file)) return file

  try {
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    const blob = Array.isArray(converted) ? converted[0] : converted

    return new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), {
      type: 'image/jpeg',
    })
  } catch (error) {
    console.error('Falha ao converter HEIC para JPEG, tentando decodificar o original:', error)
    return file
  }
}

/** Decoded source ready for `drawImage`. Dimensions are explicit because the
 *  two possible sources expose them under different properties, and `release`
 *  abstracts `ImageBitmap.close()` vs. `URL.revokeObjectURL`. */
type DecodedImage = {
  source: ImageBitmap | HTMLImageElement
  width: number
  height: number
  release: () => void
}

/**
 * Decodes once, with EXIF orientation applied, for reuse across both outputs.
 *
 * Safari and iOS Safari up to 15.8 implement `imageOrientation` but reject the
 * `'from-image'` value at the WebIDL enum level, and their default ignores
 * EXIF — so retrying without the option would not help. The fallback decodes
 * through `<img>`, which those engines always orient correctly.
 * https://caniuse.com/mdn-api_createimagebitmap_options_imageorientation_parameter_from-image
 */
async function decodeImage(file: File): Promise<DecodedImage> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    }
  } catch {
    return decodeViaImageElement(file)
  }
}

/** The object URL is revoked only in `release()` — the `<img>` must stay valid
 *  while both outputs are drawn from it. */
async function decodeViaImageElement(file: File): Promise<DecodedImage> {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.src = url

  try {
    await img.decode()
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }

  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  }
}

/** Output is always JPEG (see `encodeSize`), and the upload route signs tokens
 *  with `allowedContentTypes: ['image/jpeg']`, so the name must match. */
function buildOutputName(originalName: string, suffix: 'full' | 'thumb'): string {
  const withoutExtension = originalName.replace(/\.[^./\\]+$/, '')
  return `${withoutExtension}-${suffix}.jpg`
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // `toBlob` yields null when encoding fails; treating that as success
        // would produce a zero-byte File that only breaks later, at upload.
        if (!blob) {
          reject(new Error(ERRO_CODIFICACAO))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * Draws the decoded source at the size from `computeTargetSize` and encodes it
 * as JPEG.
 *
 * Canvas area stays far below the iOS Safari limit (4096x4096 before iOS 18):
 * FULL_MAX_SIDE is 2048 on the longest side, so no phone photo comes close.
 * There is deliberately no overflow detection.
 */
async function encodeSize(
  source: ImageBitmap | HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  maxSide: number,
  quality: number,
  fileName: string
): Promise<File> {
  const { width, height } = computeTargetSize(sourceWidth, sourceHeight, maxSide)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error(ERRO_CANVAS_INDISPONIVEL)
    }

    // Default is 'low', which aliases badly on the ~10x downscale of the
    // thumbnail. Applied to both outputs so they don't differ in sharpness.
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(source, 0, 0, width, height)

    const blob = await canvasToJpeg(canvas, quality)
    return new File([blob], fileName, { type: 'image/jpeg' })
  } finally {
    // Zeroing width/height discards the pixel buffer — iOS Safari also caps
    // total canvas memory, and guests upload several 12MP photos in a row.
    canvas.width = 0
    canvas.height = 0
  }
}

/**
 * Compresses a photo into the two sizes the gallery stores (full and thumb).
 *
 * Decodes once and reuses the source for both outputs — the decode is the
 * expensive step, on a guest's phone, during a party. No Web Worker:
 * `createImageBitmap` already decodes off the main thread and `toBlob` is
 * async, leaving only `drawImage` on it.
 */
export function useImageCompression() {
  const compress = useCallback(async (file: File): Promise<CompressedPair> => {
    const source = await toJpegIfNeeded(file)
    // Only true when `toJpegIfNeeded` hit its catch (on success it always
    // returns a new File). Used solely to pick the right error message if the
    // native decode also fails.
    const heicConversionFailed = source === file && isHeic(file)

    let decoded: DecodedImage
    try {
      decoded = await decodeImage(source)
    } catch (error) {
      console.error('Falha ao decodificar imagem:', error)
      throw new Error(heicConversionFailed ? ERRO_CONVERSAO_HEIC : ERRO_DECODIFICACAO)
    }

    try {
      const full = await encodeSize(
        decoded.source,
        decoded.width,
        decoded.height,
        FULL_MAX_SIDE,
        FULL_QUALITY,
        buildOutputName(source.name, 'full')
      )
      const thumb = await encodeSize(
        decoded.source,
        decoded.width,
        decoded.height,
        THUMB_MAX_SIDE,
        THUMB_QUALITY,
        buildOutputName(source.name, 'thumb')
      )

      return { full, thumb }
    } finally {
      decoded.release()
    }
  }, [])

  return { compress }
}
