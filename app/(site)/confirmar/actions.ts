'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createRsvpRecord } from '@/lib/db/queries/rsvp'
import { RSVP_SUBMIT_ERROR_MESSAGE, rsvpFormSchema, type RsvpFormValues } from '@/lib/validation/rsvp'

export type RsvpActionResult =
  | { ok: true }
  | {
      ok: false
      message: string
      fieldErrors?: Partial<Record<keyof RsvpFormValues, string[]>>
    }

export async function createRsvp(values: unknown): Promise<RsvpActionResult> {
  const parsed = rsvpFormSchema.safeParse(values)

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Confira os campos destacados.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  try {
    await createRsvpRecord(parsed.data, 'guest')
  } catch (error) {
    console.error('Falha ao gravar RSVP:', error)
    return {
      ok: false,
      message: RSVP_SUBMIT_ERROR_MESSAGE,
    }
  }

  // Keeps the admin list fresh as soon as someone confirms.
  revalidatePath('/admin')

  return { ok: true }
}
