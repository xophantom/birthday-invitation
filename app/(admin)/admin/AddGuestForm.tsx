'use client'

import { useActionState } from 'react'
import type { AdminActionResult } from './action-result'
import { addManualRsvp } from './actions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'

/**
 * With `useActionState`, inputs keep what was typed between submissions unless
 * a reset key is controlled. Without it, a host on a phone (table below the
 * fold) sees no sign the guest was saved, taps "Adicionar" again, and inflates
 * the catering count — and duplicate names are allowed by design, so nothing
 * else stops it.
 */
type AddGuestState = AdminActionResult & { resetKey: number }

const initialState: AddGuestState = { ok: true, resetKey: 0 }
const inputClass =
  'min-h-11 w-full rounded-xl border border-accent/30 bg-surface/60 px-4 text-foreground'

export function AddGuestForm() {
  const [state, action, pending] = useActionState(
    async (previous: AddGuestState, formData: FormData): Promise<AddGuestState> => {
      const result = await addManualRsvp(previous, formData)

      // Only clear on a real write; on error the input stays on screen to be
      // corrected instead of vanishing.
      return { ...result, resetKey: result.ok ? previous.resetKey + 1 : previous.resetKey }
    },
    initialState
  )

  return (
    <Card>
      {/*
        Live region mounted from first paint and never unmounted — same reason
        as in PhotoUploader. The "Sucesso:"/"Erro:" prefix is announced on
        purpose: the visible distinction exists for people who can't tell
        `text-highlight` from `text-danger`, so announcing the raw message
        would hand the whole problem back to screen reader users.
      */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {state.message ? `${state.ok ? 'Sucesso' : 'Erro'}: ${state.message}` : ''}
      </div>

      <h2 className="font-display text-xl text-accent-light">Adicionar confirmação</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Para quem confirmou por telefone ou WhatsApp.
      </p>

      <form action={action} className="mt-4 flex flex-col gap-4">
        {/* Remounting this div is what clears the fields. */}
        <div key={state.resetKey} className="grid gap-3 sm:grid-cols-2">
          <FormField label="Nome completo" htmlFor="fullName">
            <input id="fullName" name="fullName" className={inputClass} required />
          </FormField>

          <FormField label="Telefone" htmlFor="phone" optional>
            <input id="phone" name="phone" type="tel" className={inputClass} />
          </FormField>

          <FormField
            label="Acompanhantes"
            htmlFor="companionsCount"
            hint="Quantas pessoas vêm além do convidado."
          >
            <input
              id="companionsCount"
              name="companionsCount"
              type="number"
              min={0}
              max={20}
              defaultValue={0}
              aria-describedby="companionsCount-hint"
              className={inputClass}
            />
          </FormField>

          <FormField label="Recado" htmlFor="message" optional>
            <input id="message" name="message" className={inputClass} />
          </FormField>
        </div>

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : 'Adicionar'}
          </Button>

          {/* No role/aria-live: the live region above already announces this.
              Success and error differ by prefix and border, not colour
              alone. */}
          {state.message &&
            (state.ok ? (
              <p className="mt-2 border-l-2 border-highlight pl-2 text-sm text-highlight">
                <span className="font-medium">Sucesso:</span> {state.message}
              </p>
            ) : (
              <p className="mt-2 border-l-2 border-danger pl-2 text-sm text-danger">
                <span className="font-medium">Erro:</span> {state.message}
              </p>
            ))}
        </div>
      </form>
    </Card>
  )
}
