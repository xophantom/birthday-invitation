'use server'

import { revalidatePath } from 'next/cache'
import type { AdminActionResult } from '../action-result'
import { requireAdmin } from '@/lib/auth/session'
import { togglePhotoFavorite } from '@/lib/db/queries/photos'
import { UUID_PATTERN } from '@/lib/validation/uuid'

// `setFavorite` é uma Server Action, alcançável por POST direto: um `id`
// fora do formato uuid faria o driver do Postgres lançar dentro da query, e
// um `isFavorite` que não seja booleano (ex.: string vinda de um POST
// manual) seguiria sem checagem de tipo em runtime até o `set` do Drizzle.
// Validamos os dois antes de tocar o banco e devolvemos erro tratado.
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
