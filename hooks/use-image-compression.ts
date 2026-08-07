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
  originalName: string
}

const HEIC_TYPES = ['image/heic', 'image/heif']

const ERRO_CONVERSAO_HEIC =
  'Não foi possível converter esta foto (formato HEIC/HEIF). Tente outra foto.'
const ERRO_DECODIFICACAO =
  'Não foi possível abrir esta foto. Ela pode estar corrompida ou em um formato não suportado.'
const ERRO_CANVAS_INDISPONIVEL = 'Não foi possível processar imagens neste navegador.'
const ERRO_CODIFICACAO = 'Não foi possível gerar o arquivo desta foto. Tente novamente.'

/**
 * Converte HEIC/HEIF (padrão de câmera do iPhone) para JPEG antes de
 * qualquer outro processamento — nem `createImageBitmap` nem a maioria dos
 * navegadores decodificam HEIC nativamente. Carregada sob demanda (`await
 * import`) porque `heic2any` é uma dependência pesada e a maior parte dos
 * envios não precisa dela (Android e câmeras que já entregam JPEG).
 */
async function toJpegIfNeeded(file: File): Promise<File> {
  const isHeic = HEIC_TYPES.includes(file.type) || /\.hei[cf]$/i.test(file.name)

  if (!isHeic) return file

  try {
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    const blob = Array.isArray(converted) ? converted[0] : converted

    return new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), {
      type: 'image/jpeg',
    })
  } catch (error) {
    console.error('Falha ao converter HEIC para JPEG:', error)
    throw new Error(ERRO_CONVERSAO_HEIC)
  }
}

/**
 * Decodifica a foto em um `ImageBitmap` já com a orientação EXIF aplicada.
 *
 * Fotos de iPhone em retrato guardam a rotação no EXIF, não nos pixels.
 * `createImageBitmap` ignora esse metadado por padrão — diferente de
 * `<img>`, que sempre respeitou. A opção `imageOrientation: 'from-image'`
 * corrige isso, mas só é aceita em Safari (desktop e iOS) a partir da
 * versão 16: confirmado em caniuse.com, na tabela específica do valor
 * 'from-image' da opção `imageOrientation` de `createImageBitmap`
 * (https://caniuse.com/mdn-api_createimagebitmap_options_imageorientation_parameter_from-image),
 * que lista Safari/iOS 3.2–15.8 como não suportado e 16.0+ como suportado.
 * iOS 16 é de set/2022; em ago/2026 é a esmagadora maioria dos aparelhos,
 * mas ainda existe quem não atualiza.
 *
 * Em navegador sem suporte, passar a opção rejeita a Promise (o
 * comportamento exato varia por engine — pode ser rejeição assíncrona ou
 * lançamento síncrono de erro na conversão do argumento). O `try/await`
 * abaixo cobre os dois casos e refaz a decodificação sem a opção. Nesse
 * caminho alternativo a orientação EXIF não é corrigida — a foto pode sair
 * deitada — mas o envio não quebra, e é a mesma limitação que qualquer
 * aplicação teria sem essa opção do navegador.
 */
async function decodeBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return await createImageBitmap(file)
  }
}

/**
 * Troca a extensão do nome original por `.jpg` e marca o tamanho gerado.
 * A saída desta pipeline é sempre JPEG (ver `encodeSize`), então o nome do
 * arquivo tem que refletir isso — o route handler da Task 3 assina o token
 * de upload com `allowedContentTypes: ['image/jpeg']` e recusa o resto.
 */
function buildOutputName(originalName: string, suffix: 'full' | 'thumb'): string {
  const withoutExtension = originalName.replace(/\.[^./\\]+$/, '')
  return `${withoutExtension}-${suffix}.jpg`
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // `toBlob` devolve `null` quando a codificação falha (memória,
        // canvas corrompido etc.). Tratar isso como sucesso geraria um
        // `File` de tamanho zero que só quebraria lá na frente, no upload.
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
 * Desenha o bitmap no tamanho calculado por `computeTargetSize` — nunca um
 * cálculo próprio — e codifica como JPEG na qualidade pedida.
 *
 * 2048px (FULL_MAX_SIDE) no maior lado fica muito abaixo do limite de área
 * de canvas do Safari iOS: o limite histórico é 4096×4096 / 16.777.216px
 * totais, ampliado para 8192×8192 / 67.108.864px a partir do iOS 18 — fonte:
 * https://longviewcoder.com/2024/02/09/konva-canvas-limits-in-safari-ios-explainer/
 * (e reproduzido em vários relatos de bug, ex.
 * https://github.com/wojtekmaj/react-pdf/issues/1149). Um canvas de
 * 2048×2048 tem 4.194.304px — menos de um quarto até do limite antigo, e
 * nenhuma foto de celular chega perto de 2048×2048 tendo os dois lados no
 * teto (uma foto 4:3 ou 16:9 sempre tem um lado bem menor que o outro
 * depois do redimensionamento). Por isso não construí detecção de estouro
 * de canvas: a fatia deste requisito que a Task 4 cobre (full/thumb com
 * `FULL_MAX_SIDE`/`THUMB_MAX_SIDE` atuais) nunca se aproxima do limite.
 *
 * Libera o canvas ao final, sucesso ou erro: zerar `width` descarta o
 * buffer de pixels que ele mantém — comportamento documentado pela MDN
 * para a propriedade `width` de `HTMLCanvasElement`
 * (https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/width,
 * seção de descrição: redefinir `width`/`height` reinicia o estado do
 * contexto e limpa o buffer). Relevante porque o Safari iOS também limita
 * memória total de canvas, e o cenário real daqui é várias fotos de 12MP
 * numa aba de celular.
 */
async function encodeSize(
  bitmap: ImageBitmap,
  maxSide: number,
  quality: number,
  fileName: string
): Promise<File> {
  const { width, height } = computeTargetSize(bitmap.width, bitmap.height, maxSide)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error(ERRO_CANVAS_INDISPONIVEL)
    }

    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await canvasToJpeg(canvas, quality)
    return new File([blob], fileName, { type: 'image/jpeg' })
  } finally {
    canvas.width = 0
    canvas.height = 0
  }
}

/**
 * Comprime uma foto para os dois tamanhos do acervo (full e thumbnail).
 *
 * Decodifica uma única vez com `createImageBitmap` e reaproveita o bitmap
 * para as duas saídas — decodificar duas vezes dobraria o custo do passo
 * mais caro, num aparelho de convidado, no meio de uma festa. Sem Web
 * Worker próprio: `createImageBitmap` já decodifica fora da thread
 * principal e `toBlob` é assíncrono, então o que sobra na thread principal
 * é o `drawImage` — pequeno o bastante para não travar a interface.
 */
export function useImageCompression() {
  const compress = useCallback(async (file: File): Promise<CompressedPair> => {
    const source = await toJpegIfNeeded(file)

    let bitmap: ImageBitmap
    try {
      bitmap = await decodeBitmap(source)
    } catch (error) {
      console.error('Falha ao decodificar imagem:', error)
      throw new Error(ERRO_DECODIFICACAO)
    }

    try {
      const full = await encodeSize(
        bitmap,
        FULL_MAX_SIDE,
        FULL_QUALITY,
        buildOutputName(source.name, 'full')
      )
      const thumb = await encodeSize(
        bitmap,
        THUMB_MAX_SIDE,
        THUMB_QUALITY,
        buildOutputName(source.name, 'thumb')
      )

      return { full, thumb, originalName: source.name }
    } finally {
      bitmap.close()
    }
  }, [])

  return { compress }
}
