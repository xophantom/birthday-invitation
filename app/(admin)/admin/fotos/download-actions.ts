'use server'

import { requireAdmin } from '@/lib/auth/session'
import { listFavoritePhotos, listPhotos } from '@/lib/db/queries/photos'

// `uploadedBy` é texto livre de até 120 caracteres digitado pelo convidado
// e vira nome de arquivo dentro do zip. Sem tratamento, `/`, `\`, `:` ou
// caracteres de controle produzem entrada de zip malformada (ou um caminho
// inesperado ao extrair), e um nome no limite de 120 caracteres produz um
// arquivo com nome absurdo. Mantemos letras, números, espaços e pontuação
// comum; removemos separadores de caminho, os caracteres reservados do
// Windows (`* ? " < > |`) e controles; cortamos em 50 caracteres — curto o
// bastante para não gerar nomes absurdos, longo o bastante para ainda
// identificar quem enviou. O índice (`0001-`, `0002-`...) sempre prefixa:
// é ele que garante nome único, não o texto do convidado.
const MAX_UPLOADER_NAME_LENGTH = 50
const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|\x00-\x1F\x7F]/g

function sanitizeUploaderName(rawName: string | null): string {
  const cleaned = (rawName ?? '')
    .replace(UNSAFE_FILENAME_CHARS, '')
    .trim()
    .slice(0, MAX_UPLOADER_NAME_LENGTH)
    .replace(/[.\s]+$/, '')

  return cleaned.length > 0 ? cleaned : 'convidado'
}

export async function getDownloadUrls(
  onlyFavorites: boolean
): Promise<{ url: string; name: string }[]> {
  await requireAdmin()

  // Server Action alcançável por POST direto: um `onlyFavorites` que não
  // seja booleano (ex.: string de um POST manual) some sem tocar o banco em
  // vez de seguir para as queries com um valor inesperado.
  if (typeof onlyFavorites !== 'boolean') return []

  const photos = onlyFavorites
    ? await listFavoritePhotos()
    : (await listPhotos({ limit: 5000 })).items

  return photos.map((photo, index) => ({
    url: photo.fullUrl,
    name: `${String(index + 1).padStart(4, '0')}-${sanitizeUploaderName(photo.uploadedBy)}.jpg`,
  }))
}
