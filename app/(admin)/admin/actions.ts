'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { AdminActionResult } from './action-result'
import { destroyAdminSession, requireAdmin } from '@/lib/auth/session'
import { createRsvpRecord, removeRsvp, updateRsvpRecord } from '@/lib/db/queries/rsvp'
import { editRsvpSchema, manualRsvpSchema } from '@/lib/validation/rsvp'
import { UUID_PATTERN } from '@/lib/validation/uuid'

export async function addManualRsvp(
  _state: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  await requireAdmin()

  const parsed = manualRsvpSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone') ?? '',
    companionsCount: formData.get('companionsCount') ?? 0,
    message: formData.get('message') ?? '',
  })

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error).fieldErrors
    return { ok: false, message: flat.fullName?.[0] ?? 'Confira os dados informados.' }
  }

  try {
    await createRsvpRecord(parsed.data, 'admin')
  } catch (error) {
    console.error('Falha ao adicionar confirmação manual:', error)
    return { ok: false, message: 'Não foi possível adicionar.' }
  }

  revalidatePath('/admin')
  return { ok: true, message: 'Confirmação adicionada à lista.' }
}

export async function updateRsvp(
  _state: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  await requireAdmin()

  // Same guard as deleteRsvp: reachable by direct POST with any `id`.
  const id = String(formData.get('id') ?? '')
  if (!UUID_PATTERN.test(id)) {
    return { ok: false, message: 'Convidado inválido.' }
  }

  const parsed = editRsvpSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone') ?? '',
    message: formData.get('message') ?? '',
    // One input per companion, all sharing this name.
    companionNames: formData.getAll('companionNames'),
    unnamedCompanions: formData.get('unnamedCompanions') ?? 0,
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Confira os dados informados.' }
  }

  try {
    const found = await updateRsvpRecord(id, parsed.data)
    if (!found) {
      return { ok: false, message: 'Esta confirmação não está mais na lista.' }
    }
  } catch (error) {
    console.error('Falha ao editar confirmação:', error)
    return { ok: false, message: 'Não foi possível salvar. Tente novamente.' }
  }

  revalidatePath('/admin')
  return { ok: true }
}

export async function deleteRsvp(
  _state: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  await requireAdmin()

  // Reachable by direct POST with any `id`. A malformed uuid would make the
  // Postgres driver throw inside the query.
  const id = String(formData.get('id') ?? '')
  if (!UUID_PATTERN.test(id)) {
    return { ok: false, message: 'Convidado inválido.' }
  }

  // On flaky party wifi an unhandled DB failure would surface as Next's raw
  // error screen; here it becomes a message inside the modal.
  try {
    await removeRsvp(id)
  } catch (error) {
    console.error('Falha ao remover confirmação:', error)
    return { ok: false, message: 'Não foi possível remover. Tente novamente.' }
  }

  revalidatePath('/admin')
  return { ok: true }
}

// Deliberate exception to "every action calls requireAdmin() first": requiring
// a valid session to sign out would strand anyone holding an expired cookie,
// breaking the button exactly when it is needed. Calling it without a session
// at worst deletes a cookie that was already gone.
export async function signOut(): Promise<void> {
  await destroyAdminSession()
  redirect('/login')
}
