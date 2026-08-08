import { z } from 'zod'

/**
 * Shown when saving the RSVP fails for a reason that isn't the guest's fault.
 * Shared by the Server Action and the hook's fallback so the same failure
 * can't produce two different messages depending on which path caught it.
 */
export const RSVP_SUBMIT_ERROR_MESSAGE =
  'Não conseguimos registrar sua confirmação. Tente novamente em instantes.'

export const rsvpFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, { error: 'Informe seu nome completo.' })
    .max(120, { error: 'Nome muito longo.' }),
  phone: z
    .string()
    .trim()
    .max(20, { error: 'Telefone muito longo.' })
    .optional()
    .or(z.literal('')),
  companionsCount: z.coerce
    .number({ error: 'Informe um número.' })
    .int({ error: 'Informe um número inteiro.' })
    .min(0, { error: 'Não pode ser negativo.' })
    .max(20, { error: 'No máximo 20 acompanhantes.' })
    .default(0),
  message: z
    .string()
    .trim()
    .max(500, { error: 'Recado muito longo.' })
    .optional()
    .or(z.literal('')),
})

export type RsvpFormValues = z.infer<typeof rsvpFormSchema>
