import { z } from 'zod'

/**
 * Mensagem exibida quando a gravação do RSVP falha por um motivo que não é
 * culpa do convidado (banco fora do ar, DATABASE_URL ausente, etc). Mantida
 * num só lugar porque ela é usada tanto pela Server Action (`actions.ts`)
 * quanto pelo fallback do hook (`use-rsvp-form.ts`): antes desta constante o
 * mesmo texto estava escrito literalmente nos dois arquivos, e nada além de
 * atenção impedia que uma edição futura mudasse um e esquecesse o outro —
 * deixando o convidado ver mensagens diferentes para a mesma falha conforme
 * o caminho de erro. As duas cópias nunca chegaram a divergir; a extração é
 * preventiva.
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
