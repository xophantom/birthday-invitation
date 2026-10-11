'use client'

import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import type { AdminActionResult } from './action-result'
import { updateRsvp } from './actions'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import type { Rsvp } from '@/lib/db'
import { MAX_COMPANIONS } from '@/lib/validation/rsvp'

const inputClass =
  'min-h-11 w-full rounded-xl border border-accent/30 bg-surface-deep/60 px-4 text-foreground'

const initialState: AdminActionResult = { ok: true }

type Companion = { key: number; name: string }

/**
 * Ids carry the `edit-` prefix because this renders on the same page as
 * AddGuestForm, whose fields already own `fullName`, `phone` and `message`.
 */
export function EditGuestForm({ guest, onClose }: { guest: Rsvp; onClose: () => void }) {
  const [companions, setCompanions] = useState<Companion[]>(() =>
    guest.companionNames.map((name, key) => ({ key, name }))
  )
  // Stable keys for rows added later, past the ones taken above.
  const nextKey = useRef(guest.companionNames.length)
  // Companions still known only by number: a phone confirmation, or an RSVP
  // from before the form asked for names. Kept apart so names can replace
  // them one at a time without the total ever being guessed.
  const [unnamed, setUnnamed] = useState(() =>
    Math.max(0, guest.companionsCount - guest.companionNames.length)
  )
  const addButtonRef = useRef<HTMLButtonElement>(null)
  // A key to focus once the list re-renders, or -1 for the add button. The
  // added row doesn't exist yet when the click handler runs, and a removed
  // row takes its focused button with it.
  const pendingFocus = useRef<number | null>(null)

  useEffect(() => {
    const target = pendingFocus.current
    if (target === null) return
    pendingFocus.current = null
    if (target < 0) addButtonRef.current?.focus()
    else document.getElementById(`edit-companion-${target}`)?.focus()
  }, [companions])

  const [state, action, pending] = useActionState(
    async (previous: AdminActionResult, formData: FormData) => {
      const result = await updateRsvp(previous, formData)
      // Same as the removal modal: close only on success, inside a transition
      // so the close and the refreshed table land together.
      if (result.ok) startTransition(onClose)
      return result
    },
    initialState
  )

  function addCompanion() {
    const key = nextKey.current++
    pendingFocus.current = key
    setCompanions((list) => [...list, { key, name: '' }])
  }

  function removeCompanion(index: number) {
    // The row before, or for the first row the one sliding into its place.
    const neighbour = companions[index - 1] ?? companions[index + 1]
    pendingFocus.current = neighbour ? neighbour.key : -1
    setCompanions((list) => list.filter((_, i) => i !== index))
  }

  const total = companions.length + (Number.isFinite(unnamed) ? unnamed : 0)

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={guest.id} />

      <h2 className="font-display text-xl text-accent-light">Editar confirmação</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Nome completo" htmlFor="edit-fullName">
          <input
            id="edit-fullName"
            name="fullName"
            defaultValue={guest.fullName}
            required
            minLength={3}
            maxLength={120}
            className={inputClass}
          />
        </FormField>

        <FormField label="Telefone" htmlFor="edit-phone" optional>
          <input
            id="edit-phone"
            name="phone"
            type="tel"
            defaultValue={guest.phone ?? ''}
            maxLength={20}
            className={inputClass}
          />
        </FormField>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm text-foreground">
          Acompanhantes
          <span className="ml-2 text-foreground/60">total: {total}</span>
        </legend>

        {companions.length > 0 && (
          <ul className="flex flex-col gap-3">
            {companions.map((companion, index) => {
              const id = `edit-companion-${companion.key}`

              return (
                <li key={companion.key}>
                  <FormField label={`Acompanhante ${index + 1}`} htmlFor={id}>
                    <div className="flex items-center gap-2">
                      <input
                        id={id}
                        name="companionNames"
                        value={companion.name}
                        onChange={(event) => {
                          const name = event.target.value
                          setCompanions((list) =>
                            list.map((c) => (c.key === companion.key ? { ...c, name } : c))
                          )
                        }}
                        placeholder="Nome completo"
                        required
                        minLength={3}
                        maxLength={120}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => removeCompanion(index)}
                        aria-label={`Remover acompanhante ${index + 1}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
                          <path
                            d="M6 6l12 12M18 6L6 18"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </FormField>
                </li>
              )
            })}
          </ul>
        )}

        {total < MAX_COMPANIONS && (
          <button
            ref={addButtonRef}
            type="button"
            onClick={addCompanion}
            className="group inline-flex min-h-11 items-center gap-3 self-start rounded-full pr-4 text-sm text-accent-light"
          >
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/50 transition-colors group-hover:border-accent group-hover:bg-accent/10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              </svg>
            </span>
            Adicionar acompanhante
          </button>
        )}

        <FormField
          label="Acompanhantes sem nome"
          htmlFor="edit-unnamed"
          hint="Quem vem mas ainda não tem nome na lista. Ao dar nome a um deles, diminua este número."
        >
          <input
            id="edit-unnamed"
            name="unnamedCompanions"
            type="number"
            min={0}
            max={MAX_COMPANIONS}
            value={Number.isFinite(unnamed) ? unnamed : ''}
            onChange={(event) => setUnnamed(event.target.valueAsNumber)}
            aria-describedby="edit-unnamed-hint"
            className={`${inputClass} max-w-32`}
          />
        </FormField>
      </fieldset>

      <FormField label="Recado" htmlFor="edit-message" optional>
        <textarea
          id="edit-message"
          name="message"
          rows={3}
          defaultValue={guest.message ?? ''}
          maxLength={500}
          className={`${inputClass} py-3`}
        />
      </FormField>

      {!state.ok && state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
