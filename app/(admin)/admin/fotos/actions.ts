'use server'

import { revalidatePath } from 'next/cache'
import type { AdminActionResult } from '../action-result'
import { requireAdmin } from '@/lib/auth/session'
import { togglePhotoFavorite } from '@/lib/db/queries/photos'
import { UUID_PATTERN } from '@/lib/validation/uuid'

// Reachable by direct POST: a malformed uuid would make the Postgres driver
// throw inside the query, and a non-boolean `isFavorite` would reach Drizzle's
// `set` unchecked. Both are validated before touching the DB.
export async function setFavorite(id: string, isFavorite: boolean): Promise<AdminActionResult> {
  await requireAdmin()

  if (!UUID_PATTERN.test(id) || typeof isFavorite !== 'boolean') {
    return { ok: false, message: 'Dados inválidos.' }
  }

  try {
    await togglePhotoFavorite(id, isFavorite)
  } catch (error) {
    console.error('Falha ao favoritar foto:', error)
    return { ok: false, message: 'Não foi possível salvar a alteração.' }
  }

  revalidatePath('/admin/fotos')
  return { ok: true }
}
