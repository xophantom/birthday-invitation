'use server'

import { requireAdmin } from '@/lib/auth/session'
import { listFavoritePhotos, listPhotos } from '@/lib/db/queries/photos'
import { sanitizeUploaderName } from '@/lib/photos/filename'

/**
 * Teto de fotos que entram num zip "todas". Não é um número solto: o teto
 * real de fotos armazenadas é `PHOTOS_GLOBAL_LIMIT` (default 1000, ver
 * `lib/photos/global-limit.ts`), aplicado na emissão do token de upload e no
 * registro do par no banco. Este valor guarda 5x de folga sobre aquele
 * default, para que um aumento moderado do teto durante o evento não trunque
 * o zip — e, por ser folga e não igualdade, uma redução do teto também não
 * passa a excluir fotos antigas que já estão no banco.
 *
 * Limite conhecido: acima deste número o `nextCursor` de `listPhotos` é
 * descartado e o zip sai incompleto sem aviso na tela. Improvável no teto de
 * 1000; se `PHOTOS_GLOBAL_LIMIT` subir perto disso, este valor sobe junto.
 */
const DOWNLOAD_FETCH_LIMIT = 5000

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
    : (await listPhotos({ limit: DOWNLOAD_FETCH_LIMIT })).items

  // O índice (`0001-`, `0002-`...) sempre prefixa: é ele que garante nome
  // único dentro do zip, não o texto digitado pelo convidado.
  return photos.map((photo, index) => ({
    url: photo.fullUrl,
    name: `${String(index + 1).padStart(4, '0')}-${sanitizeUploaderName(photo.uploadedBy)}.jpg`,
  }))
}
