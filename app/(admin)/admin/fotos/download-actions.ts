'use server'

import { requireAdmin } from '@/lib/auth/session'
import { listFavoritePhotos, listPhotos } from '@/lib/db/queries/photos'
import { sanitizeUploaderName } from '@/lib/photos/filename'

/**
 * Cap on photos included in a "download all" zip. Kept at 5x the default
 * `PHOTOS_GLOBAL_LIMIT` so raising the storage cap mid-event doesn't truncate
 * the zip, and lowering it doesn't start excluding rows already in the DB.
 *
 * Known limit: past this number `listPhotos`'s `nextCursor` is dropped and the
 * zip comes out incomplete with no on-screen warning. Raise it alongside
 * `PHOTOS_GLOBAL_LIMIT`.
 */
const DOWNLOAD_FETCH_LIMIT = 5000

export async function getDownloadUrls(
  onlyFavorites: boolean
): Promise<{ url: string; name: string }[]> {
  await requireAdmin()

  // Reachable by direct POST: a non-boolean `onlyFavorites` bails out instead
  // of reaching the queries with an unexpected value.
  if (typeof onlyFavorites !== 'boolean') return []

  const photos = onlyFavorites
    ? await listFavoritePhotos()
    : (await listPhotos({ limit: DOWNLOAD_FETCH_LIMIT })).items

  // The index prefix is what guarantees unique names inside the zip — never
  // the guest-typed text.
  return photos.map((photo, index) => ({
    url: photo.fullUrl,
    name: `${String(index + 1).padStart(4, '0')}-${sanitizeUploaderName(photo.uploadedBy)}.jpg`,
  }))
}
