'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { countPhotos, createPhotoRecord } from '@/lib/db/queries/photos'
import { getPhotosGlobalLimit, PHOTOS_LIMIT_REACHED_MESSAGE } from '@/lib/photos/global-limit'
import { isPhotosPathname, PHOTOS_PATHNAME_PREFIX } from '@/lib/photos/pathname'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extracts our store id from `BLOB_READ_WRITE_TOKEN`, the same way the SDK
 * does internally: the token is `vercel_blob_rw_<storeId>_<secret>`.
 * Lowercased because it is compared against a hostname.
 *
 * Returns `null` — never a wildcard — when the token is missing or malformed;
 * without the real store id there is no way to confirm a URL is ours, so
 * callers must reject rather than accept everything.
 *
 * Only the positive result is cached. Caching `null` would condemn every
 * `registerPhoto` in an instance that started without the env var to reject
 * forever, silently leaving orphan blobs and zero rows.
 */
let cachedStoreId: string | undefined

function getBlobStoreId(): string | null {
  if (cachedStoreId === undefined) {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    const storeId = token?.split('_')[3]?.toLowerCase()

    if (!storeId) return null

    cachedStoreId = storeId
  }
  return cachedStoreId
}

/**
 * Public Vercel Blob URLs look like
 * `https://{storeId}.public.blob.vercel-storage.com/{pathname}`.
 *
 * Pinned to our own store id: matching any `*.public.blob.vercel-storage.com`
 * would let a hostile caller create their own store, upload anything under
 * `photos/`, and register the URL here as if it were ours.
 *
 * Every rejection is logged with the offending URL — if this regex ever drifts
 * from the real format, the only symptom is "upload succeeded, registration
 * refused" and the guest-facing message stays generic.
 */
const blobUrl = z
  .url()
  .refine(
    (value) => {
      const storeId = getBlobStoreId()

      if (!storeId) {
        console.error(
          'registerPhoto recusou uma URL porque BLOB_READ_WRITE_TOKEN está ausente ou em formato inesperado — sem o id da store não é possível confirmar a origem da URL:',
          value
        )
        return false
      }

      const pattern = new RegExp(
        `^https://${escapeRegExp(storeId)}\\.public\\.blob\\.vercel-storage\\.com/${PHOTOS_PATHNAME_PREFIX}`,
        'i'
      )
      const matches = pattern.test(value)

      if (!matches) {
        console.error('registerPhoto recusou uma URL fora do formato esperado do Blob:', value)
      }

      return matches
    },
    { error: 'URL fora do armazenamento esperado.' }
  )

/**
 * The stored pathname is what `del(pathname)` will delete when the admin
 * removes a photo, so a caller-chosen pathname could wipe any blob in the
 * store. The prefix check alone doesn't stop a pathname pointing at a
 * *different* blob under `photos/` — `pathnameMatchesUrl` below closes that.
 *
 * Same function as the token route uses, so the two halves can't drift.
 */
const blobPathname = z
  .string()
  .min(1)
  .refine(
    (value) => {
      const matches = isPhotosPathname(value)
      if (!matches) {
        console.error('registerPhoto recusou um pathname fora do prefixo esperado:', value)
      }
      return matches
    },
    { error: 'Caminho fora do armazenamento esperado.' }
  )

/** The SDK builds URLs as host + "/" + pathname, so the two must line up.
 *  Confirms the caller didn't pair a URL with someone else's pathname. */
function pathnameMatchesUrl(url: string, pathname: string): boolean {
  let actualPathname: string
  try {
    actualPathname = new URL(url).pathname
  } catch {
    return false
  }

  const matches = actualPathname === `/${pathname}`
  if (!matches) {
    console.error('registerPhoto recusou um pathname que não corresponde à URL informada:', {
      url,
      pathname,
    })
  }
  return matches
}

const registerPhotoSchema = z
  .object({
    fullUrl: blobUrl,
    thumbUrl: blobUrl,
    fullPathname: blobPathname,
    thumbPathname: blobPathname,
    uploadedBy: z.string().trim().max(120).nullable(),
  })
  .refine((data) => pathnameMatchesUrl(data.fullUrl, data.fullPathname), {
    error: 'O caminho da foto não corresponde à URL informada.',
  })
  .refine((data) => pathnameMatchesUrl(data.thumbUrl, data.thumbPathname), {
    error: 'O caminho da miniatura não corresponde à URL informada.',
  })

export type RegisterPhotoResult = { ok: true } | { ok: false; message: string }

export async function registerPhoto(input: unknown): Promise<RegisterPhotoResult> {
  const parsed = registerPhotoSchema.safeParse(input)

  if (!parsed.success) {
    console.error('registerPhoto recebeu payload inválido:', z.treeifyError(parsed.error))
    return { ok: false, message: 'Não foi possível registrar a foto.' }
  }

  try {
    // The upload route enforces the same cap, but it only stops whoever
    // uploads *bytes*. This action is reachable by direct POST, so without
    // the check a tiny payload could fill the cap and lock out real guests.
    const total = await countPhotos()

    if (total >= getPhotosGlobalLimit()) {
      console.error('registerPhoto recusado: teto global de fotos atingido.')
      return { ok: false, message: PHOTOS_LIMIT_REACHED_MESSAGE }
    }

    await createPhotoRecord(parsed.data)
  } catch (error) {
    console.error('Falha ao registrar foto:', error)
    return { ok: false, message: 'Não foi possível registrar a foto.' }
  }

  revalidatePath('/admin/fotos')

  return { ok: true }
}
