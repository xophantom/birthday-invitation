import { z } from 'zod'

/**
 * Shown when saving the RSVP fails for a reason that isn't the guest's fault.
 * Shared by the Server Action and the hook's fallback so the same failure
 * can't produce two different messages depending on which path caught it.
 */
export const RSVP_SUBMIT_ERROR_MESSAGE =
  'Não conseguimos registrar sua confirmação. Tente novamente em instantes.'

export const MAX_COMPANIONS = 20

function fullName(requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(3, { error: requiredMessage })
    .max(120, { error: 'Nome muito longo.' })
}

const rsvpBaseSchema = z.object({
  fullName: fullName('Informe seu nome completo.'),
  phone: z
    .string()
    .trim()
    .max(20, { error: 'Telefone muito longo.' })
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .max(500, { error: 'Recado muito longo.' })
    .optional()
    .or(z.literal('')),
})

/**
 * The guest form names each companion, so the head count is derived from the
 * list rather than typed. Objects rather than plain strings because that is
 * what React Hook Form's `useFieldArray` works with.
 */
export const rsvpFormSchema = rsvpBaseSchema.extend({
  companions: z
    .array(z.object({ fullName: fullName('Informe o nome completo do acompanhante.') }))
    .max(MAX_COMPANIONS, { error: `No máximo ${MAX_COMPANIONS} acompanhantes.` }),
})

/**
 * The admin's manual entry keeps a plain count: it records confirmations that
 * arrived by phone or WhatsApp, often as "me plus two", without the names.
 */
export const manualRsvpSchema = rsvpBaseSchema.extend({
  companionsCount: z.coerce
    .number({ error: 'Informe um número.' })
    .int({ error: 'Informe um número inteiro.' })
    .min(0, { error: 'Não pode ser negativo.' })
    .max(MAX_COMPANIONS, { error: `No máximo ${MAX_COMPANIONS} acompanhantes.` })
    .default(0),
})

export type RsvpFormValues = z.infer<typeof rsvpFormSchema>
export type ManualRsvpValues = z.infer<typeof manualRsvpSchema>
