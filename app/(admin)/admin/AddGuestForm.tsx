'use client'

import { useActionState } from 'react'
import { addManualRsvp, type AdminActionResult } from './actions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const initialState: AdminActionResult = { ok: true }
const inputClass =
  'min-h-11 w-full rounded-xl border border-accent/30 bg-surface/60 px-4 text-foreground'

export function AddGuestForm() {
  const [state, action, pending] = useActionState(addManualRsvp, initialState)

  return (
    <Card>
      <h2 className="font-display text-xl text-accent-light">Adicionar confirmação</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Para quem confirmou por telefone ou WhatsApp.
      </p>

      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input name="fullName" placeholder="Nome completo" className={inputClass} required />
        <input name="phone" placeholder="Telefone (opcional)" className={inputClass} />
        <input
          name="companionsCount"
          type="number"
          min={0}
          max={20}
          defaultValue={0}
          placeholder="Acompanhantes"
          className={inputClass}
        />
        <input name="message" placeholder="Recado (opcional)" className={inputClass} />

        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : 'Adicionar'}
          </Button>
          {state.message && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {state.message}
            </p>
          )}
        </div>
      </form>
    </Card>
  )
}
