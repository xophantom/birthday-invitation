'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createRsvpRecord } from '@/lib/db/queries/rsvp'
import { rsvpFormSchema, type RsvpFormValues } from '@/lib/validation/rsvp'

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
      message: 'Não conseguimos registrar sua confirmação. Tente novamente em instantes.',
    }
  }

  // Mantém a lista do admin (Fase 5) atualizada assim que alguém confirma.
  revalidatePath('/admin')

  return { ok: true }
}
